import type { FeatureSummary } from "../../data/types.ts";
import { knownStatus, STATUSES } from "../../lib/status.ts";

/** What a row calls the feature: the spec's title, which carries the version, else the folder. */
export function featureTitle(f: FeatureSummary): string {
  return f.title ?? f.name;
}

/** In progress first, then In review, then Shipped; any other status after those. */
function statusRank(f: FeatureSummary): number {
  const known = knownStatus(f.status);
  return known ? STATUSES.findIndex((s) => s.value === known.value) : STATUSES.length;
}

/** `YYYY-MM-DD` as a sortable number. Anything else, or no date, sorts last. */
function startedKey(f: FeatureSummary): number {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec((f.started ?? "").trim());
  return m ? Number(m[1]) * 10000 + Number(m[2]) * 100 + Number(m[3]) : -1;
}

/** Grouped by status, newest start first inside a group, then by name. */
export function sortFeatures(list: FeatureSummary[]): FeatureSummary[] {
  return [...list].sort(
    (a, b) =>
      statusRank(a) - statusRank(b) ||
      startedKey(b) - startedKey(a) ||
      featureTitle(a).localeCompare(featureTitle(b), "en", { numeric: true }),
  );
}

/**
 * Keep the features whose title or folder name contains the search text, and whose status is
 * the chosen one. An empty search or an empty status keeps everything.
 */
export function filterFeatures(
  list: FeatureSummary[],
  query: string,
  status: string,
): FeatureSummary[] {
  const q = query.trim().toLowerCase();
  return list.filter((f) => {
    if (q && !`${featureTitle(f)} ${f.name}`.toLowerCase().includes(q)) return false;
    if (status && knownStatus(f.status)?.value !== status) return false;
    return true;
  });
}
