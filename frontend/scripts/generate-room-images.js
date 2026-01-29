/**
 * Room Image Generator Script
 * 
 * Generates placeholder room background images using sharp.
 * Creates multiple sizes and formats (WebP, JPEG).
 * 
 * Usage:
 *   node scripts/generate-room-images.js
 */

const fs = require('fs');
const path = require('path');

// Room types with colors
const ROOM_TYPES = [
  { name: 'living', color: '#AEDFF7', label: '🛋️' },
  { name: 'kitchen', color: '#FFE4B5', label: '🍳' },
  { name: 'bedroom', color: '#E6E6FA', label: '🛏️' },
  { name: 'bathroom', color: '#B0E0E6', label: '🚿' },
  { name: 'office', color: '#D3D3D3', label: '💼' },
  { name: 'balcony', color: '#98FB98', label: '🌿' },
  { name: 'kids', color: '#FFB6C1', label: '🧸' },
  { name: 'laundry', color: '#ADD8E6', label: '🧺' },
  { name: 'garage', color: '#C0C0C0', label: '🚗' },
  { name: 'default', color: '#B4E7B5', label: '🏠' },
];

// Output sizes
const SIZES = [400, 800, 1200, 1600];

// Output directory
const OUTPUT_DIR = './public/images/rooms';

async function generateImages() {
  console.log('🖼️  Room Image Generator');
  console.log('========================\n');
  
  // Check for sharp
  let sharp;
  try {
    sharp = require('sharp');
  } catch (e) {
    console.log('⚠️  sharp is not installed.');
    console.log('   Run: npm install -D sharp');
    console.log('\nGenerating placeholder SVGs instead...\n');
    generateSvgPlaceholders();
    return;
  }
  
  // Create output directory
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  
  console.log(`Output directory: ${OUTPUT_DIR}\n`);
  
  for (const room of ROOM_TYPES) {
    console.log(`Processing: ${room.name}`);
    
    for (const width of SIZES) {
      const height = Math.round(width * 0.75); // 4:3 aspect ratio
      
      // Generate gradient SVG
      const svg = generateGradientSvg(width, height, room.color, room.label);
      
      // WebP version
      const webpPath = path.join(OUTPUT_DIR, `${room.name}-${width}.webp`);
      await sharp(Buffer.from(svg))
        .resize(width, height)
        .webp({ quality: 80 })
        .toFile(webpPath);
      
      // JPEG version
      const jpgPath = path.join(OUTPUT_DIR, `${room.name}-${width}.jpg`);
      await sharp(Buffer.from(svg))
        .resize(width, height)
        .jpeg({ quality: 85 })
        .toFile(jpgPath);
      
      console.log(`  → ${room.name}-${width}.webp, ${room.name}-${width}.jpg`);
    }
    
    // Generate LQIP
    const lqipSvg = generateGradientSvg(20, 15, room.color, '');
    const lqipPath = path.join(OUTPUT_DIR, `${room.name}-lqip.webp`);
    await sharp(Buffer.from(lqipSvg))
      .resize(20, 15)
      .blur(5)
      .webp({ quality: 20 })
      .toFile(lqipPath);
    
    console.log(`  → ${room.name}-lqip.webp (LQIP)`);
  }
  
  console.log('\n✅ Done! Images generated in', OUTPUT_DIR);
  
  // Generate manifest
  generateManifest();
}

function generateGradientSvg(width, height, baseColor, emoji) {
  // Create a gradient from base color to a lighter shade
  const lighterColor = lightenColor(baseColor, 0.2);
  const darkerColor = darkenColor(baseColor, 0.1);
  
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${lighterColor};stop-opacity:1" />
          <stop offset="50%" style="stop-color:${baseColor};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${darkerColor};stop-opacity:1" />
        </linearGradient>
        <pattern id="dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
          <circle cx="10" cy="10" r="1" fill="rgba(255,255,255,0.1)"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grad)"/>
      <rect width="100%" height="100%" fill="url(#dots)"/>
      ${emoji ? `<text x="50%" y="50%" font-size="${width * 0.2}" text-anchor="middle" dominant-baseline="middle" opacity="0.3">${emoji}</text>` : ''}
    </svg>
  `.trim();
}

function lightenColor(hex, percent) {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent * 100);
  const R = Math.min(255, (num >> 16) + amt);
  const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
  const B = Math.min(255, (num & 0x0000FF) + amt);
  return `#${(1 << 24 | R << 16 | G << 8 | B).toString(16).slice(1)}`;
}

function darkenColor(hex, percent) {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent * 100);
  const R = Math.max(0, (num >> 16) - amt);
  const G = Math.max(0, ((num >> 8) & 0x00FF) - amt);
  const B = Math.max(0, (num & 0x0000FF) - amt);
  return `#${(1 << 24 | R << 16 | G << 8 | B).toString(16).slice(1)}`;
}

function generateSvgPlaceholders() {
  // Create output directory
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  
  for (const room of ROOM_TYPES) {
    console.log(`Creating SVG placeholders for: ${room.name}`);
    
    for (const width of SIZES) {
      const height = Math.round(width * 0.75);
      const svg = generateGradientSvg(width, height, room.color, room.label);
      
      const svgPath = path.join(OUTPUT_DIR, `${room.name}-${width}.svg`);
      fs.writeFileSync(svgPath, svg);
      console.log(`  → ${room.name}-${width}.svg`);
    }
  }
  
  console.log('\n✅ SVG placeholders created in', OUTPUT_DIR);
  console.log('\nNote: Install sharp for optimized WebP/JPEG images:');
  console.log('  npm install -D sharp');
  
  generateManifest();
}

function generateManifest() {
  const manifest = {
    generated: new Date().toISOString(),
    rooms: {},
  };
  
  for (const room of ROOM_TYPES) {
    manifest.rooms[room.name] = {
      label: room.label,
      color: room.color,
      sizes: SIZES.map(width => ({
        width,
        height: Math.round(width * 0.75),
        webp: `/images/rooms/${room.name}-${width}.webp`,
        jpg: `/images/rooms/${room.name}-${width}.jpg`,
        svg: `/images/rooms/${room.name}-${width}.svg`,
      })),
      lqip: `/images/rooms/${room.name}-lqip.webp`,
    };
  }
  
  const manifestPath = path.join(OUTPUT_DIR, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`\n📋 Manifest written to: ${manifestPath}`);
}

// Run
generateImages().catch(console.error);
