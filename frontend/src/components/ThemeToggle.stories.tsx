import type { Meta, StoryObj } from '@storybook/react';
import { within, userEvent } from '@storybook/testing-library';
import { 
  ThemeToggle, 
  ThemeToggleTriple, 
  ThemeToggleWithLabel, 
  ThemeDropdown 
} from './ThemeToggle';

/**
 * Theme Toggle components for switching between Light, Dark, and System themes.
 * 
 * ## Variants
 * - **ThemeToggle**: Simple toggle (light/dark)
 * - **ThemeToggleTriple**: Three-way toggle (light/system/dark)
 * - **ThemeToggleWithLabel**: Full settings card with label
 * - **ThemeDropdown**: Dropdown selector with descriptions
 */
const meta: Meta<typeof ThemeToggle> = {
  title: 'Components/ThemeToggle',
  component: ThemeToggle,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
רכיבי החלפת ערכת נושא. תומך במצבים: בהיר, כהה, ומערכת.
כולל מעברים חלקים ונגישות מלאה.
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ThemeToggle>;

/**
 * Simple toggle button (light/dark)
 */
export const SimpleToggle: Story = {
  render: () => <ThemeToggle />,
  parameters: {
    docs: {
      description: {
        story: 'כפתור פשוט להחלפה בין מצב בהיר לכהה',
      },
    },
  },
};

/**
 * Toggle interaction
 */
export const ToggleInteraction: Story = {
  render: () => <ThemeToggle />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button');
    await userEvent.click(button);
  },
};

/**
 * Three-way toggle (Light / System / Dark)
 */
export const TripleToggle: Story = {
  render: () => <ThemeToggleTriple />,
  parameters: {
    docs: {
      description: {
        story: 'בורר משולש: בהיר, מערכת, כהה',
      },
    },
  },
};

/**
 * Toggle with label (Settings style)
 */
export const WithLabel: Story = {
  render: () => (
    <div className="w-96">
      <ThemeToggleWithLabel />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'תצוגת כרטיס מלאה עם תווית ותיאור - מתאים לעמוד הגדרות',
      },
    },
  },
};

/**
 * Dropdown selector
 */
export const Dropdown: Story = {
  render: () => <ThemeDropdown />,
  parameters: {
    docs: {
      description: {
        story: 'בורר נפתח עם תיאורים לכל מצב',
      },
    },
  },
};

/**
 * Dropdown open state
 */
export const DropdownOpen: Story = {
  render: () => <ThemeDropdown />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button');
    await userEvent.click(button);
  },
};

/**
 * All variants together
 */
export const AllVariants: Story = {
  render: () => (
    <div className="space-y-8 p-4 w-96">
      <div>
        <h3 className="text-sm font-medium text-gray-500 mb-2">Simple Toggle</h3>
        <ThemeToggle />
      </div>
      
      <div>
        <h3 className="text-sm font-medium text-gray-500 mb-2">Triple Toggle</h3>
        <ThemeToggleTriple />
      </div>
      
      <div>
        <h3 className="text-sm font-medium text-gray-500 mb-2">With Label (Card)</h3>
        <ThemeToggleWithLabel />
      </div>
      
      <div>
        <h3 className="text-sm font-medium text-gray-500 mb-2">Dropdown</h3>
        <ThemeDropdown />
      </div>
    </div>
  ),
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        story: 'כל הווריאציות של רכיב החלפת ערכת נושא',
      },
    },
  },
};

/**
 * Dark mode background
 */
export const DarkModeVariants: Story = {
  render: () => (
    <div className="space-y-6 p-4 w-96">
      <ThemeToggle />
      <ThemeToggleTriple />
      <ThemeToggleWithLabel />
      <ThemeDropdown />
    </div>
  ),
  parameters: {
    backgrounds: { default: 'dark' },
    docs: {
      description: {
        story: 'הרכיבים במצב כהה',
      },
    },
  },
  globals: {
    theme: 'dark',
  },
};

/**
 * Mobile view
 */
export const MobileView: Story = {
  render: () => (
    <div className="space-y-4 w-72">
      <ThemeToggle />
      <ThemeToggleTriple />
    </div>
  ),
  parameters: {
    viewport: {
      defaultViewport: 'mobile',
    },
    docs: {
      description: {
        story: 'תצוגה למובייל',
      },
    },
  },
};

/**
 * Keyboard accessibility
 */
export const KeyboardAccessibility: Story = {
  render: () => <ThemeToggleTriple />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const buttons = canvas.getAllByRole('radio');
    
    // Focus first button and navigate with Tab
    buttons[0].focus();
    await userEvent.tab();
    await userEvent.tab();
  },
  parameters: {
    docs: {
      description: {
        story: 'בדיקת נגישות מקלדת - לחץ Tab לנווט',
      },
    },
  },
};
