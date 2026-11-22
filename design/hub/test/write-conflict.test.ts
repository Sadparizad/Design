import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { after, test } from "node:test";
import { createDataLayer } from "../src/data/index.ts";
import { cleanUp, makeDesignRoot } from "./helpers.ts";

const roots: string[] = [];
after(() => Promise.all(roots.map(cleanUp)));
async function setup(files?: Record<string, string>) {
  const root = await makeDesignRoot(files);
  roots.push(root);
  return { root, data: createDataLayer(root) };
}

test("writing a new file creates it, and its folders", async () => {
  const { root, data } = await setup();
  const result = await data.writeDocument("features/new/spec.md", "# New\n", null);
  assert.equal(result.ok, true);
  assert.equal(await fs.readFile(path.join(root, "features/new/spec.md"), "utf8"), "# New\n");
});

test("read, save, save again: the returned time is the next loadedAt", async () => {
  const { data } = await setup({ "product/product.md": "one" });
  const loaded = await data.readDocument("product/product.md");
  const first = await data.writeDocument("product/product.md", "two", loaded.modifiedAt);
  assert.equal(first.ok, true);
  const again = await data.readDocument("product/product.md");
  assert.equal(again.text, "two");
  assert.equal(again.modifiedAt, first.ok ? first.modifiedAt : null);
  const second = await data.writeDocument("product/product.md", "three", again.modifiedAt);
  assert.equal(second.ok, true);
  assert.equal((await data.readDocument("product/product.md")).text, "three");
});

test("a file changed after loading is a conflict, and the disk is untouched", async () => {
  const { root, data } = await setup({ "product/product.md": "original" });
  const abs = path.join(root, "product/product.md");
  const loaded = await data.readDocument("product/product.md");

  // Someone else edits it (for example, a pull from GitHub): a later modified time.
  await fs.writeFile(abs, "edited elsewhere");
  const later = new Date((loaded.modifiedAt ?? 0) + 5000);
  await fs.utimes(abs, later, later);

  const result = await data.writeDocument("product/product.md", "my edit", loaded.modifiedAt);
  assert.equal(result.ok, false);
  assert.equal(!result.ok && result.reason, "conflict");
  assert.ok(!result.ok && Math.abs((result.modifiedAt ?? 0) - later.getTime()) < 1);
  assert.equal(await fs.readFile(abs, "utf8"), "edited elsewhere");
  assert.deepEqual(await fs.readdir(path.dirname(abs)), ["product.md"], "no temp file left behind");
});

test("saving a file you never loaded is refused", async () => {
  const { root, data } = await setup({ "AGENT.md": "keep me" });
  const result = await data.writeDocument("AGENT.md", "overwrite", null);
  assert.equal(!result.ok && result.reason, "conflict");
  assert.equal(await fs.readFile(path.join(root, "AGENT.md"), "utf8"), "keep me");
});

test("saving a file that was deleted after loading is refused", async () => {
  const { root, data } = await setup({ "AGENT.md": "x" });
  const loaded = await data.readDocument("AGENT.md");
  await fs.rm(path.join(root, "AGENT.md"));
  const result = await data.writeDocument("AGENT.md", "y", loaded.modifiedAt);
  assert.equal(!result.ok && result.reason, "missing");
  await assert.rejects(fs.stat(path.join(root, "AGENT.md")));
});

test("paths that leave design/ are refused and nothing is written", async () => {
  const { root, data } = await setup();
  await assert.rejects(() => data.writeDocument("../escape.md", "x", null), { name: "PathError" });
  await assert.rejects(() => data.writeDocument("a/../../escape.md", "x", null), { name: "PathError" });
  await assert.rejects(() => data.writeDocument(path.join(root, "abs.md"), "x", null), {
    name: "PathError",
  });
  assert.deepEqual(await fs.readdir(root), []);
  await assert.rejects(fs.stat(path.join(path.dirname(root), "escape.md")));
});
