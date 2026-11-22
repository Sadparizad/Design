/** The variants a feature lists in variants.json: `{ "A": "Table", "B": "Cards" }`. */
export interface Variant {
  id: string;
  label: string;
  /** What the tab says: "A - Table", or just the id when there is no label. */
  title: string;
}

/**
 * Turn the parsed variants.json into a list, in file order. Anything that is not an
 * object of id to label (an empty file, an array, broken JSON read as `{}`) gives no variants.
 */
export function listVariants(data: unknown): Variant[] {
  if (data === null || typeof data !== "object" || Array.isArray(data)) return [];
  const out: Variant[] = [];
  for (const [rawId, value] of Object.entries(data)) {
    const id = rawId.trim();
    if (id === "") continue;
    const label = typeof value === "string" ? value.trim() : "";
    out.push({ id, label, title: label ? `${id} - ${label}` : id });
  }
  return out;
}
