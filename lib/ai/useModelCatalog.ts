import { useCallback, useEffect, useState } from 'react';
import { ProviderId } from '../../types/ai';
import { canFetchModels, EMPTY_CATALOG, fetchModelCatalog, ModelCatalog } from './models';

interface UseModelCatalogResult {
  catalog: ModelCatalog;
  loading: boolean;
  error: string | null;
  /** True when the provider needs an API key that hasn't been provided yet. */
  needsKey: boolean;
  refresh: () => void;
}

/**
 * Loads the live model catalog for the given provider + saved API key.
 * Refetches automatically when either changes, and exposes a manual refresh.
 */
export function useModelCatalog(providerId: ProviderId, apiKey: string): UseModelCatalogResult {
  const [catalog, setCatalog] = useState<ModelCatalog>(EMPTY_CATALOG);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchable = canFetchModels(providerId, apiKey);

  const load = useCallback(
    async (force: boolean) => {
      if (!canFetchModels(providerId, apiKey)) {
        setCatalog(EMPTY_CATALOG);
        setError(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const result = await fetchModelCatalog(providerId, apiKey, force);
        setCatalog(result);
      } catch (e) {
        setCatalog(EMPTY_CATALOG);
        setError(e instanceof Error ? e.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    },
    [providerId, apiKey]
  );

  useEffect(() => {
    load(false);
  }, [load]);

  return {
    catalog,
    loading,
    error,
    needsKey: !fetchable,
    refresh: () => load(true),
  };
}
