/**
 * i18n — language context with JSON translation files.
 *
 * Supported languages: en (English), hi (हिन्दी), mr (मराठी).
 * Unknown keys fall back to English, then to the raw key.
 */
import React, { createContext, useContext, useMemo } from 'react';

import en from './en.json';
import hi from './hi.json';
import mr from './mr.json';

export type LanguageCode = 'en' | 'hi' | 'mr';

export interface LanguageMeta {
  code: LanguageCode;
  label: string;
  native: string;
  flag: string;
}

export const LANGUAGE_LIST: LanguageMeta[] = [
  { code: 'en', label: 'English', native: 'English', flag: '🇬🇧' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी', flag: '🇮🇳' },
  { code: 'mr', label: 'Marathi', native: 'मराठी', flag: '🇮🇳' },
];

type TranslationDict = Record<string, string>;

const TRANSLATIONS: Record<LanguageCode, TranslationDict> = { en, hi, mr };

export type TranslationKey = keyof typeof en & string;

function getDict(code: string): TranslationDict {
  return TRANSLATIONS[code as LanguageCode] ?? en;
}

export function translate(code: LanguageCode | string, key: TranslationKey): string {
  const dict = getDict(code);
  return dict[key] ?? en[key] ?? key;
}

interface LanguageContextValue {
  language: LanguageCode;
  t: (key: TranslationKey) => string;
  translations: TranslationDict;
}

const LanguageContext = createContext<LanguageContextValue>({
  language: 'en',
  t: (key) => en[key] ?? key,
  translations: en,
});

/**
 * Provider — reads the language from a callback to avoid a hard dependency
 * on the app store (keeps i18n reusable and testable).
 */
export const LanguageProvider: React.FC<{
  language: LanguageCode;
  children: React.ReactNode;
}> = ({ language, children }) => {
  const value = useMemo<LanguageContextValue>(() => {
    const dict = getDict(language);
    const t = (key: TranslationKey): string => dict[key] ?? en[key] ?? key;
    return { language, t, translations: dict };
  }, [language]);

  return React.createElement(LanguageContext.Provider, { value }, children);
};

export const useLanguage = (): LanguageContextValue => useContext(LanguageContext);
