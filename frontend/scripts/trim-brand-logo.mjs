/**
 * Trim excess (near-white) margins from the header logo PNG.
 * Uses Sharp's trim so only the lettering/graphics remain tight in the file.
 *
 * Usage (from frontend/): node scripts/trim-brand-logo.mjs
 */
import sharp from "sharp";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const logoPath = join(__dirname, "../public/branding/logo.png");

const main = async () => {
  const fs = await import("fs/promises");
  const input = sharp(logoPath);
  const meta = await input.metadata();
  const trimmed = sharp(logoPath).trim({ threshold: 28 });
  const buf = await trimmed.png({ compressionLevel: 9 }).toBuffer();
  const probe = await sharp(buf).metadata();
  await fs.writeFile(logoPath, buf);
  console.log(
    `trim-brand-logo: ${meta.width}×${meta.height} → ${probe.width}×${probe.height} (written ${logoPath})`,
  );
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
