/**
 * Critical CSS Extraction Script
 * 
 * This script runs after Vite build to:
 * 1. Extract critical CSS (above-the-fold styles)
 * 2. Inline critical CSS in HTML
 * 3. Defer non-critical CSS loading
 * 
 * Uses Critters - a library from Google that inlines critical CSS
 * https://github.com/GoogleChromeLabs/critters
 */

import Critters from 'critters';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DIST_DIR = path.resolve(__dirname, '../dist');
const HTML_FILE = path.join(DIST_DIR, 'index.html');

// Critters configuration
const crittersConfig = {
  // Inline all critical CSS
  inlineFonts: true,
  
  // Preload external stylesheets
  preload: 'swap',
  
  // Only inline critical CSS, don't remove unused styles
  pruneSource: false,
  
  // Reduce the maximum size of inlined CSS
  reduceInlineStyles: true,
  
  // Add noscript fallback
  noscriptFallback: true,
  
  // Logging
  logLevel: 'info',
  
  // Additional options
  path: DIST_DIR,
  publicPath: '/',
  
  // Fonts options
  fonts: true,
  
  // Keyframes - include animation keyframes
  keyframes: 'critical',
  
  // Media queries - include critical media queries
  compress: true,
  
  // Merge inline styles
  mergeStylesheets: true,
};

async function extractCriticalCSS() {
  console.log('🎨 Extracting Critical CSS...\n');
  
  try {
    // Check if dist folder exists
    try {
      await fs.access(DIST_DIR);
    } catch {
      console.error('❌ Error: dist folder not found. Run "npm run build:no-critical" first.');
      process.exit(1);
    }
    
    // Read the HTML file
    let html = await fs.readFile(HTML_FILE, 'utf-8');
    
    // Create Critters instance
    const critters = new Critters(crittersConfig);
    
    // Process the HTML
    const processedHtml = await critters.process(html);
    
    // Write the processed HTML back
    await fs.writeFile(HTML_FILE, processedHtml, 'utf-8');
    
    // Calculate size savings
    const originalSize = Buffer.byteLength(html, 'utf-8');
    const newSize = Buffer.byteLength(processedHtml, 'utf-8');
    const criticalCssMatch = processedHtml.match(/<style[^>]*>([\s\S]*?)<\/style>/);
    const criticalCssSize = criticalCssMatch 
      ? Buffer.byteLength(criticalCssMatch[1], 'utf-8') 
      : 0;
    
    console.log('✅ Critical CSS extracted successfully!\n');
    console.log('📊 Statistics:');
    console.log(`   Original HTML: ${formatBytes(originalSize)}`);
    console.log(`   New HTML: ${formatBytes(newSize)}`);
    console.log(`   Critical CSS inlined: ${formatBytes(criticalCssSize)}`);
    console.log(`   Size increase: ${formatBytes(newSize - originalSize)}\n`);
    
    // Show what was done
    console.log('🔧 Optimizations applied:');
    console.log('   ✓ Critical CSS inlined in <head>');
    console.log('   ✓ Non-critical CSS deferred with preload');
    console.log('   ✓ Font preloading added');
    console.log('   ✓ noscript fallback for CSS\n');
    
  } catch (error) {
    console.error('❌ Error extracting critical CSS:', error.message);
    process.exit(1);
  }
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Run the script
extractCriticalCSS();
