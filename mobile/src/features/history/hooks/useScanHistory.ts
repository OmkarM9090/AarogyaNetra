/**
 * useScanHistory — paginated scan history from GET /scans.
 */
import { useCallback, useEffect, useState } from 'react';

import { Config } from '../../../shared/constants/config';
import { predictionService } from '../../prediction/services/predictionService';
import type { ScanRecord } from '../../../shared/types/scan';

export function useScanHistory() {
  const [items, setItems] = useState<ScanRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPage = useCallback(async (targetPage: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await predictionService.getScanHistory(targetPage, Config.LIST_PAGE_SIZE);
      setItems(prev => (targetPage === 1 ? result.items : [...prev, ...result.items]));
      setTotal(result.total);
      setTotalPages(Math.max(1, result.totalPages));
      setPage(targetPage);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load scan history');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPage(1);
  }, [loadPage]);

  const loadMore = useCallback(async () => {
    if (page < totalPages && !isLoading) {
      await loadPage(page + 1);
    }
  }, [page, totalPages, isLoading, loadPage]);

  return {
    items,
    total,
    page,
    totalPages,
    isLoading,
    error,
    refresh: () => void loadPage(1),
    loadMore,
    hasMore: page < totalPages,
  };
}
