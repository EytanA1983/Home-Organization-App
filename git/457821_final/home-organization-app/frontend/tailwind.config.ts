import type { Config } from 'tailwindcss';
import forms from '@tailwindcss/forms';
import typography from '@tailwindcss/typography';

/**
 * Tailwind CSS Configuration
 *
 * Optimizations:
 * - JIT mode (default in Tailwind 3+)
 * - Proper content paths for tree-shaking
 * - Safelist for dynamic classes
 * - Custom theme colors for the app
 */
export default {
  // Content paths for purging unused CSS
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    './public/**/*.html',
  ],

  // Dark mode with class strategy (toggle via .dark class on <html>)
  darkMode: 'class',

  // Safelist: classes that are generated dynamically and shouldn't be purged
  safelist: [
    // מחרוזות דינאמיות (bg-{color})
    {
      pattern: /bg-(red|green|blue|yellow|gray)-(100|200|300|400|500|600|700|800|900)/,
    },
  ],

  theme: {
    // Extended breakpoints for better responsive design
    screens: {
      'xs': '475px',      // Small phones
      'sm': '640px',      // Large phones / Small tablets
      'md': '768px',      // Tablets portrait
      'lg': '1024px',     // Tablets landscape / Small laptops
      'xl': '1280px',     // Laptops / Desktops
      '2xl': '1536px',    // Large desktops
      '3xl': '1920px',    // Full HD monitors
      '4xl': '2560px',    // QHD / 4K monitors
      // Touch-specific breakpoints
      'touch': { 'raw': '(hover: none)' },
      'mouse': { 'raw': '(hover: hover)' },
      // Orientation
      'portrait': { 'raw': '(orientation: portrait)' },
      'landscape': { 'raw': '(orientation: landscape)' },
    },

    extend: {
      // Custom colors for the app
      colors: {
        // Primary palette - warm, home-like feeling
        cream: '#FAF3E0',
        sky: '#AEDFF7',
        mint: '#B4E7B5',
        blush: '#F7C6C6',
        earth: '#D4A574',

        // Simple semantic aliases (requested)
        primary: '#3B82F6',
        secondary: '#10B981',

        // Dark mode colors (WCAG AA compliant - contrast ratio >= 4.5:1)
        'dark-bg': '#111827',        // gray-900 - ensures high contrast
        'dark-surface': '#1f2937',  // gray-800 - better contrast than #2d2d2d
        'dark-text': '#f3f4f6',     // gray-100 - 15.8:1 on gray-900
        'dark-text-muted': '#d1d5db', // gray-300 - 7.1:1 on gray-900, 4.8:1 on gray-800
        'dark-border': '#404040',
        'dark-accent': '#3b82f6',

        // Status colors
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#3B82F6',
      },

      // Custom fonts - Hebrew optimized
      fontFamily: {
        sans: ['Rubik', 'Assistant', 'Heebo', 'system-ui', '-apple-system', 'sans-serif'],
        hebrew: ['Rubik', 'Heebo', 'Assistant', 'sans-serif'],
        rubik: ['Rubik', 'sans-serif'],
        assistant: ['Assistant', 'sans-serif'],
        heebo: ['Heebo', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },

      // Fluid typography using clamp()
      fontSize: {
        // Fluid sizes: clamp(min, preferred, max)
        'fluid-xs': 'clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem)',      // 12px - 14px
        'fluid-sm': 'clamp(0.875rem, 0.8rem + 0.375vw, 1rem)',        // 14px - 16px
        'fluid-base': 'clamp(1rem, 0.9rem + 0.5vw, 1.125rem)',        // 16px - 18px
        'fluid-lg': 'clamp(1.125rem, 1rem + 0.625vw, 1.25rem)',       // 18px - 20px
        'fluid-xl': 'clamp(1.25rem, 1.1rem + 0.75vw, 1.5rem)',        // 20px - 24px
        'fluid-2xl': 'clamp(1.5rem, 1.25rem + 1.25vw, 2rem)',         // 24px - 32px
        'fluid-3xl': 'clamp(1.875rem, 1.5rem + 1.875vw, 2.5rem)',     // 30px - 40px
        'fluid-4xl': 'clamp(2.25rem, 1.75rem + 2.5vw, 3rem)',         // 36px - 48px
        'fluid-5xl': 'clamp(3rem, 2.25rem + 3.75vw, 4rem)',           // 48px - 64px
        'fluid-6xl': 'clamp(3.75rem, 2.75rem + 5vw, 5rem)',           // 60px - 80px
      },

      // Container max-widths for different screens
      maxWidth: {
        'screen-xs': '475px',
        'screen-sm': '640px',
        'screen-md': '768px',
        'screen-lg': '1024px',
        'screen-xl': '1280px',
        'screen-2xl': '1536px',
        'screen-3xl': '1920px',
        'screen-4xl': '2560px',
        'readable': '65ch',  // Optimal reading width
        'content': '90rem',  // Max content width (1440px)
      },

      // Custom spacing (for RTL support + responsive)
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
        // Fluid spacing
        'fluid-1': 'clamp(0.25rem, 0.5vw, 0.5rem)',
        'fluid-2': 'clamp(0.5rem, 1vw, 1rem)',
        'fluid-4': 'clamp(1rem, 2vw, 2rem)',
        'fluid-8': 'clamp(2rem, 4vw, 4rem)',
        'fluid-16': 'clamp(4rem, 8vw, 8rem)',
      },

      // Border radius
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },

      // Box shadows
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'elevated': '0 10px 40px -10px rgba(0, 0, 0, 0.15)',
        'inner-soft': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
      },

      // Animations
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'fade-in-up': 'fadeInUp 0.4s ease-out',
        'fade-in-down': 'fadeInDown 0.4s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'slide-in-left': 'slideInLeft 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'shake': 'shake 0.5s ease-in-out',
        'confetti': 'confetti 1s ease-out forwards',
      },

      // Keyframes for animations
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-5px)' },
          '75%': { transform: 'translateX(5px)' },
        },
        confetti: {
          '0%': { transform: 'scale(0) rotate(0deg)', opacity: '1' },
          '50%': { transform: 'scale(1.2) rotate(180deg)', opacity: '1' },
          '100%': { transform: 'scale(1) rotate(360deg)', opacity: '0' },
        },
      },

      // Transitions
      transitionDuration: {
        '400': '400ms',
      },

      // Z-index scale
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      },

      // Backdrop blur
      backdropBlur: {
        xs: '2px',
      },
    },
  },

  // Plugins
  plugins: [
    forms,
    typography,
    // Custom plugin for RTL support and responsive utilities
    function({ addUtilities, addComponents }: { addUtilities: Function, addComponents: Function }) {
      addUtilities({
        // RTL-aware margins
        '.ms-auto': {
          'margin-inline-start': 'auto',
        },
        '.me-auto': {
          'margin-inline-end': 'auto',
        },
        // RTL-aware padding
        '.ps-4': {
          'padding-inline-start': '1rem',
        },
        '.pe-4': {
          'padding-inline-end': '1rem',
        },
        // Text alignment
        '.text-start': {
          'text-align': 'start',
        },
        '.text-end': {
          'text-align': 'end',
        },
        // Hide scrollbar but keep functionality
        '.scrollbar-hide': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': {
            display: 'none',
          },
        },
        // Thin scrollbar
        '.scrollbar-thin': {
          'scrollbar-width': 'thin',
          '&::-webkit-scrollbar': {
            width: '8px',
            height: '8px',
          },
          '&::-webkit-scrollbar-thumb': {
            'background-color': 'rgba(156, 163, 175, 0.5)',
            'border-radius': '4px',
          },
        },
        // Touch-friendly utilities
        '.touch-target': {
          'min-height': '44px',
          'min-width': '44px',
        },
        '.touch-target-lg': {
          'min-height': '48px',
          'min-width': '48px',
        },
        // Container queries (for component-level responsive)
        '.container-query': {
          'container-type': 'inline-size',
        },
        // Fluid text utilities
        '.text-fluid-title': {
          'font-size': 'clamp(1.5rem, 4vw, 3rem)',
          'line-height': '1.2',
        },
        '.text-fluid-subtitle': {
          'font-size': 'clamp(1.125rem, 2.5vw, 1.75rem)',
          'line-height': '1.3',
        },
        '.text-fluid-body': {
          'font-size': 'clamp(1rem, 1.5vw, 1.125rem)',
          'line-height': '1.6',
        },
        // Responsive gap utilities
        '.gap-responsive': {
          'gap': 'clamp(0.5rem, 2vw, 1.5rem)',
        },
        '.gap-responsive-lg': {
          'gap': 'clamp(1rem, 3vw, 2rem)',
        },
        // Responsive padding
        '.p-responsive': {
          'padding': 'clamp(1rem, 3vw, 2rem)',
        },
        '.px-responsive': {
          'padding-left': 'clamp(1rem, 3vw, 2rem)',
          'padding-right': 'clamp(1rem, 3vw, 2rem)',
        },
        '.py-responsive': {
          'padding-top': 'clamp(1rem, 3vw, 2rem)',
          'padding-bottom': 'clamp(1rem, 3vw, 2rem)',
        },
      });

      // Responsive component classes
      addComponents({
        // Responsive container
        '.container-responsive': {
          'width': '100%',
          'max-width': '100%',
          'margin-left': 'auto',
          'margin-right': 'auto',
          'padding-left': 'clamp(1rem, 3vw, 2rem)',
          'padding-right': 'clamp(1rem, 3vw, 2rem)',
          '@screen sm': {
            'max-width': '640px',
          },
          '@screen md': {
            'max-width': '768px',
          },
          '@screen lg': {
            'max-width': '1024px',
          },
          '@screen xl': {
            'max-width': '1280px',
          },
          '@screen 2xl': {
            'max-width': '1536px',
          },
          '@screen 3xl': {
            'max-width': '1920px',
          },
        },
        // Responsive grid for cards
        '.grid-cards': {
          'display': 'grid',
          'gap': 'clamp(0.75rem, 2vw, 1.5rem)',
          'grid-template-columns': 'repeat(1, minmax(0, 1fr))',
          '@screen xs': {
            'grid-template-columns': 'repeat(2, minmax(0, 1fr))',
          },
          '@screen md': {
            'grid-template-columns': 'repeat(3, minmax(0, 1fr))',
          },
          '@screen lg': {
            'grid-template-columns': 'repeat(4, minmax(0, 1fr))',
          },
          '@screen 3xl': {
            'grid-template-columns': 'repeat(5, minmax(0, 1fr))',
          },
          '@screen 4xl': {
            'grid-template-columns': 'repeat(6, minmax(0, 1fr))',
          },
        },
        // Responsive grid with auto-fit
        '.grid-auto-fit': {
          'display': 'grid',
          'gap': 'clamp(0.75rem, 2vw, 1.5rem)',
          'grid-template-columns': 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
        },
        '.grid-auto-fit-sm': {
          'display': 'grid',
          'gap': 'clamp(0.5rem, 1.5vw, 1rem)',
          'grid-template-columns': 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))',
        },
        '.grid-auto-fit-lg': {
          'display': 'grid',
          'gap': 'clamp(1rem, 2.5vw, 2rem)',
          'grid-template-columns': 'repeat(auto-fit, minmax(min(100%, 350px), 1fr))',
        },
      });
    },
  ],
} satisfies Config;
