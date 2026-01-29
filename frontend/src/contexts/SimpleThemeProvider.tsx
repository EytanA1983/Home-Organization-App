/**
 * Simple Theme Provider (Minimal Version)
 *
 * Minimal dark-mode toggle implementation
 * Features:
 * - Simple boolean dark/light toggle
 * - localStorage persistence
 * - data-theme attribute support
 *
 * Usage:
 *   Replace ThemeProvider with SimpleThemeProvider for minimal implementation
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface SimpleThemeContextType {
  dark: boolean;
  setDark: (dark: boolean) => void;
  toggle: () => void;
}

const SimpleThemeContext = createContext<SimpleThemeContextType | undefined>(undefined);

export const useSimpleTheme = () => {
  const context = useContext(SimpleThemeContext);
  if (!context) {
    throw new Error('useSimpleTheme must be used within SimpleThemeProvider');
  }
  return context;
};

interface SimpleThemeProviderProps {
  children: ReactNode;
}

export const SimpleThemeProvider: React.FC<SimpleThemeProviderProps> = ({ children }) => {
  // Initialize from localStorage (check if 'dark' key exists and is truthy)
  const [dark, setDark] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      const stored = localStorage.getItem('dark');
      return stored === '1' || stored === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const root = document.documentElement;

    // Toggle dark class (for Tailwind dark: variant)
    root.classList.toggle('dark', dark);

    // Set data-theme attribute (for CSS variables)
    root.setAttribute('data-theme', dark ? 'dark' : 'light');

    // Update color-scheme for native elements
    root.style.colorScheme = dark ? 'dark' : 'light';

    // Persist to localStorage
    try {
      if (dark) {
        localStorage.setItem('dark', '1');
      } else {
        localStorage.removeItem('dark'); // Clean up
      }
    } catch {
      // localStorage not available
    }
  }, [dark]);

  const toggle = () => setDark(prev => !prev);

  return (
    <SimpleThemeContext.Provider value={{ dark, setDark, toggle }}>
      {children}
    </SimpleThemeContext.Provider>
  );
};
