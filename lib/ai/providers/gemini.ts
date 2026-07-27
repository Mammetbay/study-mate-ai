import { LanguageCode } from '../../../config/languages';
import { AIModel, AIProvider, ChatMessage, ChatOptions } from '../../../types/ai';
import { classifyGemini, RawGeminiModel } from '../model-classifier';

export class GeminiProvider implements AIProvider {
  readonly id = 'gemini' as const;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta';

  async listModels(apiKey: string): Promise<AIModel[]> {
    const response = await fetch(`${this.baseUrl}/models?key=${apiKey}&pageSize=200`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini Models Error:', errorText);
      throw new Error(`Gemini API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const raw: RawGeminiModel[] = Array.isArray(data?.models) ? data.models : [];
    return classifyGemini(raw).sort((a, b) => a.label.localeCompare(b.label));
  }

  async transcribeAudio(
    _audioUri: string,
    _apiKey: string,
    _language: LanguageCode,
    _model: string
  ): Promise<string> {
    throw new Error('CAPABILITY_NOT_SUPPORTED');
  }

  async chatCompletion(
    messages: ChatMessage[],
    apiKey: string,
    model: string,
    options?: ChatOptions
  ): Promise<string> {
    const contents = this.convertMessages(messages);

    const payload: Record<string, unknown> = {
      contents,
      generationConfig: {
        temperature: options?.temperature ?? 0.3,
        maxOutputTokens: options?.maxTokens ?? 1024,
      },
    };

    const systemMessage = messages.find((m) => m.role === 'system');
    if (systemMessage) {
      payload.systemInstruction = { parts: [{ text: systemMessage.content }] };
    }

    const response = await fetch(
      `${this.baseUrl}/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini Chat Error:', errorText);
      throw new Error(`Gemini API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }

  async visionCompletion(
    messages: ChatMessage[],
    base64Image: string,
    apiKey: string,
    model: string,
    options?: ChatOptions
  ): Promise<string> {
    const userMessage = messages.find((m) => m.role === 'user');
    const systemMessage = messages.find((m) => m.role === 'system');

    const payload: Record<string, unknown> = {
      contents: [
        {
          role: 'user',
          parts: [
            { text: userMessage?.content || '' },
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: base64Image,
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: options?.temperature ?? 0.2,
        maxOutputTokens: options?.maxTokens ?? 2048,
      },
    };

    if (systemMessage) {
      payload.systemInstruction = { parts: [{ text: systemMessage.content }] };
    }

    const response = await fetch(
      `${this.baseUrl}/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini Vision Error:', errorText);
      throw new Error(`Gemini API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }

  private convertMessages(messages: ChatMessage[]): Array<{ role: string; parts: Array<{ text: string }> }> {
    return messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));
  }
}
