/**
 * Reads the text of a spec.md into the sections the Spec tab shows.
 *
 * Pure text in, plain objects out: no file system, so pages can import it. The contract is
 * features/_template/spec.md. Nothing here lists the headings: every `##` heading in the
 * file becomes a section, in file order, so a heading a designer adds shows up on its own.
 */
import { cleanValue, visibleBody } from "./markdown.ts";

export type SpecBlock =
  | { type: "paragraph"; text: string }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "table"; header: string[]; rows: string[][] }
  | { type: "code"; text: string };

export interface SpecSection {
  /** The heading text, exactly as written. */
  title: string;
  blocks: SpecBlock[];
  /** True when the section holds nothing a reader could use: no text, or only empty bullets. */
  empty: boolean;
}

/** The newest row of the Decisions table. */
export interface Pick {
  decision: string;
  date: string | null;
  decidedBy: string | null;
  story: string | null;
}

export interface ParsedSpec {
  sections: SpecSection[];
  /** The first paragraph under Summary, or null. */
  summary: string | null;
  /** The newest filled-in row of the Decisions table, or null when there is none. */
  pick: Pick | null;
}

const FENCE = /^\s*(```|~~~)/;
const BULLET = /^\s*[-*+][ \t]*(.*)$/;
const NUMBERED = /^\s*\d+[.)][ \t]+(.*)$/;
const TABLE_ROW = /^\s*\|.*\|\s*$/;
const TABLE_RULE = /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/;

/** Split one table line into cells. `\|` stays inside its cell. */
function splitRow(line: string): string[] {
  const inner = line.trim().replace(/^\|/, "").replace(/\|$/, "");
  return inner
    .split(/(?<!\\)\|/)
    .map((c) => c.replace(/\\\|/g, "|").trim());
}

function parseBlocks(lines: string[]): SpecBlock[] {
  const blocks: SpecBlock[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === "") {
      i++;
      continue;
    }

    if (FENCE.test(line)) {
      const code: string[] = [];
      i++;
      while (i < lines.length && !FENCE.test(lines[i])) code.push(lines[i++]);
      i++; // the closing fence, or the end of the section
      blocks.push({ type: "code", text: code.join("\n") });
      continue;
    }

    if (TABLE_ROW.test(line)) {
      const table: string[][] = [];
      while (i < lines.length && TABLE_ROW.test(lines[i])) {
        if (!TABLE_RULE.test(lines[i])) table.push(splitRow(lines[i]));
        i++;
      }
      const [header = [], ...rows] = table;
      // A row with too few cells is padded; one with too many keeps its extras off the page.
      blocks.push({
        type: "table",
        header,
        rows: rows.map((r) => header.map((_, c) => r[c] ?? "")),
      });
      continue;
    }

    const bullet = BULLET.exec(line);
    const numbered = bullet ? null : NUMBERED.exec(line);
    if (bullet || numbered) {
      const ordered = Boolean(numbered);
      const items: string[] = [];
      while (i < lines.length) {
        const m = (ordered ? NUMBERED : BULLET).exec(lines[i]);
        if (m) {
          items.push(m[1].trim());
          i++;
        } else if (/^\s+\S/.test(lines[i]) && items.length > 0) {
          // An indented line continues the item above it.
          items[items.length - 1] = `${items[items.length - 1]} ${lines[i].trim()}`.trim();
          i++;
        } else {
          break;
        }
      }
      blocks.push({ type: "list", ordered, items });
      continue;
    }

    const para: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !FENCE.test(lines[i]) &&
      !TABLE_ROW.test(lines[i]) &&
      !BULLET.test(lines[i]) &&
      !NUMBERED.test(lines[i])
    ) {
      para.push(lines[i++].trim());
    }
    blocks.push({ type: "paragraph", text: para.join(" ") });
  }
  return blocks;
}

/** Nothing a reader could use: no blocks, blank paragraphs, or a list of empty bullets. */
function isEmpty(blocks: SpecBlock[]): boolean {
  return blocks.every((b) => {
    if (b.type === "paragraph" || b.type === "code") return b.text.trim() === "";
    if (b.type === "list") return b.items.every((item) => item.trim() === "");
    return b.rows.every((row) => row.every((cell) => cell.trim() === ""));
  });
}

/** Lowercase letters only, so "Decided by" and "decidedBy" meet. */
const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, "");

function column(header: string[], ...names: string[]): number {
  const wanted = new Set(names);
  return header.findIndex((h) => wanted.has(norm(h)));
}

/** `YYYY-MM-DD` as a sortable number, or null for anything else. */
function dateKey(value: string | null): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec((value ?? "").trim());
  return m ? Number(m[1]) * 10000 + Number(m[2]) * 100 + Number(m[3]) : null;
}

/**
 * The newest row of a Decisions table: the latest Date, and the lower row when dates tie or
 * none parse. A row whose Decision is still the template placeholder is skipped.
 */
export function newestDecision(blocks: SpecBlock[]): Pick | null {
  const table = blocks.find((b) => b.type === "table");
  if (!table || table.type !== "table") return null;
  const d = column(table.header, "decision");
  const at = d >= 0 ? d : 0;
  const when = column(table.header, "date");
  const by = column(table.header, "decidedby");
  const story = column(table.header, "relatedstory", "story");

  let best: { pick: Pick; key: number } | null = null;
  for (const row of table.rows) {
    const decision = cleanValue(row[at]);
    if (!decision) continue;
    const date = when >= 0 ? cleanValue(row[when]) : null;
    const key = dateKey(date) ?? -1;
    // `>=` so that on a tie the row lower in the file, the one added later, wins.
    if (best === null || key >= best.key) {
      best = {
        key,
        pick: {
          decision,
          date,
          decidedBy: by >= 0 ? cleanValue(row[by]) : null,
          story: story >= 0 ? cleanValue(row[story]) : null,
        },
      };
    }
  }
  return best?.pick ?? null;
}

export function parseSpec(text: string): ParsedSpec {
  const sections: SpecSection[] = [];
  let title: string | null = null;
  let body: string[] = [];
  let fenced = false;

  const flush = () => {
    if (title === null) return;
    const blocks = parseBlocks(body);
    sections.push({ title, blocks, empty: isEmpty(blocks) });
  };

  for (const line of visibleBody(text).split(/\r?\n/)) {
    if (FENCE.test(line)) fenced = !fenced;
    const h2 = fenced ? null : /^##[ \t]+(.+?)[ \t]*#*[ \t]*$/.exec(line);
    if (h2) {
      flush();
      title = h2[1];
      body = [];
    } else if (title !== null) {
      body.push(line);
    }
    // Text before the first `##`, including the `#` title, belongs to no section.
  }
  flush();

  const summary = sections.find((s) => norm(s.title) === "summary");
  const firstText = summary?.blocks.find((b) => b.type === "paragraph");
  const decisions = sections.find((s) => norm(s.title) === "decisions");

  return {
    sections,
    summary: firstText && firstText.type === "paragraph" ? cleanValue(firstText.text) : null,
    pick: decisions ? newestDecision(decisions.blocks) : null,
  };
}
