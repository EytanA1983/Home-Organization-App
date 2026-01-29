/**
 * Language Switcher Component
 * 
 * Features:
 * - Multiple display modes (buttons, dropdown, compact)
 * - RTL language support (auto-updates document direction)
 * - Accessible with ARIA labels
 * - Saves preference to localStorage
 */
import React, { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

// Supported languages configuration
export const LANGUAGES = [
  { code: 'he', name: 'עברית', nativeName: 'עברית', flag: '🇮🇱', dir: 'rtl' as const },
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧', dir: 'ltr' as const },
  { code: 'ru', name: 'Русский', nativeName: 'Русский', flag: '🇷🇺', dir: 'ltr' as const },
] as const;

export type LanguageCode = typeof LANGUAGES[number]['code'];

interface LanguageSwitcherProps {
  /** Display mode */
  mode?: 'buttons' | 'dropdown' | 'compact';
  /** Show flags */
  showFlags?: boolean;
  /** Show language name */
  showName?: boolean;
  /** Custom className */
  className?: string;
}

/**
 * Update document direction based on language
 */
const updateDocumentDirection = (langCode: string) => {
  const lang = LANGUAGES.find(l => l.code === langCode);
  const dir = lang?.dir || 'ltr';
  
  document.documentElement.setAttribute('dir', dir);
  document.documentElement.setAttribute('lang', langCode);
};

/**
 * Buttons mode - shows all languages as buttons
 */
export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  mode = 'buttons',
  showFlags = true,
  showName = true,
  className = '',
}) => {
  const { i18n, t } = useTranslation('settings');
  const [isOpen, setIsOpen] = useState(false);

  const currentLanguage = i18n.language?.split('-')[0] || 'he';
  const currentLang = LANGUAGES.find(l => l.code === currentLanguage) || LANGUAGES[0];

  // Update document direction when language changes
  useEffect(() => {
    updateDocumentDirection(currentLanguage);
  }, [currentLanguage]);

  const changeLanguage = useCallback((lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('i18nextLng', lng);
    updateDocumentDirection(lng);
    setIsOpen(false);
  }, [i18n]);

  // Buttons mode
  if (mode === 'buttons') {
    return (
      <div 
        className={`flex items-center gap-2 ${className}`}
        role="radiogroup"
        aria-label={t('language', 'שפה')}
      >
        {LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            onClick={() => changeLanguage(lang.code)}
            className={`
              px-3 py-1.5 rounded-md text-sm font-medium transition-all
              focus:outline-none focus-visible:ring-2 focus-visible:ring-sky focus-visible:ring-offset-2
              ${
                currentLanguage === lang.code
                  ? 'bg-sky text-white shadow-sm'
                  : 'bg-gray-200 dark:bg-dark-surface text-gray-700 dark:text-dark-text hover:bg-gray-300 dark:hover:bg-dark-border'
              }
            `}
            role="radio"
            aria-checked={currentLanguage === lang.code}
            aria-label={lang.nativeName}
            title={lang.nativeName}
          >
            {showFlags && <span className="me-1">{lang.flag}</span>}
            {showName && <span>{lang.nativeName}</span>}
          </button>
        ))}
      </div>
    );
  }

  // Compact mode - just the current language flag/code
  if (mode === 'compact') {
    return (
      <div className={`relative ${className}`}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="
            flex items-center gap-1 px-2 py-1 rounded-md
            bg-gray-200 dark:bg-dark-surface text-gray-700 dark:text-dark-text
            hover:bg-gray-300 dark:hover:bg-dark-border
            transition-colors
            focus:outline-none focus-visible:ring-2 focus-visible:ring-sky
          "
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-label={t('language', 'שפה')}
        >
          <span>{currentLang.flag}</span>
          <span className="text-sm font-medium uppercase">{currentLang.code}</span>
          <svg className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
            <div 
              className="
                absolute top-full mt-1 z-20
                bg-white dark:bg-dark-surface
                border border-gray-200 dark:border-dark-border
                rounded-lg shadow-lg py-1 min-w-[120px]
                animate-fade-in
              "
              role="listbox"
            >
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => changeLanguage(lang.code)}
                  className={`
                    w-full px-3 py-2 text-start flex items-center gap-2
                    hover:bg-gray-100 dark:hover:bg-dark-border
                    transition-colors
                    ${currentLanguage === lang.code ? 'bg-sky/10 text-sky' : 'text-gray-700 dark:text-dark-text'}
                  `}
                  role="option"
                  aria-selected={currentLanguage === lang.code}
                >
                  <span>{lang.flag}</span>
                  <span className="text-sm">{lang.nativeName}</span>
                  {currentLanguage === lang.code && <span className="ms-auto">✓</span>}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  // Dropdown mode
  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="
          flex items-center gap-2 px-4 py-2 w-full
          bg-white dark:bg-dark-surface
          border border-gray-200 dark:border-dark-border
          rounded-lg shadow-sm
          hover:bg-gray-50 dark:hover:bg-dark-border
          transition-colors
          focus:outline-none focus-visible:ring-2 focus-visible:ring-sky
        "
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={t('language', 'שפה')}
      >
        <span className="text-xl">{currentLang.flag}</span>
        <span className="flex-1 text-start text-gray-700 dark:text-dark-text">
          {currentLang.nativeName}
        </span>
        <svg className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div 
            className="
              absolute top-full mt-2 w-full z-20
              bg-white dark:bg-dark-surface
              border border-gray-200 dark:border-dark-border
              rounded-lg shadow-lg py-1
              animate-fade-in
            "
            role="listbox"
          >
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => changeLanguage(lang.code)}
                className={`
                  w-full px-4 py-3 text-start flex items-center gap-3
                  hover:bg-gray-100 dark:hover:bg-dark-border
                  transition-colors
                  ${currentLanguage === lang.code ? 'bg-sky/10' : ''}
                `}
                role="option"
                aria-selected={currentLanguage === lang.code}
              >
                <span className="text-xl">{lang.flag}</span>
                <span className="flex-1 text-gray-700 dark:text-dark-text">
                  {lang.nativeName}
                </span>
                {currentLanguage === lang.code && (
                  <span className="text-sky">✓</span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

/**
 * Hook to get current language info
 */
export const useLanguage = () => {
  const { i18n } = useTranslation();
  const currentCode = i18n.language?.split('-')[0] || 'he';
  const current = LANGUAGES.find(l => l.code === currentCode) || LANGUAGES[0];
  
  return {
    code: current.code,
    name: current.nativeName,
    flag: current.flag,
    dir: current.dir,
    isRTL: current.dir === 'rtl',
    languages: LANGUAGES,
    changeLanguage: (code: string) => {
      i18n.changeLanguage(code);
      localStorage.setItem('i18nextLng', code);
      updateDocumentDirection(code);
    },
  };
};

export default LanguageSwitcher;
