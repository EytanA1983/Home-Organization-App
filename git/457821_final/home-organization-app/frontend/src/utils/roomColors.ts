/**
 * Room Color Utilities
 * 
 * Provides room type detection, color schemes, and styling utilities.
 * Colors are defined as CSS variables in index.css for theme support.
 */

export type RoomType = 
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

// Keywords for room type detection (Hebrew and English)
const roomKeywords: Record<RoomType, string[]> = {
  living: ['סלון', 'living', 'לובי', 'lobby', 'אורחים', 'guest'],
  kitchen: ['מטבח', 'kitchen', 'אוכל', 'dining', 'פינת אוכל'],
  bedroom: ['שינה', 'bedroom', 'חדר הורים', 'master', 'חדר אורחים'],
  bathroom: ['שירותים', 'bathroom', 'אמבטיה', 'מקלחת', 'shower', 'wc', 'toilet'],
  office: ['משרד', 'office', 'עבודה', 'study', 'קבינט', 'cabinet'],
  balcony: ['מרפסת', 'balcony', 'גינה', 'garden', 'פטיו', 'patio', 'חצר', 'yard'],
  closet: ['ארון', 'closet', 'מחסן', 'storage', 'מזווה', 'pantry'],
  kids: ['ילדים', 'kids', 'תינוק', 'baby', 'משחקים', 'playroom', 'נוער'],
  laundry: ['מכבסה', 'laundry', 'כביסה', 'utility'],
  garage: ['מוסך', 'garage', 'חניה', 'parking', 'מחסן גדול'],
  default: [],
};

// Emoji mapping for each room type
export const roomEmojis: Record<RoomType, string> = {
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

// Room type display names (Hebrew)
export const roomTypeNames: Record<RoomType, string> = {
  living: 'סלון',
  kitchen: 'מטבח',
  bedroom: 'חדר שינה',
  bathroom: 'שירותים/אמבטיה',
  office: 'משרד',
  balcony: 'מרפסת/גינה',
  closet: 'ארון/מחסן',
  kids: 'חדר ילדים',
  laundry: 'מכבסה',
  garage: 'מוסך/חניה',
  default: 'חדר',
};

/**
 * Detect room type from room name
 */
export const detectRoomType = (roomName: string): RoomType => {
  const name = roomName.toLowerCase();
  
  for (const [type, keywords] of Object.entries(roomKeywords) as [RoomType, string[]][]) {
    if (type === 'default') continue;
    if (keywords.some(keyword => name.includes(keyword))) {
      return type;
    }
  }
  
  return 'default';
};

/**
 * Get emoji for a room name
 */
export const getRoomEmoji = (roomName: string): string => {
  const type = detectRoomType(roomName);
  return roomEmojis[type];
};

/**
 * Get CSS variable names for a room type
 */
export const getRoomCssVars = (roomType: RoomType) => ({
  primary: `var(--room-${roomType}-primary)`,
  secondary: `var(--room-${roomType}-secondary)`,
  bg: `var(--room-${roomType}-bg)`,
  text: `var(--room-${roomType}-text)`,
  accent: `var(--room-${roomType}-accent)`,
});

/**
 * Get inline style object for room card
 */
export const getRoomStyle = (
  roomType: RoomType, 
  customColor?: string
): React.CSSProperties => {
  if (customColor) {
    // Calculate contrasting text color
    const isLightColor = isColorLight(customColor);
    return {
      background: customColor,
      color: isLightColor ? '#1f2937' : '#ffffff',
    };
  }
  
  return {
    background: `var(--room-${roomType}-bg)`,
    color: `var(--room-${roomType}-text)`,
  };
};

/**
 * Check if a hex color is light (for contrast calculation)
 */
const isColorLight = (hexColor: string): boolean => {
  // Remove # if present
  const hex = hexColor.replace('#', '');
  
  // Parse RGB values
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  return luminance > 0.5;
};

/**
 * All available room types for selection UI
 */
export const allRoomTypes: RoomType[] = [
  'living',
  'kitchen',
  'bedroom',
  'bathroom',
  'office',
  'balcony',
  'closet',
  'kids',
  'laundry',
  'garage',
  'default',
];

/**
 * Get all room type options for a dropdown/selector
 */
export const getRoomTypeOptions = () => 
  allRoomTypes.map(type => ({
    value: type,
    label: roomTypeNames[type],
    emoji: roomEmojis[type],
  }));

/**
 * Predefined color palettes for custom room colors
 */
export const colorPalettes = {
  pastel: [
    '#AEDFF7', // Sky blue
    '#B4E7B5', // Mint green
    '#F7C6C6', // Blush pink
    '#FFE4B5', // Peach
    '#E6E6FA', // Lavender
    '#DEB887', // Burlywood
    '#FFB6C1', // Light pink
    '#ADD8E6', // Light blue
  ],
  vibrant: [
    '#3B82F6', // Blue
    '#10B981', // Emerald
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#8B5CF6', // Violet
    '#EC4899', // Pink
    '#06B6D4', // Cyan
    '#84CC16', // Lime
  ],
  earth: [
    '#D4A574', // Tan
    '#8B7355', // Brown
    '#6B8E23', // Olive
    '#CD853F', // Peru
    '#DEB887', // Burlywood
    '#BC8F8F', // Rosy brown
    '#F4A460', // Sandy brown
    '#D2691E', // Chocolate
  ],
  monochrome: [
    '#1f2937', // Gray 800
    '#374151', // Gray 700
    '#4b5563', // Gray 600
    '#6b7280', // Gray 500
    '#9ca3af', // Gray 400
    '#d1d5db', // Gray 300
    '#e5e7eb', // Gray 200
    '#f3f4f6', // Gray 100
  ],
};

/**
 * Get suggested color based on room type
 */
export const getSuggestedColor = (roomType: RoomType, palette: keyof typeof colorPalettes = 'pastel'): string => {
  const paletteColors = colorPalettes[palette];
  const typeIndex = allRoomTypes.indexOf(roomType);
  return paletteColors[typeIndex % paletteColors.length];
};
