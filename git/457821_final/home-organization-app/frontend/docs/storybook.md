# Storybook Documentation

## Overview

Storybook is configured for component development, documentation, and visual testing.

## Getting Started

### Run Storybook

```bash
cd frontend
npm install
npm run storybook
```

Storybook will be available at `http://localhost:6006`

### Build Static Storybook

```bash
npm run build-storybook
```

This creates a static build in `storybook-static/` that can be deployed.

### Run Interaction Tests

```bash
npm run test-storybook
```

## Project Structure

```
frontend/
├── .storybook/
│   ├── main.ts         # Storybook configuration
│   └── preview.tsx     # Global decorators and parameters
├── src/
│   ├── Introduction.mdx              # Welcome page
│   └── components/
│       ├── RoomCard.tsx              # Component
│       ├── RoomCard.stories.tsx      # Stories
│       ├── NavBar.tsx
│       ├── NavBar.stories.tsx
│       └── ...
```

## Story File Convention

Each component should have a corresponding `.stories.tsx` file:

```typescript
// ComponentName.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { ComponentName } from './ComponentName';

const meta: Meta<typeof ComponentName> = {
  title: 'Category/ComponentName',
  component: ComponentName,
  tags: ['autodocs'],
  parameters: { /* ... */ },
  argTypes: { /* ... */ },
};

export default meta;
type Story = StoryObj<typeof ComponentName>;

export const Default: Story = {
  args: { /* ... */ },
};
```

## Features

### Addons Installed

| Addon | Purpose |
|-------|---------|
| `@storybook/addon-essentials` | Core addons (Controls, Actions, Docs, etc.) |
| `@storybook/addon-a11y` | Accessibility testing |
| `@storybook/addon-viewport` | Responsive testing |
| `@storybook/addon-interactions` | Play function testing |
| `@storybook/addon-links` | Navigation between stories |

### Global Decorators

All stories are automatically wrapped with:

1. **ThemeProvider** - Theme context (light/dark)
2. **BrowserRouter** - React Router support
3. **QueryClientProvider** - React Query support
4. **I18nextProvider** - i18n support

### Global Controls

Available in the Storybook toolbar:

- **Theme** - Toggle between light and dark mode
- **Locale** - Switch between Hebrew and English

### Viewport Presets

| Name | Dimensions |
|------|------------|
| Mobile | 375×667 |
| Tablet | 768×1024 |
| Desktop | 1280×800 |
| Desktop Large | 1920×1080 |
| 4K Display | 2560×1440 |

## Writing Stories

### Basic Story

```typescript
export const Default: Story = {
  args: {
    title: 'Example',
    completed: false,
  },
};
```

### Story with Decorators

```typescript
export const WithCustomProvider: Story = {
  args: { /* ... */ },
  decorators: [
    (Story) => (
      <CustomProvider>
        <Story />
      </CustomProvider>
    ),
  ],
};
```

### Story with Mock Data

```typescript
const mockData = [
  { id: 1, name: 'Item 1' },
  { id: 2, name: 'Item 2' },
];

export const WithMockData: Story = {
  decorators: [
    (Story) => {
      const queryClient = new QueryClient();
      queryClient.setQueryData(['items'], mockData);
      return (
        <QueryClientProvider client={queryClient}>
          <Story />
        </QueryClientProvider>
      );
    },
  ],
};
```

### Interaction Tests

```typescript
import { within, userEvent } from '@storybook/testing-library';
import { expect } from '@storybook/jest';

export const ClickInteraction: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = await canvas.findByRole('button');
    await userEvent.click(button);
    await expect(button).toHaveClass('active');
  },
};
```

## Accessibility Testing

The a11y addon automatically runs accessibility checks. To customize:

```typescript
export const AccessibleComponent: Story = {
  parameters: {
    a11y: {
      config: {
        rules: [
          { id: 'color-contrast', enabled: true },
          { id: 'button-name', enabled: true },
        ],
      },
    },
  },
};
```

## RTL Support

All stories are rendered with RTL direction for Hebrew support:

```tsx
// In preview.tsx
<div dir="rtl" lang="he">
  <Story />
</div>
```

## Best Practices

1. **One story file per component**
2. **Include multiple states** (default, loading, error, empty)
3. **Document with descriptions**
4. **Add interaction tests** for user flows
5. **Test responsive behavior** with viewport addon
6. **Check accessibility** with a11y addon

## Troubleshooting

### Styles Not Loading

Make sure `index.css` is imported in `preview.tsx`:

```typescript
import '../src/index.css';
```

### Component Not Rendering

Check that all required providers are in decorators.

### TypeScript Errors

Ensure proper types are installed:

```bash
npm install -D @types/react @types/react-dom
```

## Resources

- [Storybook Documentation](https://storybook.js.org/docs/react)
- [Writing Stories](https://storybook.js.org/docs/react/writing-stories/introduction)
- [Addons](https://storybook.js.org/addons)
- [Testing](https://storybook.js.org/docs/react/writing-tests/introduction)
