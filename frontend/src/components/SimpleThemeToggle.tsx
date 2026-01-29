/**
 * Simple Theme Toggle (Minimal Version)
 *
 * Minimal dark-mode toggle button
 * Usage with SimpleThemeProvider
 */

import React from 'react';
import { useSimpleTheme } from '../contexts/SimpleThemeProvider';

export const SimpleThemeToggle: React.FC = () => {
  const { dark, toggle } = useSimpleTheme();

  return (
    <button
      onClick={toggle}
      className="
        relative
        inline-flex
        items-center
        justify-center
        w-14
        h-8
        rounded-full
        bg-gray-200
        dark:bg-gray-700
        transition-all
        duration-300
        focus:outline-none
        focus-visible:ring-2
        focus-visible:ring-sky
        focus-visible:ring-offset-2
        touch-target
      "
      aria-label={dark ? 'החלף למצב בהיר' : 'החלף למצב כהה'}
      title={dark ? 'מצב בהיר' : 'מצב כהה'}
    >
      {/* Toggle circle */}
      <span
        className={`
          absolute
          left-1
          top-1
          w-6
          h-6
          rounded-full
          bg-white
          dark:bg-gray-900
          shadow-md
          transform
          transition-transform
          duration-300
          flex
          items-center
          justify-center
          ${dark ? 'translate-x-6' : 'translate-x-0'}
        `}
      >
        <span className="text-sm">
          {dark ? '🌙' : '☀️'}
        </span>
      </span>
    </button>
  );
};
