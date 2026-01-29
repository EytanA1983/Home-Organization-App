import type { Preview } from '@storybook/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '../src/contexts/ThemeContext';
import { I18nextProvider } from 'react-i18next';
import i18n from '../src/i18n/config';

// Import global styles
import '../src/index.css';

// Create a stable QueryClient for stories
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

/**
 * Global decorators that wrap all stories
 */
const preview: Preview = {
  parameters: {
    // Action handling
    actions: { argTypesRegex: '^on[A-Z].*' },
    
    // Controls configuration
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    
    // Backgrounds configuration
    backgrounds: {
      default: 'cream',
      values: [
        { name: 'cream', value: '#FAF3E0' },
        { name: 'dark', value: '#1a1a1a' },
        { name: 'white', value: '#ffffff' },
        { name: 'gray', value: '#f5f5f5' },
      ],
    },
    
    // Viewport presets for responsive testing
    viewport: {
      viewports: {
        mobile: {
          name: 'Mobile',
          styles: { width: '375px', height: '667px' },
        },
        tablet: {
          name: 'Tablet',
          styles: { width: '768px', height: '1024px' },
        },
        desktop: {
          name: 'Desktop',
          styles: { width: '1280px', height: '800px' },
        },
        desktopLarge: {
          name: 'Desktop Large',
          styles: { width: '1920px', height: '1080px' },
        },
        desktop4K: {
          name: '4K Display',
          styles: { width: '2560px', height: '1440px' },
        },
      },
    },
    
    // Layout configuration
    layout: 'padded',
    
    // RTL support for Hebrew
    direction: 'rtl',
    
    // A11y addon configuration
    a11y: {
      config: {
        rules: [
          {
            id: 'color-contrast',
            enabled: true,
          },
        ],
      },
    },
  },
  
  // Global decorators
  decorators: [
    // Theme Provider
    (Story, context) => {
      const theme = context.globals.theme || 'light';
      return (
        <ThemeProvider>
          <div className={theme === 'dark' ? 'dark' : ''}>
            <div 
              className="min-h-screen bg-cream dark:bg-dark-bg p-4"
              dir="rtl"
              lang="he"
            >
              <Story />
            </div>
          </div>
        </ThemeProvider>
      );
    },
    
    // React Router (for Link components)
    (Story) => (
      <BrowserRouter>
        <Story />
      </BrowserRouter>
    ),
    
    // React Query
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <Story />
      </QueryClientProvider>
    ),
    
    // i18n
    (Story) => (
      <I18nextProvider i18n={i18n}>
        <Story />
      </I18nextProvider>
    ),
  ],
  
  // Global types for toolbar controls
  globalTypes: {
    theme: {
      name: 'Theme',
      description: 'Global theme for components',
      defaultValue: 'light',
      toolbar: {
        icon: 'circlehollow',
        items: [
          { value: 'light', icon: 'sun', title: 'Light' },
          { value: 'dark', icon: 'moon', title: 'Dark' },
        ],
        showName: true,
        dynamicTitle: true,
      },
    },
    locale: {
      name: 'Locale',
      description: 'Language locale',
      defaultValue: 'he',
      toolbar: {
        icon: 'globe',
        items: [
          { value: 'he', right: '🇮🇱', title: 'עברית' },
          { value: 'en', right: '🇺🇸', title: 'English' },
        ],
        showName: true,
      },
    },
  },
};

export default preview;
