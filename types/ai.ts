import { LanguageCode } from '../config/languages';

export type AICapability = 'stt' | 'vision' | 'chat';
export type ProviderId = 'groq' | 'openai' | 'gemini' | 'openrouter';

export interface AIModel {
  id: string;
  label: string;
  capabilities: AICapability[];
}

export interface ProviderConfig {
  id: ProviderId;
  name: string;
  baseUrl: string;
  /** Whether the provider's /models list can be fetched without an API key. */
  publicModelList?: boolean;
}

export interface AISettings {
  providerId: ProviderId;
  apiKeys: Partial<Record<ProviderId, string>>;
  selectedModels: {
    stt: string | null;
    vision: string | null;
    chat: string | null;
  };
}

export interface AIProvider {
  readonly id: ProviderId;
  /**
   * Fetches the provider's currently available models and classifies them by
   * capability (stt / vision / chat). Some providers expose this publicly, but
   * most require the user's API key.
   */
  listModels(apiKey: string): Promise<AIModel[]>;
  transcribeAudio(
    audioUri: string,
    apiKey: string,
    language: LanguageCode,
    model: string
  ): Promise<string>;
  chatCompletion(
    messages: ChatMessage[],
    apiKey: string,
    model: string,
    options?: ChatOptions
  ): Promise<string>;
  visionCompletion(
    messages: ChatMessage[],
    base64Image: string,
    apiKey: string,
    model: string,
    options?: ChatOptions
  ): Promise<string>;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatOptions {
  temperature?: number;
  maxTokens?: number;
}
