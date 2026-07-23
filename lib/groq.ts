import { LanguageCode } from '../config/languages';

const GROQ_API_URL = 'https://api.groq.com/openai/v1';

export async function transcribeAudio(
  audioUri: string,
  apiKey: string,
  language: LanguageCode
): Promise<string> {
  if (!apiKey) {
    throw new Error('Groq API Key is not set');
  }

  const formData = new FormData();

  // React Native FormData requires specific formatting for files
  const file = {
    uri: audioUri,
    type: 'audio/m4a',
    name: 'recording.m4a',
  };

  formData.append('file', file as any);
  formData.append('model', 'whisper-large-v3-turbo');
  formData.append('language', language);
  formData.append('response_format', 'text');

  try {
    const response = await fetch(`${GROQ_API_URL}/audio/transcriptions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'multipart/form-data',
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Groq Audio Error:', errorText);
      throw new Error(`Groq API Error: ${response.status} - ${errorText}`);
    }

    const text = await response.text();
    return text.trim();
  } catch (error) {
    console.error('transcribeAudio error:', error);
    throw error;
  }
}

export async function extractTextFromImage(
  base64Image: string,
  apiKey: string,
  language: LanguageCode
): Promise<string> {
  if (!apiKey) {
    throw new Error('Groq API Key is not set');
  }

  const languagePrompt = language === 'tr'
    ? 'Lütfen bu görseldeki tüm metni çıkar ve bana Türkçe olarak ver.'
    : 'Please extract all the text from this image and provide it to me.';

  const payload = {
    model: "qwen/qwen3.6-27b",
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: languagePrompt,
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
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error('extractTextFromImage error:', error);
    throw error;
  }
}
