import { LanguageCode } from '../../config/languages';
import { AISettings, ChatMessage } from '../../types/ai';
import { Flashcard, QuizQuestion } from '../../types';
import { getProviderAdapter } from './providers';
import { cleanAndValidateExtractedText, cleanThinkTags, extractJsonArray } from './utils';
import {
  getFlashcardSystemPrompt,
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
      }));
  } catch (error) {
    console.error('generateFlashcards error:', error);
    throw error;
  }
}
