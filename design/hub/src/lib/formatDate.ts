const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * "2026-03-12" becomes "Mar 12", or "Mar 12, 2025" when it is not this year.
 * Anything that is not a real YYYY-MM-DD date comes back as written, so a hand-typed
 * "March" is never lost.
 */
export function formatDate(value: string, now: Date = new Date()): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!m) return value;
  const [year, month, day] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const check = new Date(Date.UTC(year, month - 1, day));
  if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) {
    return value;
  }
  const text = `${MONTHS[month - 1]} ${day}`;
  return year === now.getFullYear() ? text : `${text}, ${year}`;
}

/** "Mar 12 - Open" while the feature is still going, "Mar 12 - Nov 24" once it shipped. */
export function formatRange(started: string | null, shipped: string | null, now?: Date): string | null {
  if (!started && !shipped) return null;
  const from = started ? formatDate(started, now) : "Unknown";
  const to = shipped ? formatDate(shipped, now) : "Open";
  return `${from} - ${to}`;
}
