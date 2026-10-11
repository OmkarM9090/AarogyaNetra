/**
 * Health data store — server-backed predictions, summaries and scan history.
 *
 * Caching: every write is mirrored to AsyncStorage so the UI can render the
 * last known data instantly at startup and while offline.
 */
import { create } from 'zustand';

import { predictionService } from '../../features/prediction/services/predictionService';
import { Config } from '../constants/config';
import type { RiskSummary } from '../types/health';
import type {
  AnemiaInput,
  DiabetesInput,
  HypertensionInput,
  PredictionResult,
} from '../types/prediction';
import type { ScanRecord } from '../types/scan';
import { storageService, STORAGE_KEYS } from '../services/storage/asyncStorageService';

export interface LatestPredictions {
  diabetes: PredictionResult | null;
  hypertension: PredictionResult | null;
  anemia: PredictionResult | null;
}

interface HealthState {
  latestPredictions: LatestPredictions;
  riskSummary: RiskSummary | null;
  scanHistory: ScanRecord[];
  historyTotal: number;
  isLoading: boolean;

  /** Load cached data from AsyncStorage (fast, offline-safe). */
  loadCached: () => Promise<void>;
  fetchRiskSummary: () => Promise<void>;
  fetchScanHistory: (page?: number) => Promise<void>;
  submitDiabetesScan: (data: DiabetesInput) => Promise<PredictionResult>;
  submitHypertensionScan: (data: HypertensionInput) => Promise<PredictionResult>;
  submitAnemiaScan: (image: { uri: string }, data: AnemiaInput) => Promise<PredictionResult>;
  clearAll: () => void;
}

const EMPTY_LATEST: LatestPredictions = { diabetes: null, hypertension: null, anemia: null };

function latestWith(latest: LatestPredictions, p: PredictionResult): LatestPredictions {
  return { ...latest, [p.condition]: p };
}

async function recordPrediction(p: PredictionResult): Promise<void> {
  const state = useHealthStore.getState();
  const next = latestWith(state.latestPredictions, p);
  useHealthStore.setState({ latestPredictions: next });
  await storageService.setJSON(STORAGE_KEYS.LATEST_PREDICTIONS, next);
  // Refresh the summary in the background — best effort.
  void useHealthStore.getState().fetchRiskSummary();
}

export const useHealthStore = create<HealthState>((set, get) => ({
  latestPredictions: EMPTY_LATEST,
  riskSummary: null,
  scanHistory: [],
  historyTotal: 0,
  isLoading: false,

  loadCached: async () => {
    const [latest, summary, history] = await Promise.all([
      storageService.getJSON<LatestPredictions>(STORAGE_KEYS.LATEST_PREDICTIONS),
      storageService.getJSON<RiskSummary>(STORAGE_KEYS.RISK_SUMMARY),
      storageService.getJSON<ScanRecord[]>(STORAGE_KEYS.SCAN_HISTORY),
    ]);
    set({
      latestPredictions: latest ?? EMPTY_LATEST,
      riskSummary: summary ?? null,
      scanHistory: history ?? [],
    });
  },

  fetchRiskSummary: async () => {
    set({ isLoading: true });
    try {
      const summary = await predictionService.getRiskSummary();
      set({ riskSummary: summary });
      await storageService.setJSON(STORAGE_KEYS.RISK_SUMMARY, summary);
    } catch (e) {
      console.warn('[healthStore] risk summary fetch failed', e);
      // keep cached data
    } finally {
      set({ isLoading: false });
    }
  },

  fetchScanHistory: async (page = 1) => {
    set({ isLoading: true });
    try {
      const result = await predictionService.getScanHistory(page, Config.LIST_PAGE_SIZE);
      const { scanHistory } = get();
      const merged =
        page === 1
          ? result.items
          : [...scanHistory, ...result.items.filter(i => !scanHistory.some(s => s.id === i.id))];
      set({ scanHistory: merged, historyTotal: result.total });
      await storageService.setJSON(STORAGE_KEYS.SCAN_HISTORY, merged.slice(0, 50));
    } catch (e) {
      console.warn('[healthStore] scan history fetch failed', e);
    } finally {
      set({ isLoading: false });
    }
  },

  submitDiabetesScan: async (data) => {
    const result = await predictionService.submitDiabetesScan(data);
    await recordPrediction(result);
    return result;
  },

  submitHypertensionScan: async (data) => {
    const result = await predictionService.submitHypertensionScan(data);
    await recordPrediction(result);
    return result;
  },

  submitAnemiaScan: async (image, data) => {
    const result = await predictionService.submitAnemiaScan(image, data);
    await recordPrediction(result);
    return result;
  },

  clearAll: () => {
    set({ latestPredictions: EMPTY_LATEST, riskSummary: null, scanHistory: [], historyTotal: 0 });
    void Promise.all([
      storageService.remove(STORAGE_KEYS.LATEST_PREDICTIONS),
      storageService.remove(STORAGE_KEYS.RISK_SUMMARY),
      storageService.remove(STORAGE_KEYS.SCAN_HISTORY),
    ]);
  },
}));
