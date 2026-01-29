import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVoice } from '../hooks/useVoice';
import { getRoomRoute } from '../utils/routes';

// אם יש קובץ SVG, ניתן לייבא אותו כך:
// import houseSvgUrl from '../assets/house.svg?url';

export const HouseView = () => {
  const navigate = useNavigate();
  const { speak } = useVoice();
  const svgContainerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string | null>(null);

  // נניח שה‑SVG המותאם מכיל <g data-room-id="1" data-room-name="סלון">…</g> לכל חדר
  const onRoomClick = (roomId: number, roomName: string) => {
    speak(`נבחר חדר ${roomName}`);
    navigate(getRoomRoute(roomId), { state: { name: roomName } });
  };

  // טעינת SVG דינמית
  useEffect(() => {
    // אם יש קובץ SVG ב-public או ב-assets
    fetch('/house.svg')
      .then((res) => {
        if (!res.ok) {
          throw new Error(`SVG not found: ${res.status}`);
        }
        return res.text();
      })
      .then((text) => {
        setSvgContent(text);
      })
      .catch((err) => {
        console.warn('Could not load house.svg, using fallback:', err);
        // Fallback SVG פשוט - רק אם SVG חסר לחלוטין
        setSvgContent(`
          <svg width="400" height="400" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
            <rect width="400" height="400" fill="#FAF3E0" stroke="#333" stroke-width="2"/>
            <g data-room-id="1" data-room-name="סלון">
              <rect x="50" y="50" width="150" height="150" fill="#AEDFF7" stroke="#333" stroke-width="2"/>
              <text x="125" y="130" text-anchor="middle" font-size="16" font-weight="bold">סלון</text>
            </g>
            <g data-room-id="2" data-room-name="מטבח">
              <rect x="200" y="50" width="150" height="150" fill="#B4E7B5" stroke="#333" stroke-width="2"/>
              <text x="275" y="130" text-anchor="middle" font-size="16" font-weight="bold">מטבח</text>
            </g>
            <g data-room-id="3" data-room-name="חדר שינה">
              <rect x="50" y="200" width="150" height="150" fill="#F7C6C6" stroke="#333" stroke-width="2"/>
              <text x="125" y="280" text-anchor="middle" font-size="16" font-weight="bold">חדר שינה</text>
            </g>
            <g data-room-id="4" data-room-name="שירותים">
              <rect x="200" y="200" width="150" height="150" fill="#E8D5B7" stroke="#333" stroke-width="2"/>
              <text x="275" y="280" text-anchor="middle" font-size="16" font-weight="bold">שירותים</text>
            </g>
          </svg>
        `);
      });
  }, []);

  // הוספת מאזין קליקים לכל <g> אחרי טעינת ה-SVG
  useEffect(() => {
    if (!svgContent || !svgContainerRef.current) return;

    const container = svgContainerRef.current;
    const svg = container.querySelector<SVGSVGElement>('svg');
    if (!svg) return;

    const rooms = svg.querySelectorAll<SVGGElement>('[data-room-id]');
    const cleanupFunctions: (() => void)[] = [];

    rooms.forEach((g) => {
      const id = Number(g.dataset.roomId);
      const name = g.dataset.roomName ?? 'חדר';
      
      g.style.cursor = 'pointer';
      g.style.transition = 'opacity 0.2s';
      
      // הוספת hover effect
      const handleMouseEnter = () => {
        g.style.opacity = '0.8';
      };
      const handleMouseLeave = () => {
        g.style.opacity = '1';
      };
      
      // הוספת click handler
      const handleClick = () => onRoomClick(id, name);
      
      g.addEventListener('mouseenter', handleMouseEnter);
      g.addEventListener('mouseleave', handleMouseLeave);
      g.addEventListener('click', handleClick);

      cleanupFunctions.push(() => {
        g.removeEventListener('mouseenter', handleMouseEnter);
        g.removeEventListener('mouseleave', handleMouseLeave);
        g.removeEventListener('click', handleClick);
      });
    });

    return () => {
      cleanupFunctions.forEach((cleanup) => cleanup());
    };
  }, [svgContent, navigate]);

  return (
    <div className="flex justify-center p-4">
      <div
        ref={svgContainerRef}
        className="border rounded-md bg-cream"
        style={{ width: 400, height: 400 }}
        dangerouslySetInnerHTML={svgContent ? { __html: svgContent } : undefined}
      >
        {!svgContent && (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>טוען תצוגת בית...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HouseView;
