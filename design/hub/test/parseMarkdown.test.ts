import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { parseInline, parseMarkdown, safeHref, type Block, type Inline } from "../src/markdown/parse.ts";

const text = (b: Inline[]): string =>
  b
    .map((n) => (n.t === "text" || n.t === "code" ? n.v : text(n.c)))
    .join("");

test("headings, paragraphs and soft line breaks", () => {
  const b = parseMarkdown("# One\n\nline a\nline b\n\n## Two ##\n");
  assert.deepEqual(b.map((x) => x.t), ["heading", "paragraph", "heading"]);
  assert.equal(b[1].t === "paragraph" && text(b[1].c), "line a line b");
  assert.equal(b[2].t === "heading" && b[2].level, 2);
  assert.equal(b[2].t === "heading" && text(b[2].c), "Two");
});

test("an empty heading shows nothing", () => {
  assert.deepEqual(parseMarkdown("### \n"), []);
  assert.deepEqual(parseMarkdown("###\n"), []);
});

test("front matter and HTML comments are not shown, raw HTML-looking text is", () => {
  const b = parseMarkdown("---\nname: x\n---\n# <Product name>\n\n<!--\nhidden\n-->\n\nText <!-- gone --> kept <name>.\n");
  assert.equal(b.length, 2);
  assert.equal(b[0].t === "heading" && text(b[0].c), "<Product name>");
  assert.equal(b[1].t === "paragraph" && text(b[1].c), "Text  kept <name>.");
});

test("a comment written inside an inline code span is code, not a comment", () => {
  const b = parseMarkdown("Remove the comments (`<!-- ... -->`) first, <!-- not this -->ok.\n");
  assert.equal(b[0].t === "paragraph" && text(b[0].c), "Remove the comments (<!-- ... -->) first, ok.");
});

test("a comment inside a code fence is code, not a comment", () => {
  const b = parseMarkdown("```\n<!-- keep -->\n```\n");
  assert.deepEqual(b, [{ t: "code", lang: "", v: "<!-- keep -->" }]);
});

test("bullet lists nest by indent and an ordered list keeps its start", () => {
  const b = parseMarkdown("- a\n  - a1\n  - a2\n- b\n\n3. x\n4. y\n");
  assert.equal(b.length, 2);
  const ul = b[0] as Extract<Block, { t: "list" }>;
  assert.equal(ul.ordered, false);
  assert.equal(ul.items.length, 2);
  assert.equal(ul.items[0].children[0].items.length, 2);
  const ol = b[1] as Extract<Block, { t: "list" }>;
  assert.deepEqual([ol.ordered, ol.start, ol.items.length], [true, 3, 2]);
});

test("a bullet list followed by a numbered one are two lists", () => {
  const b = parseMarkdown("- a\n- b\n1. c\n2. d\n");
  assert.deepEqual(b.map((x) => x.t === "list" && x.ordered), [false, true]);
});

test("empty bullets are kept; task items get a checked state", () => {
  const b = parseMarkdown("- \n- \n\ntext\n\n- [ ] open\n- [x] done\n");
  const first = b[0] as Extract<Block, { t: "list" }>;
  assert.equal(first.items.length, 2);
  assert.deepEqual(first.items.map((i) => i.c.length), [0, 0]);
  const tasks = b[2] as Extract<Block, { t: "list" }>;
  const checks = tasks.items.map((i) => i.checked);
  assert.ok(checks.includes(false) && checks.includes(true));
});

test("a list item continues on indented lines", () => {
  const b = parseMarkdown("- one\n  more\n- two\n");
  const ul = b[0] as Extract<Block, { t: "list" }>;
  assert.equal(text(ul.items[0].c), "one more");
});

test("a table needs matching header and divider cell counts", () => {
  const good = parseMarkdown("| A | B |\n|---|:-:|\n| 1 | 2 |\n| 3 |\n");
  const t = good[0] as Extract<Block, { t: "table" }>;
  assert.equal(t.t, "table");
  assert.deepEqual(t.align, [null, "center"]);
  assert.equal(t.rows.length, 2);
  assert.equal(t.rows[1].length, 2, "a short row is padded");

  const bad = parseMarkdown("| A | B | C\n|---|---|---|---|\n| 1 | 2 | 3\n");
  assert.equal(bad.some((x) => x.t === "table"), false, "mismatched table shows as text");
  assert.equal(bad[0].t, "paragraph");
});

test("an escaped pipe and a pipe in code stay in their cell", () => {
  const b = parseMarkdown("| A | B |\n|---|---|\n| a\\|b | `x|y` |\n");
  const t = b[0] as Extract<Block, { t: "table" }>;
  assert.equal(text(t.rows[0][0]), "a|b");
  assert.equal(text(t.rows[0][1]), "x|y");
});

test("fenced code keeps every line, and an unclosed fence runs to the end", () => {
  assert.deepEqual(parseMarkdown("```ts\na\n\n  b\n```\n"), [{ t: "code", lang: "ts", v: "a\n\n  b" }]);
  assert.deepEqual(parseMarkdown("```\nopen\nforever"), [{ t: "code", lang: "", v: "open\nforever" }]);
});

test("quote, rule", () => {
  const b = parseMarkdown("> quoted\n> more\n\n---\n");
  assert.equal(b[0].t, "quote");
  assert.equal(b[1].t, "rule");
});

test("inline: code, strong, em, del, links", () => {
  const n = parseInline("a `b` **c** *d* ~~e~~ [f](https://x.test) g");
  assert.deepEqual(n.map((x) => x.t), ["text", "code", "text", "strong", "text", "em", "text", "del", "text", "link", "text"]);
});

test("inline: snake_case and a lone star are not emphasis", () => {
  assert.equal(parseInline("snake_case_name").length, 1);
  assert.equal(parseInline("2 * 3 * 4").length, 1);
  assert.equal(text(parseInline("a ** b")), "a ** b");
});

test("inline: markup inside code spans is left alone", () => {
  const n = parseInline("`**x**` and `a_b`");
  assert.deepEqual(n[0], { t: "code", v: "**x**" });
});

test("inline: backslash escapes and unmatched brackets", () => {
  assert.equal(text(parseInline("\\*not\\* [no link]")), "*not* [no link]");
});

test("links: unsafe targets are not clickable", () => {
  assert.equal(safeHref("javascript:alert(1)"), null);
  assert.equal(safeHref("data:text/html,x"), null);
  assert.equal(safeHref("https://a.test"), "https://a.test");
  assert.equal(safeHref("notes.md"), "notes.md");
  const n = parseInline("[click](javascript:alert(1))");
  assert.deepEqual(n, [{ t: "text", v: "click" }]);
});

test("bare URLs become links without the trailing full stop", () => {
  const n = parseInline("see https://a.test/x.");
  assert.deepEqual(n[1], { t: "link", href: "https://a.test/x", c: [{ t: "text", v: "https://a.test/x" }] });
  assert.equal(text(n), "see https://a.test/x.");
});

test("empty and one-line stub files", () => {
  assert.deepEqual(parseMarkdown(""), []);
  assert.deepEqual(parseMarkdown("\n\n"), []);
  const b = parseMarkdown("For design work, read design/AGENTS.md");
  assert.deepEqual(b.map((x) => x.t), ["paragraph"]);
});

test("CRLF text parses like LF", () => {
  assert.deepEqual(parseMarkdown("# A\r\n\r\n- b\r\n- c\r\n"), parseMarkdown("# A\n\n- b\n- c\n"));
});

test("every real file in the folder parses, without throwing, to something that can be shown", () => {
  const root = path.resolve(import.meta.dirname, "..", "..");
  const files = [
    "AGENT.md",
    ...fs.readdirSync(path.join(root, "product")).filter((f) => f.endsWith(".md")).map((f) => `product/${f}`),
    ...fs.readdirSync(path.join(root, "skills")).map((d) => `skills/${d}/SKILL.md`),
  ];
  for (const f of files) {
    const src = fs.readFileSync(path.join(root, f), "utf8");
    const blocks = parseMarkdown(src);
    assert.ok(Array.isArray(blocks), f);
    if (src.trim() !== "") assert.ok(blocks.length > 0, `${f} should render something`);
  }
});

test("spec-from-prd: headings, tables, nested code and checklist all come through", () => {
  const root = path.resolve(import.meta.dirname, "..", "..");
  const b = parseMarkdown(fs.readFileSync(path.join(root, "skills/spec-from-prd/SKILL.md"), "utf8"));
  assert.equal(b[0].t === "heading" && b[0].level, 1);
  assert.equal(b.filter((x) => x.t === "heading" && x.level === 2).length, 6);
  assert.equal(b.filter((x) => x.t === "table").length, 1);
  const checklist = b.find((x) => x.t === "list" && x.items.some((i) => i.checked !== null));
  assert.ok(checklist);
});
