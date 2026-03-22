/**
 * PostCSS Configuration
 * 
 * Plugins:
 * - tailwindcss: Utility-first CSS framework
 * - autoprefixer: Adds vendor prefixes automatically (including IE11 grid)
 * - cssnano: Minifies CSS in production (optional, Vite handles this)
 */
module.exports = {
  plugins: {
    // Tailwind CSS - JIT mode is enabled by default in v3+
    tailwindcss: {},
    
    // Autoprefixer - adds vendor prefixes for browser compatibility
    // grid: true enables -ms- prefixes for CSS Grid in IE11
    autoprefixer: {
      grid: 'autoplace', // Enable IE11 grid prefixes with auto placement
      flexbox: 'no-2009', // Don't add old flexbox prefixes (2009 spec)
    },
    
    // CSS Nano - minification (Vite already does this, but can be more aggressive)
    ...(process.env.NODE_ENV === 'production' ? {
      cssnano: {
        preset: ['default', {
          discardComments: { removeAll: true },
          normalizeWhitespace: true,
          colormin: true,
          minifyFontValues: true,
          minifyGradients: true,
          // Don't merge @supports rules (needed for fallbacks)
          mergeRules: false,
        }],
      },
    } : {}),
  },
};
