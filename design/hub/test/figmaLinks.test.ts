import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { parseFigmaLinks } from "../src/pages/Figma/figmaLinks.ts";

test("parseFigmaLinks: a title, a label and an address from each list line", () => {
  const text = [
    "# Figma",
    "- Design System: [Figma file](https://www.figma.com/design/abc)",
    "* User Flow: [Figjam file](<https://www.figma.com/board/xyz>)",
    "Not a list line: [x](https://example.com)",
  ].join("\n");
  assert.deepEqual(parseFigmaLinks(text), [
    { title: "Design System", label: "Figma file", href: "https://www.figma.com/design/abc" },
    { title: "User Flow", label: "Figjam file", href: "https://www.figma.com/board/xyz" },
  ]);
});

test("parseFigmaLinks: a placeholder address is kept as a card with no link", () => {
  assert.deepEqual(parseFigmaLinks("- Design System: [Figma file](<link>)"), [
    { title: "Design System", label: "Figma file", href: null },
  ]);
});

test("parseFigmaLinks: code fences, comments and an empty file give nothing", () => {
  assert.deepEqual(parseFigmaLinks("```\n- A: [B](https://x.com)\n```"), []);
  assert.deepEqual(parseFigmaLinks("<!-- - A: [B](https://x.com) -->"), []);
  assert.deepEqual(parseFigmaLinks(""), []);
});

test("parseFigmaLinks: figma.md in the repo lists the three files, none linked yet", () => {
  const design = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
  const links = parseFigmaLinks(fs.readFileSync(path.join(design, "product/design-system/figma.md"), "utf8"));
  assert.deepEqual(links.map((l) => l.title), ["Design System", "Design Handoff", "User Flow"]);
  assert.ok(links.every((l) => l.href === null));
});
