import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  // Story file patterns
  stories: [
    '../src/**/*.mdx',
    '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)',
  ],
  
  // Addons for enhanced functionality
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-a11y', // Accessibility testing
    '@storybook/addon-viewport', // Responsive testing
  ],
  
  // React-Vite framework
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  
  // Documentation generation
  docs: {
    autodocs: 'tag',
  },
  
  // TypeScript configuration
  typescript: {
    check: false,
    reactDocgen: 'react-docgen-typescript',
  },
  
  // Vite specific configuration
  viteFinal: async (config) => {
    // Ensure CSS and Tailwind are processed
    return {
      ...config,
      css: {
        modules: {
          localsConvention: 'camelCase',
        },
      },
    };
  },
  
  // Static files
  staticDirs: ['../public'],
};

export default config;
