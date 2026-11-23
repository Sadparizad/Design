import { visibleBody } from "../../data/markdown.ts";

export interface FigmaLink {
  /** The card title: "Design System". */
  title: string;
  /** The link text, which says what kind of file it is: "Figma file", "Figjam file". */
  label: string;
  /** The address, or null while the line still holds a placeholder. */
  href: string | null;
}

const LINE = /^\s*[-*+]\s+(.+?):\s*\[([^\]]*)\]\(\s*<?([^)\s>]*)>?\s*\)/;

/**
 * The links kept in design-system/figma.md, one per list line:
 * `- Design System: [Figma file](https://...)`. Other lines, and anything inside a code fence
 * or comment, are notes. An address that is not http(s) counts as not set yet.
 */
export function parseFigmaLinks(text: string): FigmaLink[] {
  const out: FigmaLink[] = [];
  let fenced = false;
  for (const line of visibleBody(text).split(/\r?\n/)) {
    if (/^\s*(```|~~~)/.test(line)) {
      fenced = !fenced;
      continue;
    }
    if (fenced) continue;
    const m = LINE.exec(line);
    if (!m) continue;
    const title = m[1].trim();
    if (title === "" || /^<[^>]*>$/.test(title)) continue;
    out.push({ title, label: m[2].trim(), href: /^https?:\/\//i.test(m[3]) ? m[3] : null });
  }
  return out;
}
