/**
 * Generic async data hook with loading / error / refetch.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { toNormalizedError } from '../services/api/apiClient';
import type { NormalizedApiError } from '../types/api';

interface UseApiResult<T> {
  data: T | null;
  isLoading: boolean;
  isFetching: boolean;
  error: NormalizedApiError | null;
  refetch: () => Promise<T | null>;
  setData: (updater: T | ((prev: T | null) => T)) => void;
}

export function useApi<T>(fetcher: () => Promise<T>, deps: unknown[] = []): UseApiResult<T> {
  const [data, setDataState] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<NormalizedApiError | null>(null);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const seqRef = useRef(0);

  const refetch = useCallback(async () => {
    const seq = ++seqRef.current;
    setIsFetching(true);
    setError(null);
    try {
      const result = await fetcherRef.current();
      if (seq === seqRef.current) {
        setDataState(result);
        setIsLoading(false);
      }
      return result;
    } catch (e) {
      const normalized = toNormalizedError(e);
      if (seq === seqRef.current) {
        setError(normalized);
        setIsLoading(false);
      }
      return null;
    } finally {
      if (seq === seqRef.current) setIsFetching(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const setData = useCallback((updater: T | ((prev: T | null) => T)) => {
    setDataState(prev => (typeof updater === 'function' ? (updater as (p: T | null) => T)(prev) : updater));
  }, []);

  return { data, isLoading, isFetching, error, refetch, setData };
}
