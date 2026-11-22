/**
 * A small markdown parser for the document preview. Pure TypeScript: text in, a tree out.
 *
 * It covers what the Hub's files use: headings, paragraphs, bullet / numbered / task lists
 * (nested), tables, fenced code, block quotes, rules, and inline code, bold, italic,
 * strike-through and links. Everything else is shown as the plain text it is.
 *
 * Two deliberate choices:
 *  - Raw HTML is never interpreted. `<Product name>` is shown as written, which is what a
 *    template placeholder is. HTML comments (`<!-- ... -->`) are the one exception: they are
 *    invisible in any markdown preview, so they are dropped.
 *  - Tables follow GitHub's rule: the header and the divider row must have the same number of
 *    cells. A table that breaks the rule is not a table, and shows as text, as it would on GitHub.
 */
import { parseFrontMatter } from "../data/frontmatter.ts";

export type Inline =
  | { t: "text"; v: string }
  | { t: "code"; v: string }
  | { t: "strong"; c: Inline[] }
  | { t: "em"; c: Inline[] }
  | { t: "del"; c: Inline[] }
  | { t: "link"; href: string; c: Inline[] };

export interface ListItem {
  /** `[ ]` or `[x]` task marker: false or true. Null for an ordinary item. */
  checked: boolean | null;
  c: Inline[];
  /** Lists nested under this item. */
  children: List[];
}

export interface List {
  t: "list";
  ordered: boolean;
  start: number;
  items: ListItem[];
}

export type Align = "left" | "center" | "right" | null;

export type Block =
  | { t: "heading"; level: 1 | 2 | 3 | 4 | 5 | 6; c: Inline[] }
  | { t: "paragraph"; c: Inline[] }
  | List
  | { t: "code"; lang: string; v: string }
  | { t: "table"; align: Align[]; head: Inline[][]; rows: Inline[][][] }
  | { t: "quote"; blocks: Block[] }
  | { t: "rule" };

/* ── Inline ─────────────────────────────────────────────────── */

const PUNCT = /[!-/:-@[-`{-~]/;

/** Only these link targets are clickable. `javascript:` and friends are shown as plain text. */
export function safeHref(href: string): string | null {
  const h = href.trim();
  if (h === "") return null;
  if (/^(https?:|mailto:)/i.test(h)) return h;
  if (h.startsWith("#") || h.startsWith("/") || h.startsWith("./") || h.startsWith("../")) return h;
  if (!/^[a-z][a-z0-9+.-]*:/i.test(h)) return h; // relative, such as "notes.md"
  return null;
}

/** Index of the `]` that closes the `[` at `open`, skipping nested brackets and code spans. */
function closingBracket(s: string, open: number): number {
  let depth = 0;
  for (let i = open; i < s.length; i++) {
    const ch = s[i];
    if (ch === "\\") i++;
    else if (ch === "`") {
      const run = /^`+/.exec(s.slice(i))![0];
      const end = s.indexOf(run, i + run.length);
      if (end >= 0) i = end + run.length - 1;
      else i += run.length - 1;
    } else if (ch === "[") depth++;
    else if (ch === "]" && --depth === 0) return i;
  }
  return -1;
}

/** `(url "title")` starting at `open`. Returns the url and the index after `)`. */
function linkTarget(s: string, open: number): { href: string; end: number } | null {
  if (s[open] !== "(") return null;
  let depth = 0;
  for (let i = open; i < s.length; i++) {
    const ch = s[i];
    if (ch === "\\") i++;
    else if (ch === "(") depth++;
    else if (ch === ")" && --depth === 0) {
      let inner = s.slice(open + 1, i).trim();
      if (inner.startsWith("<") && inner.includes(">")) inner = inner.slice(1, inner.indexOf(">"));
      else inner = inner.replace(/\s+(["'(]).*$/s, "");
      return { href: inner, end: i + 1 };
    }
  }
  return null;
}

function pushText(out: Inline[], v: string): void {
  if (v === "") return;
  const last = out[out.length - 1];
  if (last && last.t === "text") last.v += v;
  else out.push({ t: "text", v });
}

export function parseInline(src: string): Inline[] {
  const out: Inline[] = [];
  const s = src;
  let i = 0;

  while (i < s.length) {
    const ch = s[i];

    if (ch === "\\" && i + 1 < s.length && PUNCT.test(s[i + 1])) {
      pushText(out, s[i + 1]);
      i += 2;
      continue;
    }

    if (ch === "`") {
      const run = /^`+/.exec(s.slice(i))![0];
      const end = s.indexOf(run, i + run.length);
      if (end > i + run.length - 1 && s[end + run.length] !== "`") {
        let v = s.slice(i + run.length, end).replace(/\n/g, " ");
        if (v.length > 2 && v.startsWith(" ") && v.endsWith(" ")) v = v.slice(1, -1);
        out.push({ t: "code", v });
        i = end + run.length;
        continue;
      }
      pushText(out, run);
      i += run.length;
      continue;
    }

    if (ch === "[") {
      const close = closingBracket(s, i);
      if (close > 0) {
        const target = linkTarget(s, close + 1);
        if (target) {
          const label = parseInline(s.slice(i + 1, close));
          const href = safeHref(target.href);
          if (href === null) out.push(...label);
          else out.push({ t: "link", href, c: label });
          i = target.end;
          continue;
        }
      }
      pushText(out, ch);
      i++;
      continue;
    }

    if (ch === "<") {
      const auto = /^<((?:https?:\/\/|mailto:)[^\s<>]+)>/i.exec(s.slice(i));
      if (auto) {
        out.push({ t: "link", href: auto[1], c: [{ t: "text", v: auto[1] }] });
        i += auto[0].length;
        continue;
      }
    }

    if (ch === "h" && /^https?:\/\//i.test(s.slice(i, i + 8)) && (i === 0 || /[\s(]/.test(s[i - 1]))) {
      const m = /^https?:\/\/[^\s<>()[\]"'`]+/i.exec(s.slice(i))!;
      const url = m[0].replace(/[.,;:!?*_~]+$/, "");
      out.push({ t: "link", href: url, c: [{ t: "text", v: url }] });
      i += url.length;
      continue;
    }

    if (ch === "*" || ch === "_" || ch === "~") {
      const double = s[i + 1] === ch;
      if (ch === "~" && !double) {
        pushText(out, ch);
        i++;
        continue;
      }
      const mark = double ? ch + ch : ch;
      const after = s[i + mark.length];
      const before = i > 0 ? s[i - 1] : " ";
      // An opener needs text right after it, and `_` must not sit inside a word (snake_case).
      const canOpen = after !== undefined && !/\s/.test(after) && !(ch === "_" && /\w/.test(before));
      if (canOpen) {
        let end = -1;
        for (let j = i + mark.length; j < s.length; j++) {
          if (s[j] === "\\") {
            j++;
            continue;
          }
          if (s[j] === "`") {
            const run = /^`+/.exec(s.slice(j))![0];
            const e = s.indexOf(run, j + run.length);
            if (e >= 0) j = e + run.length - 1;
            continue;
          }
          if (s.startsWith(mark, j) && !/\s/.test(s[j - 1] ?? " ")) {
            const next = s[j + mark.length];
            if (ch === "_" && next !== undefined && /\w/.test(next)) continue;
            // `*` must not end on the first star of a `**`.
            if (mark.length === 1 && next === ch) continue;
            end = j;
            break;
          }
        }
        if (end > i + mark.length) {
          const inner = parseInline(s.slice(i + mark.length, end));
          if (mark === "~~") out.push({ t: "del", c: inner });
          else if (mark.length === 2) out.push({ t: "strong", c: inner });
          else out.push({ t: "em", c: inner });
          i = end + mark.length;
          continue;
        }
      }
      pushText(out, mark);
      i += mark.length;
      continue;
    }

    pushText(out, ch);
    i++;
  }
  return out;
}

/* ── Blocks ─────────────────────────────────────────────────── */

/** Drop `<!-- ... -->` outside code fences, across lines. */
function stripComments(lines: string[]): string[] {
  const out: string[] = [];
  let fence: string | null = null;
  let comment = false;
  for (const raw of lines) {
    if (!comment) {
      const f = /^\s*(`{3,}|~{3,})/.exec(raw);
      if (fence === null && f) fence = f[1][0];
      else if (fence !== null && f && f[1][0] === fence && /^\s*(`{3,}|~{3,})\s*$/.test(raw)) fence = null;
      if (fence !== null || f) {
        out.push(raw);
        continue;
      }
    }
    // Walk the line: a comment opens at `<!--` and closes at `-->`, but never inside a code span.
    let line = "";
    let i = 0;
    while (i < raw.length) {
      if (comment) {
        const close = raw.indexOf("-->", i);
        if (close < 0) {
          i = raw.length;
        } else {
          i = close + 3;
          comment = false;
        }
        continue;
      }
      if (raw[i] === "`") {
        const run = /^`+/.exec(raw.slice(i))![0];
        const closeAt = raw.indexOf(run, i + run.length);
        const to = closeAt >= 0 ? closeAt + run.length : i + run.length;
        line += raw.slice(i, to);
        i = to;
        continue;
      }
      if (raw.startsWith("<!--", i)) {
        comment = true;
        i += 4;
        continue;
      }
      line += raw[i];
      i++;
    }
    // A line that held only a comment becomes a blank line, which ends the paragraph before it.
    out.push(raw.trim() !== "" && line.trim() === "" ? "" : line);
  }
  return out;
}

const FENCE = /^\s{0,3}(`{3,}|~{3,})\s*([^`\s]*)[^`]*$/;
const HEADING = /^\s{0,3}(#{1,6})(?:[ \t]+(.*?))?[ \t]*#*[ \t]*$/;
const RULE = /^\s{0,3}([-*_])(?:[ \t]*\1){2,}[ \t]*$/;
const ITEM = /^(\s*)([-*+]|\d{1,9}[.)])(?:[ \t]+(.*))?$/;
const QUOTE = /^\s{0,3}>[ ]?/;

function splitRow(line: string): string[] {
  let t = line.trim();
  if (t.startsWith("|")) t = t.slice(1);
  if (t.endsWith("|") && !t.endsWith("\\|")) t = t.slice(0, -1);
  const cells: string[] = [];
  let cur = "";
  let inCode = false;
  for (let i = 0; i < t.length; i++) {
    const ch = t[i];
    if (ch === "\\" && t[i + 1] === "|") {
      cur += "|";
      i++;
    } else if (ch === "`") {
      inCode = !inCode;
      cur += ch;
    } else if (ch === "|" && !inCode) {
      cells.push(cur.trim());
      cur = "";
    } else cur += ch;
  }
  cells.push(cur.trim());
  return cells;
}

function isDivider(line: string): boolean {
  return /^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?\s*$/.test(line) && line.includes("-");
}

function alignOf(cell: string): Align {
  const l = cell.startsWith(":");
  const r = cell.endsWith(":");
  return l && r ? "center" : r ? "right" : l ? "left" : null;
}

function startsBlock(line: string, next: string | undefined): boolean {
  return (
    HEADING.test(line) ||
    FENCE.test(line) ||
    RULE.test(line) ||
    QUOTE.test(line) ||
    ITEM.test(line) ||
    (line.includes("|") && next !== undefined && isDivider(next) && splitRow(line).length === splitRow(next).length)
  );
}

function parseList(lines: string[], from: number): { block: List; next: number } {
  type Row = { at: number; indent: number; ordered: boolean; num: number; text: string; extra: string[] };
  const rows: Row[] = [];
  let i = from;
  while (i < lines.length) {
    const line = lines[i];
    const m = ITEM.exec(line);
    if (m && !RULE.test(line)) {
      rows.push({
        at: i,
        indent: m[1].replace(/\t/g, "    ").length,
        ordered: /\d/.test(m[2]),
        num: parseInt(m[2], 10) || 0,
        text: m[3] ?? "",
        extra: [],
      });
      i++;
    } else if (line.trim() === "") {
      // A blank line stays in the list only when an item or indented text follows it.
      const nxt = lines[i + 1];
      if (nxt !== undefined && (ITEM.test(nxt) || /^\s+\S/.test(nxt)) && !RULE.test(nxt)) i++;
      else break;
    } else if (/^\s+\S/.test(line) && rows.length > 0 && !FENCE.test(line)) {
      rows[rows.length - 1].extra.push(line.trim());
      i++;
    } else break;
  }

  const build = (start: number, indent: number): { list: List; end: number } => {
    const first = rows[start];
    const list: List = { t: "list", ordered: first.ordered, start: first.ordered ? first.num : 1, items: [] };
    let k = start;
    while (k < rows.length) {
      const row = rows[k];
      if (row.indent < indent) break;
      if (row.indent > indent) {
        // Deeper than the current list: hangs under the previous item.
        const parent = list.items[list.items.length - 1];
        if (!parent) break;
        const nested = build(k, row.indent);
        parent.children.push(nested.list);
        k = nested.end;
        continue;
      }
      if (row.ordered !== list.ordered && list.items.length > 0) break;
      const task = /^\[([ xX])\][ \t]+(.*)$|^\[([ xX])\]$/.exec(row.text);
      const text = [task ? (task[2] ?? "") : row.text, ...row.extra].join(" ").trim();
      list.items.push({
        checked: task ? (task[1] ?? task[3]) !== " " : null,
        c: parseInline(text),
        children: [],
      });
      k++;
    }
    return { list, end: k };
  };

  const { list, end } = build(0, rows[0].indent);
  // A list of the other kind at the same level ends this one; the caller parses it next.
  return { block: list, next: end < rows.length ? rows[end].at : i };
}

function parseBlocks(lines: string[]): Block[] {
  const blocks: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === "") {
      i++;
      continue;
    }

    const fence = FENCE.exec(line);
    if (fence) {
      const mark = fence[1];
      const body: string[] = [];
      i++;
      while (i < lines.length) {
        const close = /^\s{0,3}(`{3,}|~{3,})\s*$/.exec(lines[i]);
        if (close && close[1][0] === mark[0] && close[1].length >= mark.length) break;
        body.push(lines[i]);
        i++;
      }
      i++; // the closing fence; an unclosed fence runs to the end, as it does elsewhere
      blocks.push({ t: "code", lang: fence[2], v: body.join("\n") });
      continue;
    }

    const heading = HEADING.exec(line);
    if (heading) {
      const c = parseInline(heading[2] ?? "");
      // An empty heading ("###" with no text) has nothing to show.
      if (c.length > 0) blocks.push({ t: "heading", level: heading[1].length as 1, c });
      i++;
      continue;
    }

    if (RULE.test(line)) {
      blocks.push({ t: "rule" });
      i++;
      continue;
    }

    if (QUOTE.test(line)) {
      const inner: string[] = [];
      while (i < lines.length && QUOTE.test(lines[i])) {
        inner.push(lines[i].replace(QUOTE, ""));
        i++;
      }
      blocks.push({ t: "quote", blocks: parseBlocks(inner) });
      continue;
    }

    if (ITEM.test(line)) {
      const { block, next } = parseList(lines, i);
      blocks.push(block);
      i = next;
      continue;
    }

    if (line.includes("|") && i + 1 < lines.length && isDivider(lines[i + 1])) {
      const head = splitRow(line);
      const divider = splitRow(lines[i + 1]);
      if (head.length === divider.length) {
        const rows: Inline[][][] = [];
        i += 2;
        while (i < lines.length && lines[i].trim() !== "" && lines[i].includes("|") && !startsBlock(lines[i], undefined)) {
          const cells = splitRow(lines[i]);
          while (cells.length < head.length) cells.push("");
          rows.push(cells.slice(0, head.length).map(parseInline));
          i++;
        }
        blocks.push({ t: "table", align: divider.map(alignOf), head: head.map(parseInline), rows });
        continue;
      }
    }

    // Paragraph: runs until a blank line or the start of another block.
    const text: string[] = [line.trim()];
    i++;
    while (i < lines.length && lines[i].trim() !== "" && !startsBlock(lines[i], lines[i + 1])) {
      text.push(lines[i].trim());
      i++;
    }
    blocks.push({ t: "paragraph", c: parseInline(text.join(" ")) });
  }
  return blocks;
}

/** Parse a whole document. Front matter is not part of the preview. */
export function parseMarkdown(text: string): Block[] {
  const body = parseFrontMatter(text).body;
  return parseBlocks(stripComments(body.split(/\r\n|\r|\n/)));
}
