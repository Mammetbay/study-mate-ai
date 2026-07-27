import { LanguageCode } from '../../config/languages';
import { AISettings, ChatMessage } from '../../types/ai';
import { Flashcard, QuizQuestion } from '../../types';
import { getProviderAdapter } from './providers';
import { initialSRState } from '../spacedRepetition';
import { cleanAndValidateExtractedText, cleanThinkTags, extractJsonArray, extractJsonObject } from './utils';
import {
  getFlashcardSystemPrompt,
  getNoteMetadataSystemPrompt,
  getOcrSystemPrompt,
  getOcrUserPrompt,
  getQuizSystemPrompt,
  getSummarySystemPrompt,
} from './prompts';

function getApiKey(settings: AISettings): string {
  const key = settings.apiKeys[settings.providerId];
  if (!key) {
    throw new Error(`API key not set for ${settings.providerId}`);
  }
  return key;
}

function getModel(settings: AISettings, capability: 'stt' | 'vision' | 'chat'): string {
  const model = settings.selectedModels[capability];
  if (!model) {
    throw new Error(`No ${capability} model selected for ${settings.providerId}`);
  }
  return model;
}

export async function transcribeAudio(
  audioUri: string,
  settings: AISettings,
  language: LanguageCode
): Promise<string> {
  if (!settings.selectedModels.stt) {
    throw new Error('CAPABILITY_NOT_SUPPORTED');
  }

  const adapter = getProviderAdapter(settings.providerId);
  const apiKey = getApiKey(settings);
  const model = getModel(settings, 'stt');

  try {
    return await adapter.transcribeAudio(audioUri, apiKey, language, model);
  } catch (error) {
    console.error('transcribeAudio error:', error);
    throw error;
  }
}

export async function extractTextFromImage(
  base64Image: string,
  settings: AISettings,
  language: LanguageCode
): Promise<string> {
  const adapter = getProviderAdapter(settings.providerId);
  const apiKey = getApiKey(settings);
  const model = getModel(settings, 'vision');

  const messages: ChatMessage[] = [
    { role: 'system', content: getOcrSystemPrompt(language) },
    { role: 'user', content: getOcrUserPrompt(language) },
  ];

  try {
    const rawContent = await adapter.visionCompletion(messages, base64Image, apiKey, model, {
      temperature: 0.2,
      maxTokens: 2048,
    });
    return cleanAndValidateExtractedText(rawContent);
  } catch (error) {
    console.error('extractTextFromImage error:', error);
    throw error;
  }
}

export async function generateSummary(
  transcript: string,
  settings: AISettings,
  language: LanguageCode
): Promise<string> {
  const adapter = getProviderAdapter(settings.providerId);
  const apiKey = getApiKey(settings);
  const model = getModel(settings, 'chat');

  const messages: ChatMessage[] = [
    { role: 'system', content: getSummarySystemPrompt(language) },
    { role: 'user', content: `Ders Metni:\n${transcript}` },
  ];

  try {
    const content = await adapter.chatCompletion(messages, apiKey, model, {
      temperature: 0.3,
      maxTokens: 1024,
    });
    return cleanThinkTags(content);
  } catch (error) {
    console.error('generateSummary error:', error);
    throw error;
  }
}

export interface NoteMetadata {
  title: string;
  tags: string[];
}

/**
 * Generates a short title and 1-5 keyword tags for a note from its transcript.
 * Callers should treat this as best-effort: on any failure they fall back to a
 * default title and empty tags. Tags are normalized to lowercase, trimmed,
 * de-duplicated and capped at 5.
 */
export async function generateNoteMetadata(
  transcript: string,
  settings: AISettings,
  language: LanguageCode
): Promise<NoteMetadata> {
  const adapter = getProviderAdapter(settings.providerId);
  const apiKey = getApiKey(settings);
  const model = getModel(settings, 'chat');

  const messages: ChatMessage[] = [
    { role: 'system', content: getNoteMetadataSystemPrompt(language) },
    { role: 'user', content: `Ders Metni:\n${transcript}` },
  ];

  const content = await adapter.chatCompletion(messages, apiKey, model, {
    temperature: 0.3,
    maxTokens: 256,
  });

  const parsed = extractJsonObject(content);
  const rawTitle = typeof parsed.title === 'string' ? parsed.title.trim() : '';
  const rawTags = Array.isArray(parsed.tags) ? parsed.tags : [];

  const tags = Array.from(
    new Set(
      rawTags
        .filter((tag): tag is string => typeof tag === 'string')
        .map((tag) => tag.trim().toLowerCase())
        .filter(Boolean)
    )
  ).slice(0, 5);

  return { title: rawTitle, tags };
}

export async function generateQuiz(
  noteId: string,
  transcript: string,
  settings: AISettings,
  language: LanguageCode
): Promise<QuizQuestion[]> {
  const adapter = getProviderAdapter(settings.providerId);
  const apiKey = getApiKey(settings);
  const model = getModel(settings, 'chat');

  const messages: ChatMessage[] = [
    { role: 'system', content: getQuizSystemPrompt(language) },
    { role: 'user', content: `Ders Metni:\n${transcript}` },
  ];

  try {
    const content = await adapter.chatCompletion(messages, apiKey, model, {
      temperature: 0.2,
      maxTokens: 2048,
    });

    const parsedArray = extractJsonArray(content);
    return (parsedArray as Array<{ question?: string; options?: string[]; correctIndex?: number }>).map(
      (q, index) => ({
        id: `${noteId}-quiz-${index}-${Date.now()}`,
        noteId,
        question: q.question || '',
        options: Array.isArray(q.options) ? q.options : [],
        correctIndex: typeof q.correctIndex === 'number' ? q.correctIndex : 0,
      })
    );
  } catch (error) {
    console.error('generateQuiz error:', error);
    throw error;
  }
}

export async function generateFlashcards(
  noteId: string,
  transcript: string,
  settings: AISettings,
  language: LanguageCode
): Promise<Flashcard[]> {
  const adapter = getProviderAdapter(settings.providerId);
  const apiKey = getApiKey(settings);
  const model = getModel(settings, 'chat');

  const messages: ChatMessage[] = [
    { role: 'system', content: getFlashcardSystemPrompt(language) },
    { role: 'user', content: `Ders Metni:\n${transcript}` },
  ];

  try {
    const content = await adapter.chatCompletion(messages, apiKey, model, {
      temperature: 0.2,
      maxTokens: 2048,
    });

    const parsedArray = extractJsonArray(content) as Array<{ front?: string; back?: string }>;
    return parsedArray
      .filter((card) => typeof card.front === 'string' && typeof card.back === 'string')
      .map((card, index) => ({
        id: `${noteId}-fc-${index}-${Date.now()}`,
        noteId,
        front: card.front as string,
        back: card.back as string,
        // Start every card due immediately with default SM-2 parameters.
        ...initialSRState(),
      }));
  } catch (error) {
    console.error('generateFlashcards error:', error);
    throw error;
  }
}
