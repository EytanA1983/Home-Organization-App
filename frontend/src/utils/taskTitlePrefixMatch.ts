import type { TaskRead } from "../schemas/task";

/** Max letters for progressive “first / second / third” filtering in the focus timer. */
export const FOCUS_TASK_PREFIX_MAX_LEN = 3;

/**
 * True if `title` starts with `prefix`, character by character.
 * Latin letters are compared case-insensitively; other scripts (e.g. Hebrew) are exact.
 */
export function titleStartsWithPrefix(title: string, prefix: string): boolean {
  const t = title.trim();
  const p = prefix;
  if (!p) return true;
  if (t.length < p.length) return false;
  for (let i = 0; i < p.length; i++) {
    const pc = p[i]!;
    const tc = t[i]!;
    const pLatin = /[A-Za-z]/.test(pc);
    const tLatin = /[A-Za-z]/.test(tc);
    if (pLatin && tLatin) {
      if (pc.toLowerCase() !== tc.toLowerCase()) return false;
    } else if (pc !== tc) {
      return false;
    }
  }
  return true;
}

export function filterTasksByTitlePrefix(tasks: TaskRead[], prefix: string): TaskRead[] {
  const p = prefix.trim();
  if (!p) return tasks;
  return tasks.filter((task) => titleStartsWithPrefix(task.title ?? "", p));
}

export function sortTasksByTitle(tasks: TaskRead[]): TaskRead[] {
  return [...tasks].sort((a, b) =>
    (a.title ?? "").localeCompare(b.title ?? "", undefined, { sensitivity: "base" }),
  );
}

/** Keep only Unicode letters, max length (for the prefix input). */
export function sanitizeFocusTaskPrefix(raw: string, maxLen: number): string {
  const letters = raw.match(/\p{L}/gu);
  if (!letters?.length) return "";
  return letters.slice(0, maxLen).join("");
}
