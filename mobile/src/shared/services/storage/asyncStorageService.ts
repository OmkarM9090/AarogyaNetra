/**
 * AsyncStorage wrapper — single source of persistence for the app.
 * Tokens, profile cache, predictions cache, scan history cache.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

export const STORAGE_KEYS = {
  ACCESS_TOKEN: '@aarogya_token_access',
  REFRESH_TOKEN: '@aarogya_token_refresh',
  USER: '@aarogya_user',
  RISK_SUMMARY: '@aarogya_risk_summary',
  LATEST_PREDICTIONS: '@aarogya_latest_predictions',
  SCAN_HISTORY: '@aarogya_scan_history',
  LANGUAGE: '@aarogya_language',
  DISCLAIMER_ACK: '@aarogya_disclaimer_ack',
  PENDING_SUBMISSIONS: '@aarogya_pending_submissions',
} as const;

export const storageService = {
  async getString(key: string): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(key);
    } catch (e) {
      console.warn('[storage] read failed', key, e);
      return null;
    }
  },

  async setString(key: string, value: string): Promise<void> {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (e) {
      console.warn('[storage] write failed', key, e);
    }
  },

  async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (e) {
      console.warn('[storage] remove failed', key, e);
    }
  },

  async getJSON<T>(key: string): Promise<T | null> {
    const raw = await this.getString(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch (e) {
      console.warn('[storage] parse failed', key, e);
      return null;
    }
  },

  async setJSON(key: string, value: unknown): Promise<void> {
    try {
      await this.setString(key, JSON.stringify(value));
    } catch (e) {
      console.warn('[storage] serialize failed', key, e);
    }
  },

  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
    } catch (e) {
      console.warn('[storage] clear failed', e);
    }
  },
};
