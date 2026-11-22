export interface FrontMatter {
  data: Record<string, string>;
  /** The text after the front matter block (the whole text when there is none). */
  body: string;
}

function unquote(v: string): string {
  const m = /^(["'])(.*)\1$/.exec(v);
  return m ? m[2] : v;
}

/**
 * A small YAML subset: `key: value` lines, quoted values, and indented continuation
 * lines (including `>` and `|` blocks, joined with spaces). Enough for SKILL.md and a
 * feature README.md; deliberately not a full YAML parser.
 */
export function parseFrontMatter(text: string): FrontMatter {
  const src = text.replace(/^﻿/, "");
  const m = /^---[ \t]*\r?\n(?:([\s\S]*?)\r?\n)?---[ \t]*(?:\r?\n|$)/.exec(src);
  if (!m) return { data: {}, body: src };

  const data: Record<string, string> = {};
  let key: string | null = null;
  for (const raw of (m[1] ?? "").split(/\r?\n/)) {
    if (/^\s*(#.*)?$/.test(raw)) continue;
    const cont = /^\s+(\S.*)$/.exec(raw);
    if (cont && key) {
      const piece = unquote(cont[1].trim());
      data[key] = data[key] ? `${data[key]} ${piece}` : piece;
      continue;
    }
    const kv = /^([A-Za-z0-9_ -]+?)\s*:\s*(.*)$/.exec(raw);
    if (!kv) {
      key = null;
      continue;
    }
    key = kv[1].trim();
    const value = kv[2].trim();
    data[key] = /^[>|][+-]?$/.test(value) ? "" : unquote(value);
  }
  return { data, body: src.slice(m[0].length) };
}
