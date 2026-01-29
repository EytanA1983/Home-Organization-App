import type { Meta, StoryObj } from '@storybook/react';
import { RoomCard, RoomCardSkeleton } from './RoomCard';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

/**
 * RoomCard displays a room with its task completion progress.
 * It automatically detects room type from the name and applies appropriate styling.
 * 
 * ## Features
 * - Automatic room type detection (סלון, מטבח, חדר שינה, etc.)
 * - Dynamic emoji based on room type
 * - Progress bar showing task completion
 * - CSS variable-based theming for each room type
 * - Responsive design with hover effects
 * - Full accessibility support
 */
const meta: Meta<typeof RoomCard> = {
  title: 'Components/RoomCard',
  component: RoomCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
כרטיס חדר מציג את שם החדר, אייקון מתאים, ופס התקדמות של המשימות.
הקומפוננטה מזהה אוטומטית את סוג החדר מהשם ומחילה סגנון מתאים.
        `,
      },
    },
  },
  argTypes: {
    roomId: {
      control: 'number',
      description: 'מזהה ייחודי של החדר',
    },
    name: {
      control: 'text',
      description: 'שם החדר (משמש גם לזיהוי סוג החדר)',
    },
    customColor: {
      control: 'color',
      description: 'צבע רקע מותאם אישית (אופציונלי)',
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: '280px' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof RoomCard>;

// Create mock query client with fake task data
const createMockQueryClient = (tasks: any[] = []) => {
  const client = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: Infinity,
      },
    },
  });
  
  // Pre-populate the cache with mock data
  client.setQueryData(['tasks', { roomId: 1 }], tasks);
  client.setQueryData(['tasks', { roomId: 2 }], tasks);
  client.setQueryData(['tasks', { roomId: 3 }], tasks);
  client.setQueryData(['tasks', { roomId: 4 }], tasks);
  client.setQueryData(['tasks', { roomId: 5 }], tasks);
  
  return client;
};

// Decorator with mocked tasks
const withMockedTasks = (tasks: any[]) => (Story: any) => (
  <QueryClientProvider client={createMockQueryClient(tasks)}>
    <Story />
  </QueryClientProvider>
);

/**
 * Default living room card with some completed tasks
 */
export const LivingRoom: Story = {
  args: {
    roomId: 1,
    name: 'סלון',
  },
  decorators: [
    withMockedTasks([
      { id: 1, title: 'נקה את הספה', completed: true },
      { id: 2, title: 'סדר את המדף', completed: false },
      { id: 3, title: 'שאב אבק', completed: true },
    ]),
  ],
};

/**
 * Kitchen room with all tasks completed
 */
export const KitchenComplete: Story = {
  args: {
    roomId: 2,
    name: 'מטבח',
  },
  decorators: [
    withMockedTasks([
      { id: 1, title: 'שטוף כלים', completed: true },
      { id: 2, title: 'נקה משטחים', completed: true },
      { id: 3, title: 'סדר מקרר', completed: true },
    ]),
  ],
  parameters: {
    docs: {
      description: {
        story: 'חדר עם כל המשימות הושלמו - מציג אפקט חגיגי',
      },
    },
  },
};

/**
 * Bedroom with no tasks
 */
export const BedroomEmpty: Story = {
  args: {
    roomId: 3,
    name: 'חדר שינה',
  },
  decorators: [withMockedTasks([])],
  parameters: {
    docs: {
      description: {
        story: 'חדר ללא משימות',
      },
    },
  },
};

/**
 * Bathroom room
 */
export const Bathroom: Story = {
  args: {
    roomId: 4,
    name: 'אמבטיה ושירותים',
  },
  decorators: [
    withMockedTasks([
      { id: 1, title: 'נקה אסלה', completed: false },
      { id: 2, title: 'שטוף רצפה', completed: true },
    ]),
  ],
};

/**
 * Office/Study room
 */
export const Office: Story = {
  args: {
    roomId: 5,
    name: 'חדר עבודה',
  },
  decorators: [
    withMockedTasks([
      { id: 1, title: 'סדר שולחן', completed: false },
      { id: 2, title: 'ארגן מסמכים', completed: false },
      { id: 3, title: 'נקה מחשב', completed: false },
      { id: 4, title: 'סדר כבלים', completed: false },
    ]),
  ],
};

/**
 * Balcony room
 */
export const Balcony: Story = {
  args: {
    roomId: 6,
    name: 'מרפסת',
  },
  decorators: [
    withMockedTasks([
      { id: 1, title: 'השקה צמחים', completed: true },
      { id: 2, title: 'נקה רצפה', completed: false },
    ]),
  ],
};

/**
 * Kids room
 */
export const KidsRoom: Story = {
  args: {
    roomId: 7,
    name: 'חדר ילדים',
  },
  decorators: [
    withMockedTasks([
      { id: 1, title: 'סדר צעצועים', completed: false },
      { id: 2, title: 'החלף מצעים', completed: true },
      { id: 3, title: 'נקה שולחן', completed: false },
    ]),
  ],
};

/**
 * Room with custom color override
 */
export const CustomColor: Story = {
  args: {
    roomId: 8,
    name: 'חדר מיוחד',
    customColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
  decorators: [
    withMockedTasks([
      { id: 1, title: 'משימה 1', completed: true },
      { id: 2, title: 'משימה 2', completed: false },
    ]),
  ],
  parameters: {
    docs: {
      description: {
        story: 'חדר עם צבע מותאם אישית',
      },
    },
  },
};

/**
 * Skeleton loading state
 */
export const Skeleton: Story = {
  render: () => <RoomCardSkeleton />,
  parameters: {
    docs: {
      description: {
        story: 'מצב טעינה - מוצג בזמן שהנתונים נטענים',
      },
    },
  },
};

/**
 * Grid of multiple rooms
 */
export const RoomGrid: Story = {
  decorators: [
    withMockedTasks([
      { id: 1, title: 'Task 1', completed: true },
      { id: 2, title: 'Task 2', completed: false },
    ]),
  ],
  render: () => (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4" style={{ width: '800px' }}>
      <RoomCard roomId={1} name="סלון" />
      <RoomCard roomId={2} name="מטבח" />
      <RoomCard roomId={3} name="חדר שינה" />
      <RoomCard roomId={4} name="אמבטיה" />
      <RoomCard roomId={5} name="משרד" />
      <RoomCard roomId={6} name="מרפסת" />
    </div>
  ),
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        story: 'תצוגת רשת של מספר חדרים',
      },
    },
  },
};

/**
 * Dark mode variant
 */
export const DarkMode: Story = {
  args: {
    roomId: 1,
    name: 'סלון',
  },
  decorators: [
    withMockedTasks([
      { id: 1, title: 'Task 1', completed: true },
      { id: 2, title: 'Task 2', completed: false },
    ]),
  ],
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
