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

// --- Summary & Quiz Generation ---

export async function generateSummary(
  transcript: string,
  apiKey: string,
  language: LanguageCode
): Promise<string> {
  if (!apiKey) {
    throw new Error('Groq API Key is not set');
  }

  const systemPrompt =
    language === 'tr'
      ? 'Sen bir ders asistanısın. Görevin verilen ders transkriptini/notunu analiz etmek ve 3-5 maddeden oluşan anlaşılır, net bir özet çıkarmaktır.\n\nKURALLAR:\n- Sadece özeti ver. Giriş, açıklama veya meta-metin yazma.\n- Maddeleri "• " ile başlat.\n- <think> etiketi kullanma.'
      : 'You are a study assistant. Your task is to analyze the provided lecture transcript/note and produce a clear, concise bulleted summary (3-5 bullet points).\n\nRULES:\n- Only return the summary points. Do not include intros or meta text.\n- Use "• " for bullet points.\n- Do not use <think> tags.';

  const payload = {
    model: 'qwen/qwen3.6-27b',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Ders Metni:\n${transcript}` },
    ],
    temperature: 0.3,
    max_tokens: 1024,
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
      console.error('Groq Summary Error:', errorText);
      throw new Error(`Groq API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    let content: string = data.choices[0]?.message?.content || '';
    content = content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
    return content;
  } catch (error) {
    console.error('generateSummary error:', error);
    throw error;
  }
}

export async function generateQuiz(
  noteId: string,
  transcript: string,
  apiKey: string,
  language: LanguageCode
): Promise<import('../types').QuizQuestion[]> {
  if (!apiKey) {
    throw new Error('Groq API Key is not set');
  }

  const systemPrompt =
    language === 'tr'
      ? 'Sen bir eğitim/quiz hazırlama asistanısın. Görevin verilen ders metninden 3 ile 5 adet çoktan seçmeli soru hazırlamaktır.\n\nÇIKTI FORMATI:\nSadece ve sadece geçerli bir JSON dizisi döndür. Başka HİÇBİR açıklama veya metin ekleme.\nÖrnek:\n[\n  {\n    "question": "Soru metni?",\n    "options": ["Şık A", "Şık B", "Şık C", "Şık D"],\n    "correctIndex": 0\n  }\n]'
      : 'You are an educational quiz creation assistant. Create 3 to 5 multiple-choice questions based on the provided lecture note.\n\nOUTPUT FORMAT:\nReturn ONLY a valid JSON array. No explanations or extra text.\nExample:\n[\n  {\n    "question": "Question text?",\n    "options": ["Option A", "Option B", "Option C", "Option D"],\n    "correctIndex": 0\n  }\n]';

  const payload = {
    model: 'qwen/qwen3.6-27b',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Ders Metni:\n${transcript}` },
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
      console.error('Groq Quiz Error:', errorText);
      throw new Error(`Groq API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    let content: string = data.choices[0]?.message?.content || '';
    content = content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('INVALID_QUIZ_JSON');
    }

    const parsedArray = JSON.parse(jsonMatch[0]);
    return parsedArray.map((q: any, index: number) => ({
      id: `${noteId}-quiz-${index}-${Date.now()}`,
      noteId,
      question: q.question,
      options: Array.isArray(q.options) ? q.options : [],
      correctIndex: typeof q.correctIndex === 'number' ? q.correctIndex : 0,
    }));
  } catch (error) {
    console.error('generateQuiz error:', error);
    throw error;
  }
}

export async function generateFlashcards(
  noteId: string,
  transcript: string,
  apiKey: string,
  language: LanguageCode
): Promise<import('../types').Flashcard[]> {
  if (!apiKey) {
    throw new Error('Groq API Key is not set');
  }

  const systemPrompt =
    language === 'tr'
      ? 'Sen bir eğitim flashcard asistanısın. Görevin verilen ders metninden 6 ile 12 adet flashcard üretmektir.\n\nÇIKTI FORMATI:\nSadece ve sadece geçerli bir JSON dizisi döndür. Başka HİÇBİR açıklama veya metin ekleme.\nÖrnek:\n[\n  {\n    "front": "Soru veya terim",\n    "back": "Kısa cevap veya tanım"\n  }\n]\n\nKURALLAR:\n- front: soru, terim veya kavram\n- back: net, kısa cevap\n- <think> etiketi kullanma.'
      : 'You are an educational flashcard assistant. Create 6 to 12 flashcards from the provided lecture note.\n\nOUTPUT FORMAT:\nReturn ONLY a valid JSON array. No explanations or extra text.\nExample:\n[\n  {\n    "front": "Question or term",\n    "back": "Short answer or definition"\n  }\n]\n\nRULES:\n- front: question, term, or concept\n- back: clear, concise answer\n- Do not use <think> tags.';

  const payload = {
    model: 'qwen/qwen3.6-27b',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Ders Metni:\n${transcript}` },
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
      console.error('Groq Flashcards Error:', errorText);
      throw new Error(`Groq API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    let content: string = data.choices[0]?.message?.content || '';
    content = content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('INVALID_FLASHCARD_JSON');
    }

    const parsedArray = JSON.parse(jsonMatch[0]) as Array<{ front?: string; back?: string }>;
    return parsedArray
      .filter((card) => typeof card.front === 'string' && typeof card.back === 'string')
      .map((card, index) => ({
        id: `${noteId}-fc-${index}-${Date.now()}`,
        noteId,
        front: card.front as string,
        back: card.back as string,
      }));
  } catch (error) {
    console.error('generateFlashcards error:', error);
    throw error;
  }
}
