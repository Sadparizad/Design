/** The address of one variant's prototype as a page of its own, with no Hub around it. */
export function prototypeUrl(feature: string, variant: string): string {
  const base = import.meta.env?.BASE_URL ?? "/";
  return `${base}prototype/${encodeURIComponent(feature)}/${encodeURIComponent(variant)}/`;
}
