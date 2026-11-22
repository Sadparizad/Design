import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { newestDecision, parseSpec } from "../src/data/spec.ts";

const design = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const template = fs.readFileSync(path.join(design, "features/_template/spec.md"), "utf8");
const titles = (text: string) => parseSpec(text).sections.map((s) => s.title);

test("the template: its ten headings, in file order", () => {
  assert.deepEqual(titles(template), [
    "Summary",
    "Problem",
    "Evidence",
    "Out of scope",
    "User stories",
    "Acceptance checks",
    "States",
    "Strings used",
    "Open questions",
    "Decisions",
  ]);
});

test("the template: Evidence is empty, and so is every section that is only a placeholder bullet", () => {
  const byTitle = Object.fromEntries(parseSpec(template).sections.map((s) => [s.title, s]));
  assert.equal(byTitle["Evidence"].empty, true);
  assert.equal(byTitle["Out of scope"].empty, true);
  assert.equal(byTitle["Summary"].empty, true);
  assert.equal(byTitle["User stories"].empty, false);
});

test("the template: the column headers are the template's, not the mock's", () => {
  const byTitle = Object.fromEntries(parseSpec(template).sections.map((s) => [s.title, s]));
  const header = (t: string) => {
    const table = byTitle[t].blocks.find((b) => b.type === "table");
    assert.ok(table && table.type === "table", `${t} has a table`);
    return table.header;
  };
  assert.deepEqual(header("Acceptance checks"), ["For", "Check"]);
  assert.deepEqual(header("States"), ["State", "Needed", "Notes"]);
  assert.deepEqual(header("Open questions"), ["Question", "Owner", "Temporary answer", "Status"]);
  assert.deepEqual(header("Decisions"), ["Decision", "Date", "Decided by", "Related story"]);
});

test("the template: no Pick yet, because its only decision row is a placeholder", () => {
  assert.equal(parseSpec(template).pick, null);
  assert.equal(parseSpec(template).summary, null);
});

test("headings the template does not list pass through, in place", () => {
  const spec = "# T\n\n## Summary\nOne.\n\n## Risks\nA risk.\n\n## Decisions\n\n| Decision | Date |\n|---|---|\n| x | 2026-01-02 |\n";
  assert.deepEqual(titles(spec), ["Summary", "Risks", "Decisions"]);
});

test("front matter, comments and the # title are not sections", () => {
  const spec = "---\nx: 1\n---\n# Title\n<!-- ## Hidden -->\nstray line\n## Real\nbody\n";
  assert.deepEqual(titles(spec), ["Real"]);
});

test("a ## inside a code fence is code, not a heading", () => {
  const spec = "## A\n```\n## not a heading\n```\n## B\n";
  assert.deepEqual(titles(spec), ["A", "B"]);
  assert.deepEqual(parseSpec(spec).sections[0].blocks, [{ type: "code", text: "## not a heading" }]);
});

test("blocks: paragraph, bullets, numbered list, table with an escaped pipe", () => {
  const spec = [
    "## S",
    "First line",
    "continues here.",
    "",
    "- one",
    "- two",
    "  wrapped",
    "",
    "1. a",
    "2. b",
    "",
    "| A | B |",
    "|:--|--:|",
    "| x \\| y | z |",
    "| short |",
  ].join("\n");
  const blocks = parseSpec(spec).sections[0].blocks;
  assert.deepEqual(blocks, [
    { type: "paragraph", text: "First line continues here." },
    { type: "list", ordered: false, items: ["one", "two wrapped"] },
    { type: "list", ordered: true, items: ["a", "b"] },
    { type: "table", header: ["A", "B"], rows: [["x | y", "z"], ["short", ""]] },
  ]);
});

test("a filled Evidence section is not empty", () => {
  const spec = "## Evidence\n\n- 12 support tickets in March\n";
  assert.equal(parseSpec(spec).sections[0].empty, false);
});

test("Summary: the first paragraph under it", () => {
  assert.equal(parseSpec("## Summary\n\nA receipt.\n\nSecond.\n").summary, "A receipt.");
});

test("a malformed table does not throw", () => {
  assert.doesNotThrow(() => parseSpec("## S\n| only a header |\n"));
  assert.doesNotThrow(() => parseSpec("## S\n|\n||\n| a | b |\n"));
  assert.doesNotThrow(() => parseSpec(""));
  assert.deepEqual(parseSpec("").sections, []);
});

const decisions = (rows: string) =>
  `## Decisions\n\n| Decision | Date | Decided by | Related story |\n|---|---|---|---|\n${rows}`;

test("Pick: the row with the latest date, wherever it sits in the table", () => {
  const spec = decisions(
    "| Old | 2026-01-10 | Ana | US-01 |\n| Newest | 2026-03-12 | Sam | US-02 |\n| Middle | 2026-02-01 | Ana | US-03 |\n",
  );
  assert.deepEqual(parseSpec(spec).pick, {
    decision: "Newest",
    date: "2026-03-12",
    decidedBy: "Sam",
    story: "US-02",
  });
});

test("Pick: a tie goes to the lower row; no parseable dates means the last row", () => {
  const tie = decisions("| First | 2026-03-12 | A | |\n| Second | 2026-03-12 | B | |\n");
  assert.equal(parseSpec(tie).pick?.decision, "Second");
  const none = decisions("| First | soon | A | |\n| Second | later | B | |\n");
  assert.equal(parseSpec(none).pick?.decision, "Second");
});

test("Pick: placeholder rows are skipped, and a table of only placeholders gives none", () => {
  const spec = decisions("| Real | 2026-03-12 | A | US-01 |\n| <Decision, in one sentence> | YYYY-MM-DD | <Name> | US-01 |\n");
  assert.equal(parseSpec(spec).pick?.decision, "Real");
  assert.equal(parseSpec(decisions("| <Decision> | YYYY-MM-DD | <Name> | US-01 |\n")).pick, null);
});

test("Pick: empty cells read as null, and a missing column is not an error", () => {
  const spec = "## Decisions\n\n| Decision | Date |\n|---|---|\n| Only this | 2026-03-12 |\n";
  assert.deepEqual(parseSpec(spec).pick, {
    decision: "Only this",
    date: "2026-03-12",
    decidedBy: null,
    story: null,
  });
  assert.equal(newestDecision([]), null);
});

test("a spec with no Decisions section has no Pick", () => {
  assert.equal(parseSpec("## Summary\nx\n").pick, null);
});
