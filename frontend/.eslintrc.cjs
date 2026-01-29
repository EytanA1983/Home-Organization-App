/**
 * ESLint Configuration
 *
 * Features:
 * - TypeScript support
 * - React hooks rules
 * - Import sorting
 * - Accessibility rules
 * - Tailwind CSS class ordering
 * - Prettier integration
 */
module.exports = {
  root: true,
  env: {
    browser: true,
    es2022: true,
    node: true,
  },
  extends: [
    // Core ESLint recommended rules
    'eslint:recommended',

    // TypeScript recommended rules
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',

    // React rules
    'plugin:react/recommended',
    'plugin:react/jsx-runtime', // For React 17+ automatic JSX runtime
    'plugin:react-hooks/recommended',

    // Import rules
    'plugin:import/recommended',
    'plugin:import/typescript',

    // Accessibility rules
    'plugin:jsx-a11y/recommended',

    // Tailwind CSS ordering
    'plugin:tailwindcss/recommended',

    // Storybook (if using)
    'plugin:storybook/recommended',

    // Prettier - MUST be last to override formatting rules
    'prettier',
  ],
  ignorePatterns: [
    'dist',
    'build',
    'node_modules',
    '.eslintrc.cjs',
    'vite.config.ts',
    'tailwind.config.ts',
    'postcss.config.cjs',
    'cypress.config.ts',
    '*.min.js',
    'scripts/**',
    'public/**',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: ['./tsconfig.json', './tsconfig.node.json'],
    tsconfigRootDir: __dirname,
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: [
    '@typescript-eslint',
    'react',
    'react-hooks',
    'react-refresh',
    'import',
    'jsx-a11y',
    'tailwindcss',
  ],
  settings: {
    react: {
      version: 'detect',
    },
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
        project: './tsconfig.json',
      },
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
      },
    },
    tailwindcss: {
      callees: ['cn', 'clsx', 'cva'],
      config: 'tailwind.config.ts',
    },
  },
  rules: {
    // ==================== TypeScript ====================
    '@typescript-eslint/no-unused-vars': ['warn', {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
      caughtErrorsIgnorePattern: '^_',
    }],
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-non-null-assertion': 'warn',
    '@typescript-eslint/no-empty-function': 'warn',
    '@typescript-eslint/ban-ts-comment': ['warn', {
      'ts-ignore': 'allow-with-description',
      'ts-expect-error': 'allow-with-description',
    }],
    '@typescript-eslint/no-floating-promises': 'error',
    '@typescript-eslint/no-misused-promises': ['error', {
      checksVoidReturn: { attributes: false },
    }],
    '@typescript-eslint/await-thenable': 'error',
    '@typescript-eslint/no-unsafe-assignment': 'off', // Too strict for most projects
    '@typescript-eslint/no-unsafe-member-access': 'off',
    '@typescript-eslint/no-unsafe-call': 'off',
    '@typescript-eslint/no-unsafe-return': 'off',
    '@typescript-eslint/no-unsafe-argument': 'off',
    '@typescript-eslint/restrict-template-expressions': 'off',

    // ==================== React ====================
    'react/prop-types': 'off', // Not needed with TypeScript
    'react/display-name': 'off',
    'react/no-unescaped-entities': 'warn',
    'react/jsx-no-target-blank': ['error', { enforceDynamicLinks: 'always' }],
    'react/jsx-curly-brace-presence': ['warn', {
      props: 'never',
      children: 'never',
    }],
    'react/jsx-boolean-value': ['warn', 'never'],
    'react/self-closing-comp': 'warn',
    'react/jsx-no-useless-fragment': 'warn',
    'react-refresh/only-export-components': ['warn', {
      allowConstantExport: true,
    }],

    // ==================== React Hooks ====================
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',

    // ==================== Import ====================
    'import/order': ['warn', {
      groups: [
        'builtin',
        'external',
        'internal',
        ['parent', 'sibling'],
        'index',
        'object',
        'type',
      ],
      'newlines-between': 'always',
      alphabetize: {
        order: 'asc',
        caseInsensitive: true,
      },
      pathGroups: [
        {
          pattern: 'react',
          group: 'external',
          position: 'before',
        },
        {
          pattern: '@/**',
          group: 'internal',
        },
      ],
      pathGroupsExcludedImportTypes: ['react'],
    }],
    'import/no-duplicates': 'warn',
    'import/no-unresolved': 'error',
    'import/no-cycle': 'warn',
    'import/no-self-import': 'error',
    'import/first': 'error',
    'import/newline-after-import': 'warn',
    'import/no-named-as-default': 'warn',
    'import/no-named-as-default-member': 'off', // Too many false positives

    // ==================== Accessibility ====================
    'jsx-a11y/anchor-is-valid': ['warn', {
      components: ['Link'],
      specialLink: ['to'],
    }],
    'jsx-a11y/click-events-have-key-events': 'warn',
    'jsx-a11y/no-static-element-interactions': 'warn',
    'jsx-a11y/label-has-associated-control': ['warn', {
      assert: 'either',
    }],

    // ==================== Tailwind CSS ====================
    'tailwindcss/classnames-order': 'warn',
    'tailwindcss/no-custom-classname': 'off', // Allow custom classes
    'tailwindcss/no-contradicting-classname': 'error',

    // ==================== General ====================
    'no-console': ['warn', {
      allow: ['warn', 'error'],
    }],
    'no-debugger': 'warn',
    'no-alert': 'warn',
    'prefer-const': 'warn',
    'no-var': 'error',
    'eqeqeq': ['error', 'always', { null: 'ignore' }],
    'curly': ['warn', 'multi-line'],
    'no-nested-ternary': 'warn',
    'no-unneeded-ternary': 'warn',
    'no-duplicate-imports': 'off', // Handled by import/no-duplicates
    'spaced-comment': ['warn', 'always', {
      markers: ['/'],
    }],
  },
  overrides: [
    // Test files
    {
      files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx'],
      env: {
        jest: true,
      },
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
      },
    },
    // Cypress files
    {
      files: ['cypress/**/*.ts', 'cypress/**/*.tsx'],
      rules: {
        '@typescript-eslint/no-namespace': 'off',
      },
    },
    // Storybook files
    {
      files: ['**/*.stories.ts', '**/*.stories.tsx'],
      rules: {
        'import/no-anonymous-default-export': 'off',
      },
    },
    // Configuration files
    {
      files: ['*.config.ts', '*.config.js', '*.config.cjs'],
      rules: {
        '@typescript-eslint/no-var-requires': 'off',
      },
    },
  ],
};
