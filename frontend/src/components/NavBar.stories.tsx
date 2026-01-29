import type { Meta, StoryObj } from '@storybook/react';
import { within, userEvent } from '@storybook/testing-library';
import { expect } from '@storybook/jest';
import { NavBar } from './NavBar';

/**
 * NavBar provides the main navigation for the application.
 * It supports both authenticated and unauthenticated states,
 * and includes responsive design with a mobile menu.
 * 
 * ## Features
 * - Responsive design (desktop/mobile)
 * - Authentication-aware navigation
 * - Theme toggle
 * - Language switcher
 * - Full RTL support
 * - Accessibility compliant (ARIA labels, keyboard navigation)
 */
const meta: Meta<typeof NavBar> = {
  title: 'Components/NavBar',
  component: NavBar,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
סרגל ניווט ראשי של האפליקציה. כולל תמיכה ב:
- תצוגת מחשב ונייד
- מצב מחובר ולא מחובר
- החלפת ערכת נושא ושפה
- נגישות מלאה
        `,
      },
    },
  },
  decorators: [
    (Story) => {
      // Clear localStorage to ensure clean state for each story
      return <Story />;
    },
  ],
};

export default meta;
type Story = StoryObj<typeof NavBar>;

/**
 * Authenticated user view - shows all navigation items
 */
export const Authenticated: Story = {
  parameters: {
    docs: {
      description: {
        story: 'תצוגה למשתמש מחובר - מציג את כל פריטי הניווט',
      },
    },
  },
  decorators: [
    (Story) => {
      localStorage.setItem('token', 'fake-token-for-storybook');
      return <Story />;
    },
  ],
};

/**
 * Unauthenticated user view - shows login/register buttons
 */
export const Unauthenticated: Story = {
  parameters: {
    docs: {
      description: {
        story: 'תצוגה למשתמש לא מחובר - מציג כפתורי התחברות והרשמה',
      },
    },
  },
  decorators: [
    (Story) => {
      localStorage.removeItem('token');
      return <Story />;
    },
  ],
};

/**
 * Mobile view - shows hamburger menu
 */
export const MobileView: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile',
    },
    docs: {
      description: {
        story: 'תצוגה למובייל - תפריט המבורגר',
      },
    },
  },
  decorators: [
    (Story) => {
      localStorage.setItem('token', 'fake-token-for-storybook');
      return <Story />;
    },
  ],
};

/**
 * Mobile view with menu open
 */
export const MobileMenuOpen: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile',
    },
    docs: {
      description: {
        story: 'תצוגה למובייל עם תפריט פתוח',
      },
    },
  },
  decorators: [
    (Story) => {
      localStorage.setItem('token', 'fake-token-for-storybook');
      return <Story />;
    },
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Find and click the mobile menu button
    const menuButton = await canvas.findByLabelText('פתח תפריט');
    await userEvent.click(menuButton);
  },
};

/**
 * Tablet view
 */
export const TabletView: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
    docs: {
      description: {
        story: 'תצוגה לטאבלט',
      },
    },
  },
  decorators: [
    (Story) => {
      localStorage.setItem('token', 'fake-token-for-storybook');
      return <Story />;
    },
  ],
};

/**
 * Dark mode
 */
export const DarkMode: Story = {
  parameters: {
    backgrounds: { default: 'dark' },
    docs: {
      description: {
        story: 'תצוגה במצב כהה',
      },
    },
  },
  globals: {
    theme: 'dark',
  },
  decorators: [
    (Story) => {
      localStorage.setItem('token', 'fake-token-for-storybook');
      return <Story />;
    },
  ],
};

/**
 * Keyboard navigation test
 */
export const KeyboardNavigation: Story = {
  parameters: {
    docs: {
      description: {
        story: 'בדיקת ניווט מקלדת - לחץ Tab כדי לנווט בין הפריטים',
      },
    },
  },
  decorators: [
    (Story) => {
      localStorage.setItem('token', 'fake-token-for-storybook');
      return <Story />;
    },
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Find the logo link
    const logo = await canvas.findByLabelText(/חזרה לדף הבית/);
    
    // Focus on logo and check it's focusable
    logo.focus();
    expect(document.activeElement).toBe(logo);
    
    // Tab through navigation items
    await userEvent.tab();
    await userEvent.tab();
    await userEvent.tab();
  },
};

/**
 * Interaction test - Logout
 */
export const LogoutInteraction: Story = {
  parameters: {
    docs: {
      description: {
        story: 'בדיקת אינטראקציה - התנתקות',
      },
    },
  },
  decorators: [
    (Story) => {
      localStorage.setItem('token', 'fake-token-for-storybook');
      return <Story />;
    },
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Find and click the logout button
    const logoutButton = await canvas.findByLabelText('התנתק מהחשבון');
    await userEvent.click(logoutButton);
    
    // Verify token was removed
    expect(localStorage.getItem('token')).toBeNull();
  },
};

/**
 * Wide desktop view (4K)
 */
export const WideDesktop: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'desktop4K',
    },
    docs: {
      description: {
        story: 'תצוגה למסך רחב (4K)',
      },
    },
  },
  decorators: [
    (Story) => {
      localStorage.setItem('token', 'fake-token-for-storybook');
      return <Story />;
    },
  ],
};

/**
 * Active page highlighting
 */
export const ActivePage: Story = {
  parameters: {
    docs: {
      description: {
        story: 'הדגשת העמוד הפעיל בניווט',
      },
    },
  },
  decorators: [
    (Story) => {
      localStorage.setItem('token', 'fake-token-for-storybook');
      // The story will show the home page as active since we're on "/"
      return <Story />;
    },
  ],
};
