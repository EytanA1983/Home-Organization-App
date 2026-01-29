/**
 * Custom hook for translations
 * Wrapper around react-i18next useTranslation
 */
import { useTranslation as useI18nTranslation } from 'react-i18next';

export const useTranslation = (namespace?: string) => {
  return useI18nTranslation(namespace);
};
