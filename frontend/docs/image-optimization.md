# Image Optimization

## Overview

This project includes automatic image optimization using **Sharp** to reduce file sizes and improve loading performance.

## How It Works

The optimization script (`scripts/optimize-images.js`) automatically:

1. **Scans** the `public/` directory for images (JPG, PNG, WebP, AVIF)
2. **Resizes** images larger than 1920px width (maintains aspect ratio)
3. **Compresses** images with format-specific optimizations:
   - **JPEG**: Progressive encoding, MozJPEG compression (85% quality)
   - **PNG**: PNGQuant compression (90% quality, level 9)
   - **WebP**: High effort compression (85% quality)
   - **AVIF**: Modern format with excellent compression (50% quality)
4. **Preserves** original files (optimizes in place by default)

## Usage

### Automatic (Recommended)

Images are automatically optimized before each build:

```bash
npm run build
```

The `prebuild` hook runs `images:optimize` automatically.

### Manual

Optimize images manually:

```bash
# Optimize images in public/ directory
npm run images:optimize

# Optimize specific directories
node scripts/optimize-images.js ./public/images ./public/images
node scripts/optimize-images.js ./public/icons ./public/icons
```

## Configuration

### Supported Formats

- `.jpg`, `.jpeg` - JPEG images
- `.png` - PNG images
- `.webp` - WebP images
- `.avif` - AVIF images (modern, best compression)

### Quality Settings

Located in `scripts/optimize-images.js`:

```javascript
const QUALITY = {
  jpeg: 85,    // Good balance between quality and size
  png: 90,     // PNG preserves transparency better
  webp: 85,    // WebP is efficient, 85% is fine
  avif: 50,    // AVIF is very efficient, lower quality is fine
};
```

### Max Width

Images larger than 1920px are automatically resized:

```javascript
const MAX_WIDTH = 1920; // Max width for images
```

## Integration with Vite

The project also uses `vite-imagetools` for dynamic image optimization during build:

- **Dynamic imports** with `?w=400&format=webp` syntax
- **Responsive images** with `srcset` generation
- **Format conversion** (JPG → WebP/AVIF)

See `vite.config.ts` for configuration.

## Best Practices

### 1. Use Appropriate Formats

- **Photos**: Use JPEG (`.jpg`)
- **Logos/Icons**: Use PNG (`.png`) for transparency
- **Modern formats**: Use WebP or AVIF for better compression

### 2. Optimize Before Adding

Run optimization before committing large images:

```bash
npm run images:optimize
```

### 3. Use Responsive Images

For images in components, use `vite-imagetools`:

```tsx
import roomImage from './room.jpg?w=400;800;1200&format=webp';

<img
  srcSet={roomImage.sources.webp.map(s => s.srcset).join(', ')}
  src={roomImage.img.src}
  alt="Room"
/>
```

### 4. Lazy Loading

Always use lazy loading for images below the fold:

```tsx
<img src="..." alt="..." loading="lazy" />
```

## Performance Impact

### Typical Savings

- **JPEG**: 30-50% size reduction
- **PNG**: 40-60% size reduction
- **WebP**: 50-70% size reduction (vs JPEG)
- **AVIF**: 60-80% size reduction (vs JPEG)

### Example

Before optimization:
- `room-background.jpg`: 2.5MB (1920x1080)

After optimization:
- `room-background.jpg`: 850KB (1920x1080, 85% quality)
- **Savings**: 66% reduction

## Troubleshooting

### Images Not Optimizing

1. Check if images are in `public/` directory
2. Verify image format is supported (JPG, PNG, WebP, AVIF)
3. Check console output for errors

### Build Failing

If `prebuild` hook fails:

1. Check if `sharp` is installed: `npm list sharp`
2. Verify Node.js version (Sharp requires Node 14+)
3. Run optimization manually to see errors: `npm run images:optimize`

### Quality Issues

If images look too compressed:

1. Edit `QUALITY` settings in `scripts/optimize-images.js`
2. Increase quality values (e.g., `jpeg: 90`)
3. Re-run optimization

## CI/CD Integration

For CI/CD pipelines, ensure images are optimized:

```yaml
# GitHub Actions example
- name: Optimize images
  run: npm run images:optimize

- name: Build
  run: npm run build
```

## Related Documentation

- [Vite Image Tools](https://github.com/JonasKruckenberg/imagetools)
- [Sharp Documentation](https://sharp.pixelplumbing.com/)
- [Web.dev - Image Optimization](https://web.dev/fast/#optimize-your-images)
