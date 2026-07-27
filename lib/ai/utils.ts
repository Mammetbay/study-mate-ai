interface WhisperSegment {
  id: number;
  start: number;
  end: number;
  text: string;
  no_speech_prob: number;
}

export interface WhisperVerboseResponse {
  text: string;
  segments: WhisperSegment[];
  language: string;
  duration: number;
}

export function normalizeText(text: string): string {
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

export const HALLUCINATION_TRIGGERS = [
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

export function validateAudioTranscript(whisperResponse: WhisperVerboseResponse): string {
  const segments = whisperResponse.segments ?? [];
  const fullText = whisperResponse.text?.trim() ?? '';

  if (fullText.length === 0) {
    throw new Error('NO_SPEECH_DETECTED');
  }

  if (segments.length > 0) {
    const avgNoSpeechProb =
      segments.reduce((sum, s) => sum + (s.no_speech_prob ?? 0), 0) / segments.length;
    const maxNoSpeechProb = Math.max(...segments.map((s) => s.no_speech_prob ?? 0));

    if (avgNoSpeechProb > 0.4 || maxNoSpeechProb > 0.7) {
      throw new Error('NO_SPEECH_DETECTED');
    }
  }

  const normalized = normalizeText(fullText);
  if (HALLUCINATION_TRIGGERS.some((trigger) => normalized.includes(trigger))) {
    throw new Error('NO_SPEECH_DETECTED');
  }

  return fullText;
}

export const NO_TEXT_INDICATORS = [
  'NO_TEXT_FOUND',
  'metin yok',
  'okunabilir bir metin',
  'boş bir sayfa',
  'herhangi bir yazı',
  'no text',
  'no readable text',
  'there is no text',
];

export function cleanAndValidateExtractedText(rawResponse: string): string {
  let cleaned = cleanThinkTags(rawResponse);
  cleaned = cleaned.replace(/\*\*.*?\*\*/g, '').trim();

  const lowerCleaned = cleaned.toLowerCase();
  const isEmpty =
    cleaned.length === 0 ||
    NO_TEXT_INDICATORS.some((indicator) => lowerCleaned.includes(indicator.toLowerCase()));

  if (isEmpty) {
    throw new Error('NO_READABLE_TEXT');
  }

  return cleaned;
}

export function cleanThinkTags(content: string): string {
  return content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
}

export function extractJsonArray(content: string): unknown[] {
  const cleaned = cleanThinkTags(content);
  const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error('INVALID_JSON_ARRAY');
  }
  return JSON.parse(jsonMatch[0]);
}
