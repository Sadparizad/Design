import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { createDataLayer } from "../src/data/index.ts";
import { parseFrontMatter } from "../src/data/frontmatter.ts";

const design = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const readme = fs.readFileSync(path.join(design, "features/_template/README.md"), "utf8");

test("the template README carries every field the list and detail page read", () => {
  const keys = Object.keys(parseFrontMatter(readme).data);
  for (const key of ["status", "owner", "preview", "started", "shipped"]) {
    assert.ok(keys.includes(key), `README front matter should have ${key}`);
  }
});

test("a feature copied from the template reads as no dates and an open range", async () => {
  const root = fs.mkdtempSync(path.join(fs.realpathSync(process.env.TMPDIR ?? "/tmp"), "hub-tpl-"));
  try {
    fs.mkdirSync(path.join(root, "features/copy"), { recursive: true });
    fs.writeFileSync(path.join(root, "features/copy/README.md"), readme);
    fs.copyFileSync(path.join(design, "features/_template/spec.md"), path.join(root, "features/copy/spec.md"));
    const [feature] = await createDataLayer(root).listFeatures();
    // Placeholders such as <Name> and <YYYY-MM-DD> are not values.
    assert.equal(feature.owner, null);
    assert.equal(feature.preview, null);
    assert.equal(feature.started, null);
    assert.equal(feature.shipped, null);
    assert.equal(feature.title, null);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
