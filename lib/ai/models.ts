import { getProvider } from '../../config/providers';
import { AICapability, AIModel, ProviderId } from '../../types/ai';
import { getProviderAdapter } from './providers';

export interface ModelCatalog {
  stt: AIModel[];
  vision: AIModel[];
  chat: AIModel[];
}

export const EMPTY_CATALOG: ModelCatalog = { stt: [], vision: [], chat: [] };

function splitByCapability(models: AIModel[]): ModelCatalog {
  return {
    stt: models.filter((m) => m.capabilities.includes('stt')),
    vision: models.filter((m) => m.capabilities.includes('vision')),
    chat: models.filter((m) => m.capabilities.includes('chat')),
  };
}

interface CacheEntry {
  catalog: ModelCatalog;
  expiresAt: number;
}

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const cache = new Map<string, CacheEntry>();

function cacheKey(providerId: ProviderId, apiKey: string): string {
  return `${providerId}:${apiKey}`;
}

/** True when this provider can list models with the given key. */
export function canFetchModels(providerId: ProviderId, apiKey: string): boolean {
  return getProvider(providerId).publicModelList === true || apiKey.length > 0;
}

/**
 * Fetches and classifies the provider's live model catalog, split by capability.
 * Results are cached per provider+key for a short TTL. Pass `force` to bypass
 * the cache (used by the manual "refresh" action).
 */
export async function fetchModelCatalog(
  providerId: ProviderId,
  apiKey: string,
  force = false
): Promise<ModelCatalog> {
  const key = cacheKey(providerId, apiKey);
  const now = Date.now();

  if (!force) {
    const hit = cache.get(key);
    if (hit && hit.expiresAt > now) return hit.catalog;
  }

  const adapter = getProviderAdapter(providerId);
  const models = await adapter.listModels(apiKey);
  const catalog = splitByCapability(models);

  cache.set(key, { catalog, expiresAt: now + CACHE_TTL_MS });
  return catalog;
}

export function getModelsForCapabilityFrom(
  catalog: ModelCatalog,
  capability: AICapability
): AIModel[] {
  return catalog[capability];
}
