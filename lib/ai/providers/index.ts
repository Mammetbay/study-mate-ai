import { AIProvider, ProviderId } from '../../../types/ai';
import { getProvider } from '../../../config/providers';
import { OpenAICompatibleProvider } from './openai-compatible';
import { GeminiProvider } from './gemini';

const adapterCache = new Map<ProviderId, AIProvider>();

export function getProviderAdapter(id: ProviderId): AIProvider {
  const cached = adapterCache.get(id);
  if (cached) return cached;

  let adapter: AIProvider;

  switch (id) {
    case 'groq':
    case 'openai': {
      const config = getProvider(id);
      adapter = new OpenAICompatibleProvider({
        id: config.id,
        baseUrl: config.baseUrl,
      });
      break;
    }
    case 'openrouter': {
      const config = getProvider(id);
      adapter = new OpenAICompatibleProvider({
        id: config.id,
        baseUrl: config.baseUrl,
        extraHeaders: {
          'HTTP-Referer': 'https://studymate-ai.app',
          'X-Title': 'StudyMate AI',
        },
      });
      break;
    }
    case 'gemini':
      adapter = new GeminiProvider();
      break;
    default:
      throw new Error(`Unknown provider: ${id}`);
  }

  adapterCache.set(id, adapter);
  return adapter;
}
