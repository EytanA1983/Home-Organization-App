/** Deep-merge plain objects (for locale overrides on top of English base). */
export function mergeDeep<T extends Record<string, unknown>>(base: T, patch: Partial<T> | undefined): T {
  if (!patch) return base;
  const out = { ...base } as Record<string, unknown>;
  for (const key of Object.keys(patch)) {
    const pv = patch[key as keyof T];
    const bv = base[key as keyof T];
    if (
      pv &&
      typeof pv === "object" &&
      !Array.isArray(pv) &&
      bv &&
      typeof bv === "object" &&
      !Array.isArray(bv)
    ) {
      out[key] = mergeDeep(bv as Record<string, unknown>, pv as Record<string, unknown>);
    } else if (pv !== undefined) {
      out[key] = pv as unknown;
    }
  }
  return out as T;
}
