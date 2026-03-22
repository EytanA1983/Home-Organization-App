/**
 * Trim excess whitespace around the header logo and add a small even padding.
 * Uses Sharp (same stack as optimize-images.js).
 *
 * Usage (from frontend/):
 *   node scripts/trim-brand-logo.js
 *
 * Optional: LOGO_PATH=./public/branding/logo.png node scripts/trim-brand-logo.js
 */
import sharp from "sharp";
import { readFile, writeFile } from "fs/promises";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const defaultLogo = join(__dirname, "..", "public", "branding", "logo.png");
const logoPath = resolve(process.env.LOGO_PATH || defaultLogo);

/** How similar to the corner color a pixel must be to count as "background" (0–255). */
const TRIM_THRESHOLD = Number(process.env.TRIM_THRESHOLD || 22);
/** Transparent margin around the artwork after trim (px). */
const PADDING = Number(process.env.LOGO_PAD || 12);

async function main() {
  const input = await readFile(logoPath);
  const meta = await sharp(input).metadata();
  const { width, height } = meta;
  console.log(`Logo: ${logoPath}`);
  console.log(`Before: ${width}×${height}`);

  // Trim border, then add transparent padding so the bar color shows through at edges.
  const out = await sharp(input)
    .ensureAlpha()
    .trim({ threshold: TRIM_THRESHOLD })
    .extend({
      top: PADDING,
      bottom: PADDING,
      left: PADDING,
      right: PADDING,
      background: { r: 255, g: 255, b: 255, alpha: 0 },
    })
    .png({ compressionLevel: 9, effort: 10 })
    .toBuffer();

  await writeFile(logoPath, out);
  const after = await sharp(out).metadata();
  console.log(`After:  ${after.width}×${after.height} (trim + ${PADDING}px pad, transparent)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
