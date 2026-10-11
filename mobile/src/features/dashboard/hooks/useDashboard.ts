/**
 * useDashboard — data hooks for the dashboard screen.
 * Cache-first: shows the stored summary immediately, refreshes in background.
 */
import { useEffect } from 'react';
import { useHealthStore } from '../../../shared/store/useHealthStore';

export function useDashboard() {
  const {
    riskSummary,
    latestPredictions,
    scanHistory,
    isLoading,
    fetchRiskSummary,
    fetchScanHistory,
  } = useHealthStore();

  useEffect(() => {
    // Background refresh after cache is rendered.
    void fetchRiskSummary();
    void fetchScanHistory(1);
  }, [fetchRiskSummary, fetchScanHistory]);

  return {
    riskSummary,
    latestPredictions,
    scanHistory,
    isLoading,
    refresh: () => {
      void fetchRiskSummary();
      void fetchScanHistory(1);
    },
  };
}
