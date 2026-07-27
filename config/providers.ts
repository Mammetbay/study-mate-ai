import { ProviderConfig, ProviderId } from '../types/ai';

/**
 * Static provider metadata only (id, display name, base URL). The list of
 * available models is NOT hardcoded here — it is fetched live from each
 * provider's API at runtime. See `lib/ai/models.ts`.
 */
export const PROVIDERS: ProviderConfig[] = [
  {
    id: 'groq',
    name: 'Groq',
    baseUrl: 'https://api.groq.com/openai/v1',
  },
  {
    id: 'openai',
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    // OpenRouter's model catalog is public — no API key required to list it.
    publicModelList: true,
  },
];

export function getProvider(id: ProviderId): ProviderConfig {
  const provider = PROVIDERS.find((p) => p.id === id);
  if (!provider) throw new Error(`Unknown provider: ${id}`);
  return provider;
}
