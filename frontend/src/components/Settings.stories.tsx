import type { Meta, StoryObj } from '@storybook/react';
import { within, userEvent } from '@storybook/testing-library';
import { Settings } from './Settings';

/**
 * Settings page component for managing user preferences.
 * 
 * ## Features
 * - Push notifications toggle
 * - Google Calendar sync
 * - Theme toggle with label
 * - Voice feedback
 */
const meta: Meta<typeof Settings> = {
  title: 'Pages/Settings',
  component: Settings,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
עמוד הגדרות לניהול העדפות המשתמש:
- הפעלה/ביטול התראות פוש
- סנכרון עם Google Calendar
- החלפת ערכת נושא (בהיר/כהה)
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Settings>;

/**
 * Default settings view
 */
export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story: 'תצוגת ברירת מחדל של עמוד ההגדרות',
      },
    },
  },
};

/**
 * Settings with push enabled
 */
export const WithPushEnabled: Story = {
  parameters: {
    docs: {
      description: {
        story: 'הגדרות עם התראות פוש מופעלות',
      },
    },
  },
  decorators: [
    (Story) => {
      // Simulate push being enabled
      localStorage.setItem('push_endpoint', 'https://fcm.googleapis.com/fcm/send/fake-endpoint');
      return <Story />;
    },
  ],
};

/**
 * Mobile view
 */
export const MobileView: Story = {
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
};

/**
 * Interaction - Enable push notifications
 */
export const EnablePushInteraction: Story = {
  parameters: {
    docs: {
      description: {
        story: 'בדיקת אינטראקציה - הפעלת התראות פוש',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Find the enable push button
    const enableButton = await canvas.findByText('הפעל התראות');
    
    // Note: In a real scenario, this would trigger the push subscription flow
    // For Storybook, we just verify the button exists and is clickable
    await userEvent.click(enableButton);
  },
};

/**
 * Wide desktop view
 */
export const WideDesktop: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'desktopLarge',
    },
    docs: {
      description: {
        story: 'תצוגה למסך רחב',
      },
    },
  },
};

/**
 * Accessibility focused view
 */
export const AccessibilityView: Story = {
  parameters: {
    a11y: {
      config: {
        rules: [
          { id: 'color-contrast', enabled: true },
          { id: 'button-name', enabled: true },
          { id: 'heading-order', enabled: true },
        ],
      },
    },
    docs: {
      description: {
        story: 'בדיקת נגישות - בודק ניגודיות צבעים, שמות כפתורים, וסדר כותרות',
      },
    },
  },
};
