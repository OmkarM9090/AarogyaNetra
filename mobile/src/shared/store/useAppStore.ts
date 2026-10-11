/**
 * Global app store — language, disclaimer acknowledgment, app lifecycle.
 */
import { create } from 'zustand';

import type { LanguageCode } from '../i18n';
import { storageService, STORAGE_KEYS } from '../services/storage/asyncStorageService';

interface AppState {
  language: LanguageCode;
  setLanguage: (code: LanguageCode) => void;

  /** True once the user acknowledged the medical disclaimer (persisted). */
  disclaimerAcknowledged: boolean;
  acknowledgeDisclaimer: () => void;

  /** True after persisted data has been read at startup. */
  dataLoaded: boolean;
  loadData: () => Promise<void>;
}

export const useAppStore = create<AppState>((set) => ({
  language: 'en',
  disclaimerAcknowledged: false,
  dataLoaded: false,

  setLanguage: (code) => {
    set({ language: code });
    void storageService.setString(STORAGE_KEYS.LANGUAGE, code);
  },

  acknowledgeDisclaimer: () => {
    set({ disclaimerAcknowledged: true });
    void storageService.setString(STORAGE_KEYS.DISCLAIMER_ACK, '1');
  },

  loadData: async () => {
    try {
      const [language, ack] = await Promise.all([
        storageService.getString(STORAGE_KEYS.LANGUAGE),
        storageService.getString(STORAGE_KEYS.DISCLAIMER_ACK),
      ]);
      const lang = (language === 'hi' || language === 'mr' ? language : 'en') as LanguageCode;
      set({
        language: lang,
        disclaimerAcknowledged: ack === '1',
        dataLoaded: true,
      });
    } catch (e) {
      console.warn('[appStore] failed to load persisted data', e);
      set({ dataLoaded: true });
    }
  },
}));
