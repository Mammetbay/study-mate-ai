import { LanguageCode } from '../config/languages';

const GROQ_API_URL = 'https://api.groq.com/openai/v1';

// --- Whisper Types ---

interface WhisperSegment {
  id: number;
  start: number;
  end: number;
  text: string;
  no_speech_prob: number;
}

interface WhisperVerboseResponse {
  text: string;
  segments: WhisperSegment[];
  language: string;
  duration: number;
}

// --- Whisper Hallucination & Text Normalization ---

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/i̇/g, 'i')
    .replace(/ı/g, 'i')
    .replace(/ş/g, 's')
    .replace(/ç/g, 'c')
    .replace(/ö/g, 'o')
    .replace(/ü/g, 'u')
    .replace(/ğ/g, 'g')
    .replace(/[^a-z0-9\s]/gi, '')
    .trim();
}

const HALLUCINATION_TRIGGERS = [
  'izlediginiz icin tesekkur',
  'tesekkur ederim',
  'tesekkurler',
  'abone ol',
  'begenmeyi ve abone',
  'gorusmek uzere',
  'altyazi',
  'thanks for watching',
  'thank you for watching',
  'subtitles by',
  'subscribe to',
  'like and subscribe',
  'please subscribe',
  'bye bye',
  'see you next time',
];

// --- Audio Transcription ---

/**
 * Validates Whisper transcription output for silence / hallucination.
 * Throws `NO_SPEECH_DETECTED` when the audio contains no meaningful speech.
 */
function validateAudioTranscript(whisperResponse: WhisperVerboseResponse): string {
  const segments = whisperResponse.segments ?? [];
  const fullText = whisperResponse.text?.trim() ?? '';

  // 1. Completely empty text
  if (fullText.length === 0) {
    throw new Error('NO_SPEECH_DETECTED');
  }

  // 2. High no_speech_prob across segments → silence/noise
  if (segments.length > 0) {
    const avgNoSpeechProb =
      segments.reduce((sum, s) => sum + (s.no_speech_prob ?? 0), 0) / segments.length;
    const maxNoSpeechProb = Math.max(...segments.map((s) => s.no_speech_prob ?? 0));

    if (avgNoSpeechProb > 0.4 || maxNoSpeechProb > 0.7) {
      throw new Error('NO_SPEECH_DETECTED');
    }
  }

  // 3. Normalized check for common YouTube subtitle hallucination patterns
  const normalized = normalizeText(fullText);

  if (HALLUCINATION_TRIGGERS.some((trigger) => normalized.includes(trigger))) {
    throw new Error('NO_SPEECH_DETECTED');
  }

  return fullText;
}

export async function transcribeAudio(
  audioUri: string,
  apiKey: string,
  language: LanguageCode
): Promise<string> {
  if (!apiKey) {
    throw new Error('Groq API Key is not set');
  }

  const formData = new FormData();

  const filename = audioUri.split('/').pop() || 'recording.m4a';
  const match = /\.(\w+)$/.exec(filename);
  const ext = match ? match[1].toLowerCase() : 'm4a';
  const mimeType = ext === 'wav' ? 'audio/wav' : ext === 'mp3' ? 'audio/mp3' : ext === 'm4a' ? 'audio/m4a' : 'audio/m4a';

  // React Native FormData requires specific formatting for files
  const file = {
    uri: audioUri,
    type: mimeType,
    name: filename.includes('.') ? filename : `${filename}.${ext}`,
  };

  const initialPrompt =
    language === 'tr'
      ? 'Ders anlatımı, öğretmen ve öğrenci konuşması, ders notları kaydı. Altyazı veya video kapanış metni içermez.'
      : 'Lecture recording, classroom talk, teacher and student discussion. No video subtitles or outros.';

  formData.append('file', file as any);
  formData.append('model', 'whisper-large-v3-turbo');
  formData.append('language', language);
  formData.append('response_format', 'verbose_json');
  formData.append('temperature', '0.0');
  formData.append('prompt', initialPrompt);

  try {
    const response = await fetch(`${GROQ_API_URL}/audio/transcriptions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Groq Audio Error:', errorText);
      throw new Error(`Groq API Error: ${response.status} - ${errorText}`);
    }

    const data: WhisperVerboseResponse = await response.json();
    return validateAudioTranscript(data);
  } catch (error) {
    console.error('transcribeAudio error:', error);
    throw error;
  }
}

// --- Vision / OCR ---

const SYSTEM_PROMPT_TR =
  'Sen bir OCR/metin çıkarma asistanısın. Görevin SADECE görseldeki (fotoğraf veya doküman/sayfa taraması) okunabilir metni birebir çıkarmak.\n\n' +
  'KURALLAR:\n' +
  '- Sadece çıkarılan metni döndür. Hiçbir açıklama, yorum, giriş cümlesi veya meta-metin ekleme.\n' +
  '- <think> etiketi veya herhangi bir muhakeme/düşünce süreci gösterme.\n' +
  '- Eğer görselde/dokümanda okunabilir bir metin/yazı YOKSA, tam olarak şu tek satırı döndür: "NO_TEXT_FOUND"\n' +
  '- Eğer görsel bulanık/anlaşılmazsa ve metin çıkarılamıyorsa, yine "NO_TEXT_FOUND" döndür.\n' +
  '- Asla "görselde metin yok" gibi cümleler kurma, sadece "NO_TEXT_FOUND" kodunu kullan.';

const SYSTEM_PROMPT_EN =
  'You are an OCR/text extraction assistant. Your task is ONLY to extract readable text exactly as it appears in the image.\n\n' +
  'RULES:\n' +
  '- Only return the extracted text. Do not add any explanations, comments, introductory phrases, or meta-text.\n' +
  '- Do not include <think> tags or show any reasoning/thought process.\n' +
  '- If there is NO readable text/writing in the image, return exactly this single line: "NO_TEXT_FOUND"\n' +
  '- If the image is blurry/illegible and text cannot be extracted, also return "NO_TEXT_FOUND".\n' +
  '- Never use sentences like "there is no text", just use the "NO_TEXT_FOUND" code.';

const NO_TEXT_INDICATORS = [
  'NO_TEXT_FOUND',
  'metin yok',
  'okunabilir bir metin',
  'boş bir sayfa',
  'herhangi bir yazı',
  'no text',
  'no readable text',
  'there is no text',
];

/**
 * Cleans and validates the raw Vision model response.
 * Strips `<think>` blocks, markdown meta-comments, and checks for "no text" indicators.
 * Throws `NO_READABLE_TEXT` when the image contains no extractable text.
 */
function cleanAndValidateExtractedText(rawResponse: string): string {
  // 1. Remove all <think>...</think> blocks (fallback if model disobeys)
  let cleaned = rawResponse.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

  // 2. Remove markdown bold meta-comments like **Sonuç:** or **Result:**
  cleaned = cleaned.replace(/\*\*.*?\*\*/g, '').trim();

  // 3. Check for "no text" indicators
  const lowerCleaned = cleaned.toLowerCase();
  const isEmpty =
    cleaned.length === 0 ||
    NO_TEXT_INDICATORS.some((indicator) => lowerCleaned.includes(indicator.toLowerCase()));

  if (isEmpty) {
    throw new Error('NO_READABLE_TEXT');
  }

  return cleaned;
}

export async function extractTextFromImage(
  base64Image: string,
  apiKey: string,
  language: LanguageCode
): Promise<string> {
  if (!apiKey) {
    throw new Error('Groq API Key is not set');
  }

  const systemPrompt = language === 'tr' ? SYSTEM_PROMPT_TR : SYSTEM_PROMPT_EN;

  const userPrompt =
    language === 'tr'
      ? 'Lütfen bu görseldeki tüm metni çıkar ve bana Türkçe olarak ver.'
      : 'Please extract all the text from this image and provide it to me.';

  const payload = {
    model: 'qwen/qwen3.6-27b',
    messages: [
      {
        role: 'system',
        content: systemPrompt,
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: userPrompt,
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:image/jpeg;base64,${base64Image}`,
            },
          },
        ],
      },
    ],
    temperature: 0.2,
    max_tokens: 2048,
  };

  try {
    const response = await fetch(`${GROQ_API_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Groq Vision Error:', errorText);
      throw new Error(`Groq API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const rawContent: string = data.choices[0].message.content || '';

    return cleanAndValidateExtractedText(rawContent);
  } catch (error) {
    console.error('extractTextFromImage error:', error);
    throw error;
  }
}
