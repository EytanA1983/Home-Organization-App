import { memo, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { resolveAreaPath } from '../utils/routes';
import { useTasks } from '../hooks/useTasks';
import type { TaskRead } from '../schemas/task';
import styles from './RoomCard.module.css';
import type { RoomCategory } from '../utils/roomLocalization';
import { getLocalizedRoomSubtitle, getLocalizedRoomTitle, inferRoomCategory } from '../utils/roomLocalization';

type Props = { 
  roomId: number; 
  name: string;
  customColor?: string;
};

// Get CSS variable for room type
const getRoomStyle = (roomType: RoomCategory, customColor?: string): React.CSSProperties => {
  if (customColor) {
    return {
      background: 'var(--color-surface)',
      color: 'var(--color-text)',
      border: `1px solid ${customColor}`,
      '--room-accent': customColor,
    } as React.CSSProperties;
  }
  
  return {
    background: 'var(--color-surface)',
    color: 'var(--color-text)',
    border: '1px solid var(--color-border)',
    '--room-accent': `var(--room-${roomType}-accent)`,
  } as React.CSSProperties;
};

// Progress bar component (memoized)
const ProgressBar = memo(({ progress, isComplete }: { progress: number; isComplete: boolean }) => (
  <div 
    className="mt-3 h-3 rounded-full overflow-hidden shadow-inner"
    style={{ backgroundColor: 'var(--progress-bg, rgba(0,0,0,0.1))' }}
  >
    <div
      className="h-full transition-all duration-500"
      style={{ 
        width: `${progress}%`,
        background: isComplete 
          ? 'var(--progress-complete, linear-gradient(90deg, #10B981, #34D399))'
          : 'var(--progress-fill, linear-gradient(90deg, #AEDFF7, #7BC4E8))'
      }}
    />
  </div>
));
ProgressBar.displayName = 'ProgressBar';

// Progress text component (memoized)
const ProgressText = memo(({ 
  progress, 
  isComplete, 
  isLoading, 
  taskCount,
  completedCount,
  labels,
}: { 
  progress: number; 
  isComplete: boolean; 
  isLoading: boolean;
  taskCount: number;
  completedCount: number;
  labels: {
    complete: string;
    loading: string;
    noTasks: string;
    completedSuffix: string;
  };
}) => (
  <div className="flex items-center justify-between mt-2">
    <p className="text-sm text-gray-600 dark:text-gray-300">
      {isComplete ? (
        <span>{labels.complete}</span>
      ) : isLoading ? (
        <span className="animate-pulse">{labels.loading}</span>
      ) : taskCount === 0 ? (
        <span>{labels.noTasks}</span>
      ) : (
        <span>{progress}% {labels.completedSuffix}</span>
      )}
    </p>
    <span className="text-xs text-gray-500 dark:text-gray-400">{completedCount}/{taskCount}</span>
  </div>
));
ProgressText.displayName = 'ProgressText';

// Task count badge (memoized)
const TaskCountBadge = memo(({ completed, total }: { completed: number; total: number }) => {
  if (total === 0) return null;
  
  return (
    <div 
      className="absolute top-2 right-2 px-2 py-0.5 text-xs font-bold rounded-full"
      style={{ 
        backgroundColor: 'var(--room-accent, #3b82f6)',
        color: '#fff'
      }}
    >
      {completed}/{total}
    </div>
  );
});
TaskCountBadge.displayName = 'TaskCountBadge';

// Main RoomCard component with React.memo
const RoomCardComponent = ({ roomId, name, customColor }: Props) => {
  const { t } = useTranslation('rooms');
  const { data: tasks = [], isLoading } = useTasks({ roomId });
  const labels = useMemo(
    () => ({
      complete: t('card.complete'),
      loading: t('card.loading'),
      noTasks: t('card.no_tasks'),
      completedSuffix: t('card.completed_suffix'),
    }),
    [t],
  );

  // Memoized calculations
  const roomType = useMemo(() => inferRoomCategory(name), [name]);
  const displayName = useMemo(() => getLocalizedRoomTitle(name, t, { roomId }), [name, t, roomId]);
  const roomStyle = useMemo(() => getRoomStyle(roomType, customColor), [roomType, customColor]);
  const roomSubtitle = useMemo(() => getLocalizedRoomSubtitle(name, t), [name, t]);
  
  // Memoize task statistics
  const { progress, completedCount, isComplete } = useMemo(() => {
    if (!tasks || tasks.length === 0) {
      return { progress: 0, completedCount: 0, isComplete: false };
    }
    const completed = tasks.filter((t: TaskRead) => t.completed).length;
    const prog = Math.round((completed / tasks.length) * 100);
    return { 
      progress: prog, 
      completedCount: completed, 
      isComplete: prog === 100 
    };
  }, [tasks]);

  return (
    <Link 
      to={resolveAreaPath({ id: roomId, name })} 
      className={`
        ${styles.card}
        block relative
        focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2
        touch-target
      `}
      style={roomStyle}
    >
      <div className={`${styles.cover} wow-fadeIn`} />

      {/* Room header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className={`${styles.title} truncate`}>{displayName}</h3>
          <p className={styles.subtitle}>{roomSubtitle}</p>
        </div>
      </div>
      
      {/* Progress bar */}
      <ProgressBar progress={progress} isComplete={isComplete} />
      
      {/* Progress text */}
      <ProgressText 
        progress={progress} 
        isComplete={isComplete} 
        isLoading={isLoading}
        taskCount={tasks.length}
        completedCount={completedCount}
        labels={labels}
      />
      
      {/* Task count badge */}
      <TaskCountBadge completed={completedCount} total={tasks.length} />
    </Link>
  );
};

// Export memoized component with custom comparison
export const RoomCard = memo(RoomCardComponent, (prevProps, nextProps) => {
  // Only re-render if these props change
  return (
    prevProps.roomId === nextProps.roomId &&
    prevProps.name === nextProps.name &&
    prevProps.customColor === nextProps.customColor
  );
});
RoomCard.displayName = 'RoomCard';

/**
 * RoomCardSkeleton - Loading placeholder (already static, no need for memo)
 */
export const RoomCardSkeleton = () => (
  <div className="block p-5 rounded-xl shadow-md bg-gray-200 dark:bg-dark-surface animate-pulse">
    <div className="flex items-center gap-3 mb-3">
      <div className="w-8 h-8 bg-gray-300 dark:bg-dark-border rounded-full" />
      <div className="h-5 w-24 bg-gray-300 dark:bg-dark-border rounded" />
    </div>
    <div className="mt-3 h-3 bg-gray-300 dark:bg-dark-border rounded-full" />
    <div className="flex items-center justify-between mt-2">
      <div className="h-4 w-20 bg-gray-300 dark:bg-dark-border rounded" />
      <div className="w-6 h-6 bg-gray-300 dark:bg-dark-border rounded-full" />
    </div>
  </div>
);

export default RoomCard;
