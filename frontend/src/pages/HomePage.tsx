import { useEffect, useState } from 'react';
import { RoomCard } from '../components/RoomCard';
import { HouseView } from '../components/HouseView';
import { useRooms } from '../hooks/useRooms';

type Room = { id: number; name: string };

// Hook to check if SVG exists
const useSvgExists = () => {
  const [svgExists, setSvgExists] = useState<boolean | null>(null);
  
  useEffect(() => {
    fetch('/house.svg')
      .then((res) => {
        setSvgExists(res.ok);
      })
      .catch(() => {
        setSvgExists(false);
      });
  }, []);
  
  return svgExists;
};

// Fallback component if HouseView fails
// Checks if SVG exists before rendering HouseView to prevent UI crashes
// Returns HouseView if SVG exists, null otherwise
const HouseViewFallback = () => {
  const svgExists = useSvgExists();
  
  // Show loading while checking
  if (svgExists === null) {
    return null;
  }
  
  // Render HouseView only if SVG exists
  if (svgExists) {
    return <HouseView />;
  }
  
  // If SVG doesn't exist, return null (RoomCard list will be shown separately)
  return null;
};

export const HomePage = () => {
  const { data: rooms = [], isLoading, error } = useRooms();

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky"></div>
          <span className="ml-3 text-gray-600 flex items-center gap-2">
            <span className="emoji">⏳</span>
            <span>טוען חדרים...</span>
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 font-medium">שגיאה: {(error as any)?.message || 'שגיאה בטעינת חדרים'}</p>
          <p className="text-red-600 text-sm mt-2">
            {(error as any)?.message?.includes('401') || (error as any)?.message?.includes('Unauthorized')
              ? 'נא להתחבר מחדש' 
              : 'נסה לרענן את הדף'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center gap-3 mb-6">
        <span className="emoji text-fluid-3xl">🏡</span>
        <h1 className="text-fluid-3xl font-bold">הבית שלי</h1>
      </div>
      
      {/* אם יש SVG – נשתמש בו */}
      <HouseViewFallback />
      
      {/* כרטיסיות חדרים - מוצגות תמיד אם יש חדרים */}
      {rooms.length > 0 && (
        <div className="grid-auto-fit mt-6">
          {rooms.map((r) => (
            <RoomCard key={r.id} roomId={r.id} name={r.name} />
          ))}
        </div>
      )}
      
      {/* הודעה אם אין חדרים */}
      {rooms.length === 0 && (
        <div className="mt-6 p-6 bg-blue-50 border border-blue-200 rounded-lg text-center">
          <span className="emoji text-5xl block mb-3">🏗️</span>
          <p className="text-blue-800 mb-2 font-medium">
            אין חדרים זמינים עדיין.
          </p>
          <p className="text-blue-600 text-sm">
            צור חדר חדש דרך ה-API או הוסף אותו ישירות למסד הנתונים.
          </p>
        </div>
      )}
    </div>
  );
};

export default HomePage;
