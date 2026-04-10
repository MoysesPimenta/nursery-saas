import { useState, useEffect, useCallback } from 'react';
import { apiGet, apiPost, apiPatch, apiDelete } from '../api';

export interface UseApiQueryResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export interface UseApiMutationResult<T> {
  execute: (data?: unknown, overridePath?: string) => Promise<T>;
  loading: boolean;
  error: Error | null;
  data: T | null;
}

export function useApiQuery<T>(
  path: string,
  deps: React.DependencyList = []
): UseApiQueryResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    // Skip fetching if path is empty (conditional queries)
    if (!path) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const result = await apiGet<T>(path);
      setData(result);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch data');
      setError(error);
    } finally {
      setLoading(false);
    }
  }, [path]);

  useEffect(() => {
    fetch();
  }, [fetch, ...deps]);

  return {
    data,
    loading,
    error,
    refetch: fetch,
  };
}

export function useApiMutation<T>(
  path: string,
  method: 'POST' | 'PATCH' | 'DELETE' = 'POST'
): UseApiMutationResult<T> {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<T | null>(null);

  const execute = useCallback(
    async (requestData?: unknown, overridePath?: string): Promise<T> => {
      try {
        setLoading(true);
        setError(null);

        const targetPath = overridePath || path;
        let result: T;
        if (method === 'POST') {
          result = await apiPost<T>(targetPath, requestData);
        } else if (method === 'PATCH') {
          result = await apiPatch<T>(targetPath, requestData);
        } else if (method === 'DELETE') {
          result = await apiDelete<T>(targetPath);
        } else {
          throw new Error(`Unsupported HTTP method: ${method}`);
        }

        setData(result);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Operation failed');
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [path, method]
  );

  return {
    execute,
    loading,
    error,
    data,
  };
}
