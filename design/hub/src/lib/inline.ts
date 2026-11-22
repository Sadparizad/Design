export type InlineToken =
  | { type: "text"; text: string }
  | { type: "code"; text: string }
  | { type: "bold"; text: string }
  | { type: "link"; text: string; href: string };

/** `code`, **bold** and [text](https://link). Nothing else is markup, and only http(s) links are. */
const INLINE = /`([^`]+)`|\*\*([^*]+)\*\*|\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;

export function tokenizeInline(source: string): InlineToken[] {
  const out: InlineToken[] = [];
  let last = 0;
  for (const m of source.matchAll(INLINE)) {
    if (m.index > last) out.push({ type: "text", text: source.slice(last, m.index) });
    if (m[1] !== undefined) out.push({ type: "code", text: m[1] });
    else if (m[2] !== undefined) out.push({ type: "bold", text: m[2] });
    else out.push({ type: "link", text: m[3], href: m[4] });
    last = m.index + m[0].length;
  }
  if (last < source.length) out.push({ type: "text", text: source.slice(last) });
  return out;
}
