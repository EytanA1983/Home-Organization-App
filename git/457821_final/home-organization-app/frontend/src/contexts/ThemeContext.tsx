/**
 * Theme Context
 *
 * Manages dark/light/system mode theme state
 * Features:
 * - No flash on page load (theme applied before React hydration)
 * - System preference detection and sync
 * - localStorage persistence
 * - Smooth color transitions
 */
import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';

export type Theme = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  systemTheme: ResolvedTheme;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Theme storage key
const THEME_STORAGE_KEY = 'theme';

// Get system color scheme preference
const getSystemTheme = (): ResolvedTheme => {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

// Get initial theme from localStorage or default to 'system'
const getInitialTheme = (): Theme => {
  if (typeof window === 'undefined') return 'system';

  try {
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY) as Theme;
    if (storedTheme && ['light', 'dark', 'system'].includes(storedTheme)) {
      return storedTheme;
    }
  } catch {
    // localStorage not available
  }

  return 'system';
};

// Resolve 'system' theme to actual light/dark
const resolveTheme = (theme: Theme, systemTheme: ResolvedTheme): ResolvedTheme => {
  if (theme === 'system') {
    return systemTheme;
  }
  return theme;
};

// Apply theme class and data attribute to document
const applyThemeClass = (resolvedTheme: ResolvedTheme) => {
  const root = document.documentElement;

  // Remove existing theme classes
  root.classList.remove('light', 'dark');

  // Add new theme class (for Tailwind dark: variant)
  root.classList.add(resolvedTheme);

  // Set data-theme attribute (for CSS variable theming)
  root.setAttribute('data-theme', resolvedTheme);

  // Update color-scheme for native elements (scrollbars, form controls)
  root.style.colorScheme = resolvedTheme;

  // Update meta theme-color for mobile browsers
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.setAttribute(
      'content',
      resolvedTheme === 'dark' ? '#111827' : '#FAF3E0'
    );
  }
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
  enableTransitions?: boolean;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultTheme,
  enableTransitions = true
}) => {
  const [theme, setThemeState] = useState<Theme>(() => defaultTheme || getInitialTheme());
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(getSystemTheme);
  const [mounted, setMounted] = useState(false);

  // Resolved theme (what's actually displayed)
  const resolvedTheme = resolveTheme(theme, systemTheme);

  // Apply theme on mount and changes
  useEffect(() => {
    setMounted(true);
    applyThemeClass(resolvedTheme);
  }, [resolvedTheme]);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent) => {
      const newSystemTheme = e.matches ? 'dark' : 'light';
      setSystemTheme(newSystemTheme);

      // Only apply if using system theme
      if (theme === 'system') {
        applyThemeClass(newSystemTheme);
      }
    };

    // Modern browsers
    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [theme]);

  // Enable/disable transitions
  useEffect(() => {
    const root = document.documentElement;

    if (enableTransitions && mounted) {
      // Add transition class after initial render to prevent flash
      root.classList.add('theme-transitions');
    } else {
      root.classList.remove('theme-transitions');
    }
  }, [enableTransitions, mounted]);

  // Persist theme to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // localStorage not available
    }
  }, [theme]);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prevTheme) => {
      // Cycle through: light -> dark -> system -> light
      if (prevTheme === 'light') return 'dark';
      if (prevTheme === 'dark') return 'system';
      return 'light';
    });
  }, []);

  // Prevent hydration mismatch by not rendering until mounted
  // But this is handled by the inline script in index.html

  return (
    <ThemeContext.Provider
      value={{
        theme,
        resolvedTheme,
        toggleTheme,
        setTheme,
        systemTheme
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * Hook to get only the resolved theme (light or dark)
 * Useful for components that don't need the full context
 */
export const useResolvedTheme = (): ResolvedTheme => {
  const { resolvedTheme } = useTheme();
  return resolvedTheme;
};

/**
 * Hook to check if dark mode is active
 */
export const useIsDark = (): boolean => {
  const { resolvedTheme } = useTheme();
  return resolvedTheme === 'dark';
};
