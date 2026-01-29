import type { Meta, StoryObj } from '@storybook/react';
import LoadingSpinner, { LoadingOverlay, LoadingDots } from './LoadingSpinner';

/**
 * LoadingSpinner displays a spinning animation for loading states.
 * 
 * ## Features
 * - Multiple sizes (sm, md, lg)
 * - Customizable label
 * - Supports dark mode
 * - Accessible with aria-busy, aria-live, and role
 * - Respects reduced motion preference
 * 
 * ## Variants
 * - **LoadingSpinner** - Standard spinner with label
 * - **LoadingOverlay** - Full page loading overlay
 * - **LoadingDots** - Inline loading dots for buttons
 */
const meta: Meta<typeof LoadingSpinner> = {
  title: 'Components/LoadingSpinner',
  component: LoadingSpinner,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
אנימציית טעינה מסתובבת. משמשת להצגת מצבי טעינה ברחבי האפליקציה.
כוללת תמיכה בנגישות, מצב כהה, והתאמה לתנועה מופחתת.
        `,
      },
    },
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'גודל הספינר',
    },
    label: {
      control: 'text',
      description: 'טקסט לקוראי מסך',
    },
    showLabel: {
      control: 'boolean',
      description: 'האם להציג את התווית ויזואלית',
    },
    className: {
      control: 'text',
      description: 'מחלקות CSS נוספות',
    },
  },
};

export default meta;
type Story = StoryObj<typeof LoadingSpinner>;

/**
 * Default medium spinner
 */
export const Default: Story = {
  args: {
    size: 'md',
  },
};

/**
 * Small spinner
 */
export const Small: Story = {
  args: {
    size: 'sm',
  },
  parameters: {
    docs: {
      description: {
        story: 'ספינר קטן - מתאים לכפתורים ושדות טופס',
      },
    },
  },
};

/**
 * Large spinner
 */
export const Large: Story = {
  args: {
    size: 'lg',
  },
  parameters: {
    docs: {
      description: {
        story: 'ספינר גדול - מתאים לטעינת עמודים',
      },
    },
  },
};

/**
 * All sizes comparison
 */
export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-8">
      <div className="flex flex-col items-center gap-2">
        <LoadingSpinner size="sm" />
        <span className="text-xs text-gray-500">Small</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <LoadingSpinner size="md" />
        <span className="text-xs text-gray-500">Medium</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <LoadingSpinner size="lg" />
        <span className="text-xs text-gray-500">Large</span>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'השוואת כל הגדלים',
      },
    },
  },
};

/**
 * In button context
 */
export const InButton: Story = {
  render: () => (
    <button 
      className="btn-primary flex items-center gap-2 px-4 py-2 opacity-70 cursor-not-allowed"
      disabled
    >
      <LoadingSpinner size="sm" />
      <span>שומר...</span>
    </button>
  ),
  parameters: {
    docs: {
      description: {
        story: 'ספינר בתוך כפתור (מצב טעינה)',
      },
    },
  },
};

/**
 * Full page loading
 */
export const FullPage: Story = {
  render: () => (
    <div className="flex flex-col items-center justify-center min-h-[300px] gap-4">
      <LoadingSpinner size="lg" />
      <p className="text-gray-600 dark:text-dark-text animate-pulse">טוען נתונים...</p>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'טעינת עמוד מלא',
      },
    },
  },
};

/**
 * Dark mode
 */
export const DarkMode: Story = {
  args: {
    size: 'md',
  },
  parameters: {
    backgrounds: { default: 'dark' },
    docs: {
      description: {
        story: 'ספינר במצב כהה',
      },
    },
  },
  globals: {
    theme: 'dark',
  },
};

/**
 * Without visible label
 */
export const WithoutVisibleLabel: Story = {
  args: {
    size: 'md',
    showLabel: false,
    label: 'טוען נתונים...',
  },
  parameters: {
    docs: {
      description: {
        story: 'ספינר ללא תווית גלויה (התווית עדיין נגישה לקוראי מסך)',
      },
    },
  },
};

/**
 * Custom label
 */
export const CustomLabel: Story = {
  args: {
    size: 'md',
    label: 'שומר שינויים...',
    showLabel: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'ספינר עם תווית מותאמת אישית',
      },
    },
  },
};

/**
 * Loading overlay (full page)
 */
export const Overlay: Story = {
  render: () => (
    <div className="relative w-full h-64 bg-gray-100 rounded-lg">
      <p className="p-4 text-gray-600">תוכן מאחורי השכבה</p>
      <LoadingOverlay label="טוען עמוד..." />
    </div>
  ),
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        story: 'שכבת טעינה על כל העמוד',
      },
    },
  },
};

/**
 * Loading dots (inline)
 */
export const Dots: Story = {
  render: () => (
    <div className="space-y-4">
      <button className="btn-primary flex items-center gap-2 px-4 py-2">
        שומר <LoadingDots />
      </button>
      <p className="text-gray-600">
        מחשב תוצאות <LoadingDots />
      </p>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'נקודות טעינה אינליין - מתאימות לכפתורים וטקסט',
      },
    },
  },
};
