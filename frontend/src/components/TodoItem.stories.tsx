import type { Meta, StoryObj } from '@storybook/react';
import { within, userEvent } from '@storybook/testing-library';
import { TodoItem } from './TodoItem';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fn } from '@storybook/test';

/**
 * TodoItem displays a single todo/sub-task with a checkbox.
 * Clicking the checkbox toggles the completion status.
 * 
 * ## Features
 * - Optimistic updates
 * - Voice feedback on toggle
 * - Loading state while updating
 * - Memoized for performance
 */
const meta: Meta<typeof TodoItem> = {
  title: 'Components/TodoItem',
  component: TodoItem,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
תת-משימה (טודו) עם אפשרות לסמן כהושלמה.
הקומפוננטה מציגה צ'קבוקס, כותרת, ומשוב קולי בעת עדכון.
        `,
      },
    },
  },
  argTypes: {
    todo: {
      description: 'אובייקט התת-משימה',
      control: 'object',
    },
    taskId: {
      description: 'מזהה המשימה האב',
      control: 'number',
    },
    onChange: {
      description: 'פונקציה שנקראת כאשר הסטטוס משתנה',
      action: 'changed',
    },
  },
  decorators: [
    (Story) => {
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      });
      return (
        <QueryClientProvider client={queryClient}>
          <div className="w-64 bg-white dark:bg-dark-surface p-2 rounded-lg">
            <Story />
          </div>
        </QueryClientProvider>
      );
    },
  ],
};

export default meta;
type Story = StoryObj<typeof TodoItem>;

/**
 * Uncompleted todo item
 */
export const Uncompleted: Story = {
  args: {
    todo: {
      id: 1,
      title: 'לנקות את השולחן',
      completed: false,
      task_id: 1,
      order: 1,
    },
    taskId: 1,
    onChange: fn(),
  },
};

/**
 * Completed todo item
 */
export const Completed: Story = {
  args: {
    todo: {
      id: 2,
      title: 'לסדר את הארון',
      completed: true,
      task_id: 1,
      order: 2,
    },
    taskId: 1,
    onChange: fn(),
  },
};

/**
 * Long title (should truncate or wrap gracefully)
 */
export const LongTitle: Story = {
  args: {
    todo: {
      id: 3,
      title: 'לסיים את כל המשימות בדירה כולל ניקוי, סידור, ארגון, והכנה לאורחים שמגיעים בערב',
      completed: false,
      task_id: 1,
      order: 3,
    },
    taskId: 1,
    onChange: fn(),
  },
};

/**
 * Hebrew RTL text
 */
export const HebrewText: Story = {
  args: {
    todo: {
      id: 4,
      title: 'לקנות חלב ולחם',
      completed: false,
      task_id: 1,
      order: 4,
    },
    taskId: 1,
    onChange: fn(),
  },
};

/**
 * English LTR text
 */
export const EnglishText: Story = {
  args: {
    todo: {
      id: 5,
      title: 'Clean the windows',
      completed: false,
      task_id: 1,
      order: 5,
    },
    taskId: 1,
    onChange: fn(),
  },
};

/**
 * Toggle interaction
 */
export const ToggleInteraction: Story = {
  args: {
    todo: {
      id: 6,
      title: 'משימה לבדיקה',
      completed: false,
      task_id: 1,
      order: 6,
    },
    taskId: 1,
    onChange: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const checkbox = await canvas.findByRole('checkbox');
    await userEvent.click(checkbox);
  },
};

/**
 * List of todos
 */
export const TodoList: Story = {
  render: () => (
    <div className="space-y-1 w-72">
      <TodoItem
        todo={{ id: 1, title: 'לנקות את המטבח', completed: true, task_id: 1, order: 1 }}
        taskId={1}
        onChange={() => {}}
      />
      <TodoItem
        todo={{ id: 2, title: 'לסדר את הסלון', completed: true, task_id: 1, order: 2 }}
        taskId={1}
        onChange={() => {}}
      />
      <TodoItem
        todo={{ id: 3, title: 'לשטוף כלים', completed: false, task_id: 1, order: 3 }}
        taskId={1}
        onChange={() => {}}
      />
      <TodoItem
        todo={{ id: 4, title: 'לנקות חלונות', completed: false, task_id: 1, order: 4 }}
        taskId={1}
        onChange={() => {}}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'רשימת תת-משימות מעורבת',
      },
    },
  },
};

/**
 * Dark mode
 */
export const DarkMode: Story = {
  args: {
    todo: {
      id: 7,
      title: 'משימה במצב כהה',
      completed: false,
      task_id: 1,
      order: 7,
    },
    taskId: 1,
    onChange: fn(),
  },
  parameters: {
    backgrounds: { default: 'dark' },
  },
  globals: {
    theme: 'dark',
  },
};
