import { parseFrontMatter } from "./frontmatter.ts";

/** Body text with front matter and HTML comments removed. */
function visibleBody(text: string): string {
  return parseFrontMatter(text).body.replace(/<!--[\s\S]*?-->/g, "");
}

/** An unfilled template value such as `<Name>` counts as no value. */
export function cleanValue(value: string | null | undefined): string | null {
  const v = (value ?? "").trim();
  if (v === "" || /^<[^>]*>$/.test(v)) return null;
  return v;
}

/** The first `# ` heading outside code fences, or null. */
export function firstHeading(text: string): string | null {
  let fenced = false;
  for (const line of visibleBody(text).split(/\r?\n/)) {
    if (/^\s*(```|~~~)/.test(line)) {
      fenced = !fenced;
      continue;
    }
    if (fenced) continue;
    const m = /^#[ \t]+(.+?)[ \t]*#*[ \t]*$/.exec(line);
    if (m) return cleanValue(m[1]);
  }
  return null;
}

/** The first non-empty line outside code fences, without heading or list markers. */
export function firstLine(text: string): string | null {
  let fenced = false;
  for (const line of visibleBody(text).split(/\r?\n/)) {
    if (/^\s*(```|~~~)/.test(line)) {
      fenced = !fenced;
      continue;
    }
    if (fenced) continue;
    const t = line.replace(/^\s*(#{1,6}|[-*+]|\d+\.)\s+/, "").trim();
    const c = cleanValue(t);
    if (c) return c;
  }
  return null;
}

/**
 * Card description for a markdown document: the front matter `description`, else the
 * first heading, else the first line, else null.
 */
export function describe(text: string): string | null {
  return (
    cleanValue(parseFrontMatter(text).data.description) ?? firstHeading(text) ?? firstLine(text)
  );
}
