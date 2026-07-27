import { LanguageCode } from '../../../config/languages';
import { AIModel, AIProvider, ChatMessage, ChatOptions, ProviderId } from '../../../types/ai';
import { validateAudioTranscript, WhisperVerboseResponse } from '../utils';
import { getWhisperInitialPrompt } from '../prompts';
import { classifyOpenAICompatible, RawOpenAIModel } from '../model-classifier';

interface OpenAICompatibleConfig {
  id: ProviderId;
  baseUrl: string;
  extraHeaders?: Record<string, string>;
}

export class OpenAICompatibleProvider implements AIProvider {
  readonly id: ProviderId;
  private baseUrl: string;
  private extraHeaders: Record<string, string>;

  constructor(config: OpenAICompatibleConfig) {
    this.id = config.id;
    this.baseUrl = config.baseUrl;
    this.extraHeaders = config.extraHeaders ?? {};
  }

  async listModels(apiKey: string): Promise<AIModel[]> {
    const response = await fetch(`${this.baseUrl}/models`, {
      method: 'GET',
      headers: {
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
        ...this.extraHeaders,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`${this.id} Models Error:`, errorText);
      throw new Error(`${this.id} API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const raw: RawOpenAIModel[] = Array.isArray(data?.data) ? data.data : [];
    return classifyOpenAICompatible(this.id, raw).sort((a, b) => a.label.localeCompare(b.label));
  }

  async transcribeAudio(
    audioUri: string,
    apiKey: string,
    language: LanguageCode,
    model: string
  ): Promise<string> {
    const formData = new FormData();

    const filename = audioUri.split('/').pop() || 'recording.m4a';
    const match = /\.(\w+)$/.exec(filename);
    const ext = match ? match[1].toLowerCase() : 'm4a';
    const mimeType =
      ext === 'wav' ? 'audio/wav' : ext === 'mp3' ? 'audio/mp3' : 'audio/m4a';

    const file = {
      uri: audioUri,
      type: mimeType,
      name: filename.includes('.') ? filename : `${filename}.${ext}`,
    };

    formData.append('file', file as unknown as Blob);
    formData.append('model', model);
    formData.append('language', language);
    formData.append('response_format', 'verbose_json');
    formData.append('temperature', '0.0');
    formData.append('prompt', getWhisperInitialPrompt(language));

    const response = await fetch(`${this.baseUrl}/audio/transcriptions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        ...this.extraHeaders,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`${this.id} Audio Error:`, errorText);
      throw new Error(`${this.id} API Error: ${response.status} - ${errorText}`);
    }

    const data: WhisperVerboseResponse = await response.json();
    return validateAudioTranscript(data);
  }

  async chatCompletion(
    messages: ChatMessage[],
    apiKey: string,
    model: string,
    options?: ChatOptions
  ): Promise<string> {
    const payload = {
      model,
      messages,
      temperature: options?.temperature ?? 0.3,
      max_tokens: options?.maxTokens ?? 1024,
    };

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        ...this.extraHeaders,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`${this.id} Chat Error:`, errorText);
      throw new Error(`${this.id} API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  }

  async visionCompletion(
    messages: ChatMessage[],
    base64Image: string,
    apiKey: string,
    model: string,
    options?: ChatOptions
  ): Promise<string> {
    const systemMessage = messages.find((m) => m.role === 'system');
    const userMessage = messages.find((m) => m.role === 'user');

    const payload = {
      model,
      messages: [
        ...(systemMessage ? [{ role: 'system' as const, content: systemMessage.content }] : []),
        {
          role: 'user' as const,
          content: [
            { type: 'text', text: userMessage?.content || '' },
            {
              type: 'image_url',
              image_url: { url: `data:image/jpeg;base64,${base64Image}` },
            },
          ],
        },
      ],
      temperature: options?.temperature ?? 0.2,
      max_tokens: options?.maxTokens ?? 2048,
    };

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        ...this.extraHeaders,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`${this.id} Vision Error:`, errorText);
      throw new Error(`${this.id} API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  }
}
