import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { firstLink } from "../src/data/markdown.ts";

test("firstLink: a markdown link, a bare URL and an angle-bracket URL", () => {
  assert.equal(firstLink("[Storybook](https://sb.example.com/x?y=1)"), "https://sb.example.com/x?y=1");
  assert.equal(firstLink("Live at https://sb.example.com/path."), "https://sb.example.com/path");
  assert.equal(firstLink("<https://sb.example.com>"), "https://sb.example.com");
  assert.equal(firstLink("# Title\n\nSee [docs](https://a.example.com) and https://b.example.com"), "https://a.example.com");
});

test("firstLink: code fences, comments, relative links and placeholders are not links", () => {
  assert.equal(firstLink("```\nhttps://in-a-fence.example.com\n```\n"), null);
  assert.equal(firstLink("<!-- https://commented.example.com -->\n# Title"), null);
  assert.equal(firstLink("[local](./other.md) and [mail](mailto:a@b.c)"), null);
  assert.equal(firstLink("Link: <link>"), null);
  assert.equal(firstLink("---\nurl: https://front-matter.example.com\n---\n# Title"), null);
  assert.equal(firstLink(""), null);
});

test("firstLink: both source stubs in the repo have no link yet", () => {
  const design = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
  for (const rel of ["product/design-system/storybook/README.md", "product/design-system/figma.md"]) {
    assert.equal(firstLink(fs.readFileSync(path.join(design, rel), "utf8")), null, rel);
  }
});
