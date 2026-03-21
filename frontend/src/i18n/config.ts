/**
 * i18n — he, en, ru, fr, ar (+ merged fr/ar on English base for missing keys).
 */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import heTranslations from './locales/he.json';
import enTranslations from './locales/en.json';
import ruTranslations from './locales/ru.json';
import frOverrides from './locales/fr.overrides.json';
import arOverrides from './locales/ar.overrides.json';
import { mergeDeep } from './mergeDeep';
import { bundleLocale } from './localeBundle';

const frPack = mergeDeep(enTranslations as Record<string, unknown>, frOverrides as Record<string, unknown>);
const arPack = mergeDeep(enTranslations as Record<string, unknown>, arOverrides as Record<string, unknown>);

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: {
      fr: ['en', 'he'],
      ar: ['en', 'he'],
      default: ['he'],
    },
    supportedLngs: ['he', 'en', 'ru', 'fr', 'ar'],
    defaultNS: 'common',
    ns: [
      'common',
      'nav',
      'a11y',
      'validation',
      'dates',
      'pwa',
      'rooms',
      'productCategories',
      'tasks',
      'todos',
      'categories',
      'auth',
      'settings',
      'calendar',
      'toast',
      'ml',
      'privacy',
      'layout',
      'room',
      'visionBoard',
      'settingsUi',
      'dashboard',
      'emotionalJournal',
      'challenge',
      'emptyStates',
      'errors',
      'home',
    ],
    resources: {
      he: bundleLocale(heTranslations),
      en: bundleLocale(enTranslations),
      ru: bundleLocale(ruTranslations),
      fr: bundleLocale(frPack),
      ar: bundleLocale(arPack),
    },
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      lookupLocalStorage: 'i18nextLng',
      caches: ['localStorage'],
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;
