import { memo, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getRoomRoute } from '../utils/routes';
import { useTasks } from '../hooks/useTasks';

type Props = { 
  roomId: number; 
  name: string;
  customColor?: string;
};

// Room type detection and color mapping
type RoomType = 
  | 'living' 
  | 'kitchen' 
  | 'bedroom' 
  | 'bathroom' 
  | 'office' 
  | 'balcony' 
  | 'closet' 
  | 'kids'
  | 'laundry'
  | 'garage'
  | 'default';

// Detect room type from name (memoized outside component)
const detectRoomType = (roomName: string): RoomType => {
  const name = roomName.toLowerCase();
  
  if (name.includes('סלון') || name.includes('living') || name.includes('לובי') || name.includes('lobby')) {
    return 'living';
  }
  if (name.includes('מטבח') || name.includes('kitchen') || name.includes('אוכל') || name.includes('dining')) {
    return 'kitchen';
  }
  if (name.includes('שינה') || name.includes('bedroom') || name.includes('חדר הורים')) {
    return 'bedroom';
  }
  if (name.includes('שירותים') || name.includes('bathroom') || name.includes('אמבטיה') || name.includes('מקלחת')) {
    return 'bathroom';
  }
  if (name.includes('משרד') || name.includes('office') || name.includes('עבודה') || name.includes('study')) {
    return 'office';
  }
  if (name.includes('מרפסת') || name.includes('balcony') || name.includes('גינה') || name.includes('garden') || name.includes('פטיו')) {
    return 'balcony';
  }
  if (name.includes('ארון') || name.includes('closet') || name.includes('מחסן') || name.includes('storage')) {
    return 'closet';
  }
  if (name.includes('ילדים') || name.includes('kids') || name.includes('תינוק') || name.includes('baby') || name.includes('משחקים')) {
    return 'kids';
  }
  if (name.includes('מכבסה') || name.includes('laundry') || name.includes('כביסה')) {
    return 'laundry';
  }
  if (name.includes('מוסך') || name.includes('garage') || name.includes('חניה') || name.includes('parking')) {
    return 'garage';
  }
  
  return 'default';
};

// Room emoji mapping (static, no need to recreate)
const roomEmojis: Readonly<Record<RoomType, string>> = {
  living: '🛋️',
  kitchen: '🍳',
  bedroom: '🛏️',
  bathroom: '🚿',
  office: '💼',
  balcony: '🌿',
  closet: '🚪',
  kids: '🧸',
  laundry: '🧺',
  garage: '🚗',
  default: '🏠',
};

// Get CSS variable for room type
const getRoomStyle = (roomType: RoomType, customColor?: string): React.CSSProperties => {
  if (customColor) {
    return {
      background: customColor,
      '--room-text': '#ffffff',
    } as React.CSSProperties;
  }
  
  return {
    background: `var(--room-${roomType}-bg)`,
    color: `var(--room-${roomType}-text)`,
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
  taskCount 
}: { 
  progress: number; 
  isComplete: boolean; 
  isLoading: boolean;
  taskCount: number;
}) => (
  <div className="flex items-center justify-between mt-2">
    <p className="text-sm font-medium opacity-90">
      {isComplete ? (
        <span className="flex items-center gap-1">
          <span className="emoji">🎉</span>
          <span>הושלם!</span>
        </span>
      ) : isLoading ? (
        <span className="flex items-center gap-1">
          <span className="animate-pulse">טוען...</span>
        </span>
      ) : taskCount === 0 ? (
        <span className="flex items-center gap-1">
          <span className="emoji">📝</span>
          <span>אין משימות</span>
        </span>
      ) : (
        <span>{progress}% הושלמו</span>
      )}
    </p>
    <span className="emoji text-lg">{isComplete ? '✅' : '📋'}</span>
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
        backgroundColor: 'var(--room-accent, rgba(0,0,0,0.2))',
        color: 'white'
      }}
    >
      {completed}/{total}
    </div>
  );
});
TaskCountBadge.displayName = 'TaskCountBadge';

// Main RoomCard component with React.memo
const RoomCardComponent = ({ roomId, name, customColor }: Props) => {
  const { data: tasks = [], isLoading } = useTasks({ roomId });

  // Memoized calculations
  const roomType = useMemo(() => detectRoomType(name), [name]);
  const emoji = roomEmojis[roomType];
  const roomStyle = useMemo(() => getRoomStyle(roomType, customColor), [roomType, customColor]);
  
  // Memoize task statistics
  const { progress, completedCount, isComplete } = useMemo(() => {
    if (!tasks || tasks.length === 0) {
      return { progress: 0, completedCount: 0, isComplete: false };
    }
    const completed = tasks.filter((t: any) => t.completed).length;
    const prog = Math.round((completed / tasks.length) * 100);
    return { 
      progress: prog, 
      completedCount: completed, 
      isComplete: prog === 100 
    };
  }, [tasks]);

  return (
    <Link 
      to={getRoomRoute(roomId)} 
      className="
        block p-5 rounded-xl shadow-md relative
        hover:shadow-lg transition-all transform hover:scale-105
        focus:outline-none focus-visible:ring-2 focus-visible:ring-sky focus-visible:ring-offset-2
      "
      style={roomStyle}
    >
      {/* Room header */}
      <div className="flex items-center gap-3 mb-3">
        <span className="emoji text-3xl drop-shadow-sm">{emoji}</span>
        <h3 className="font-semibold text-lg truncate">{name}</h3>
      </div>
      
      {/* Progress bar */}
      <ProgressBar progress={progress} isComplete={isComplete} />
      
      {/* Progress text */}
      <ProgressText 
        progress={progress} 
        isComplete={isComplete} 
        isLoading={isLoading}
        taskCount={tasks.length}
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
