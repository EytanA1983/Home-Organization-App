/**
 * Resolve inventory `photo_url` for <img src>.
 * Uploaded files are stored as `/static/uploads/...` on the API host; external links stay absolute.
 */
export function inventoryPhotoSrc(photoUrl: string | null | undefined): string {
  if (!photoUrl || !String(photoUrl).trim()) return "";
  const u = String(photoUrl).trim();
  if (/^https?:\/\//i.test(u)) return u;
  if (u.startsWith("/")) return u;
  return u;
}
