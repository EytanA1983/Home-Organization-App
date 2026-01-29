/**
 * i18n Configuration
 * תמיכה בריבוי שפות: עברית, אנגלית, רוסית
 */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files - using type assertion to avoid TS errors
import heTranslations from './locales/he.json';
import enTranslations from './locales/en.json';
import ruTranslations from './locales/ru.json';

i18n
  // Detect user language
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next
  .use(initReactI18next)
  // Initialize i18next
  .init({
    // Default language
    fallbackLng: 'he',
    
    // Supported languages
    supportedLngs: ['he', 'en', 'ru'],
    
    // Namespace
    defaultNS: 'common',
    ns: ['common', 'nav', 'a11y', 'validation', 'dates', 'pwa', 'rooms', 'tasks', 'todos', 'categories', 'auth', 'settings', 'calendar', 'toast', 'ml', 'privacy'],
    
    // Resources
    resources: {
      he: {
        common: heTranslations.common,
        nav: (heTranslations as any).nav,
        a11y: (heTranslations as any).a11y,
        validation: (heTranslations as any).validation,
        dates: (heTranslations as any).dates,
        pwa: (heTranslations as any).pwa,
        rooms: heTranslations.rooms,
        tasks: heTranslations.tasks,
        todos: (heTranslations as any).todos,
        categories: (heTranslations as any).categories,
        auth: heTranslations.auth,
        settings: heTranslations.settings,
        calendar: heTranslations.calendar,
        toast: heTranslations.toast,
        ml: heTranslations.ml,
        privacy: heTranslations.privacy,
      },
      en: {
        common: enTranslations.common,
        nav: (enTranslations as any).nav,
        a11y: (enTranslations as any).a11y,
        validation: (enTranslations as any).validation,
        dates: (enTranslations as any).dates,
        pwa: (enTranslations as any).pwa,
        rooms: enTranslations.rooms,
        tasks: enTranslations.tasks,
        todos: (enTranslations as any).todos,
        categories: (enTranslations as any).categories,
        auth: enTranslations.auth,
        settings: enTranslations.settings,
        calendar: enTranslations.calendar,
        toast: enTranslations.toast,
        ml: enTranslations.ml,
        privacy: enTranslations.privacy,
      },
      ru: {
        common: ruTranslations.common,
        nav: (ruTranslations as any).nav,
        a11y: (ruTranslations as any).a11y,
        validation: (ruTranslations as any).validation,
        dates: (ruTranslations as any).dates,
        pwa: (ruTranslations as any).pwa,
        rooms: ruTranslations.rooms,
        tasks: ruTranslations.tasks,
        todos: (ruTranslations as any).todos,
        categories: (ruTranslations as any).categories,
        auth: ruTranslations.auth,
        settings: ruTranslations.settings,
        calendar: ruTranslations.calendar,
        toast: ruTranslations.toast,
        ml: ruTranslations.ml,
        privacy: ruTranslations.privacy,
      },
    },
    
    // Options
    interpolation: {
      escapeValue: false, // React already escapes
    },
    
    // Detection options
    detection: {
      // Order of detection methods
      order: ['localStorage', 'navigator', 'htmlTag'],
      
      // Keys to lookup language from
      lookupLocalStorage: 'i18nextLng',
      
      // Cache user language
      caches: ['localStorage'],
    },
    
    // React options
    react: {
      useSuspense: false, // Disable suspense for better compatibility
    },
  });

export default i18n;
