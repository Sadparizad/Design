import type { StatusTone } from "../components/StatusDot/StatusDot.tsx";

/**
 * The three statuses a feature README can carry, with the dot colour each has in the
 * Design history frame (500:33435): In progress is blue, In review is yellow, Shipped is cyan.
 */
export const STATUSES = [
  { value: "In progress", tone: "blue" },
  { value: "In review", tone: "yellow" },
  { value: "Shipped", tone: "cyan" },
] as const satisfies ReadonlyArray<{ value: string; tone: StatusTone }>;

const key = (s: string) => s.toLowerCase().replace(/[^a-z]/g, "");

/** The known status a README value means, or null. "in-progress" and "In Progress" both match. */
export function knownStatus(status: string | null): (typeof STATUSES)[number] | null {
  if (status === null) return null;
  return STATUSES.find((s) => key(s.value) === key(status)) ?? null;
}
