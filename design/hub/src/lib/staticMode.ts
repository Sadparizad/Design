/**
 * Static mode is the read-only copy published to GitHub Pages: there is no server, so the
 * `/api/*` calls become JSON files written next to the page by `scripts/snapshot.ts`.
 */
export const STATIC = import.meta.env?.VITE_STATIC === "1";

/** The address to fetch for a local API address. Unchanged outside static mode. */
export function apiUrl(url: string): string {
  if (!STATIC) return url;
  const u = new URL(url, "http://x");
  const p = u.pathname;
  let file: string;
  if (p === "/api/documents") file = `documents-${u.searchParams.get("kind")}`;
  else if (p === "/api/document") file = `document/${u.searchParams.get("path")}`;
  else file = p.replace(/^\/api\//, "");
  return `${import.meta.env.BASE_URL}api/${file.split("/").map(encodeURIComponent).join("/")}.json`;
}
