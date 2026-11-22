// Runs every reader against this project's real design/ folder: almost all stubs, no
// features. That is the normal first-run state, and every reader must handle it.
import assert from "node:assert/strict";
import { test } from "node:test";
import { createDataLayer } from "../src/data/index.ts";

const data = createDataLayer();

test("listFeatures: no features yet, and _template is not one", async () => {
  assert.deepEqual(await data.listFeatures(), []);
});

test("listDocuments('files'): AGENT.md first, then product/*.md, nothing deeper", async () => {
  const files = await data.listDocuments("files");
  const paths = files.map((f) => f.path);
  assert.equal(paths[0], "AGENT.md");
  for (const expected of ["product/product.md", "product/persona.md", "product/design.md"]) {
    assert.ok(paths.includes(expected), `${expected} should be listed`);
  }
  assert.ok(!paths.some((p) => p.includes("design-system")));
  assert.ok(files.every((f) => f.kind === "files" && f.name !== ""));
});

test("listDocuments('skills'): a front-matter description, and a stub with none", async () => {
  const skills = await data.listDocuments("skills");
  const byName = Object.fromEntries(skills.map((s) => [s.name, s]));
  assert.ok(byName["spec-from-prd"], "spec-from-prd is listed");
  assert.match(byName["spec-from-prd"].description ?? "", /^Turn a PRD/);
  assert.ok(byName["update-design-md"], "the stub skill is listed");
  assert.equal(byName["update-design-md"].description, "update-design-md");
  assert.equal(byName["spec-from-prd"].path, "skills/spec-from-prd/SKILL.md");
});

test("listDocuments: an unknown kind is a bug, not an empty state", async () => {
  await assert.rejects(() => data.listDocuments("nope" as never), TypeError);
});

test("readDocument: real file gives text and a modified time", async () => {
  const doc = await data.readDocument("product/product.md");
  assert.equal(doc.exists, true);
  assert.equal(typeof doc.modifiedAt, "number");
  assert.match(doc.text, /Mobile 384×760, Desktop 1440×1024/);
});

test("readDocument: a missing file is empty, not an error", async () => {
  const doc = await data.readDocument("product/nothing-here.md");
  assert.deepEqual(doc, {
    path: "product/nothing-here.md",
    exists: false,
    text: "",
    modifiedAt: null,
  });
});

test("readDocument: refuses paths outside design/", async () => {
  await assert.rejects(() => data.readDocument("../package.json"), { name: "PathError" });
  await assert.rejects(() => data.readDocument("/etc/passwd"), { name: "PathError" });
});

test("readFeature('_template'): spec present, JSON files empty, no variants", async () => {
  const f = await data.readFeature("_template");
  assert.equal(f.exists, true);
  assert.equal(f.spec.exists, true);
  assert.match(f.spec.text, /^## Decisions$/m);
  assert.deepEqual(f.strings, { exists: true, data: {}, error: null });
  assert.deepEqual(f.variants, { exists: true, data: {}, error: null });
  assert.deepEqual(f.variantFiles, []);
});

test("readFeature: an unknown feature reads as empty, not an error", async () => {
  const f = await data.readFeature("not-a-feature");
  assert.equal(f.exists, false);
  assert.equal(f.spec.exists, false);
  assert.equal(f.title, null);
  assert.deepEqual(f.strings, { exists: false, data: {}, error: null });
  assert.deepEqual(f.variantFiles, []);
  await assert.rejects(() => data.readFeature("../skills"), { name: "PathError" });
});

test("repoStatus: reports a branch and a clean flag", async () => {
  const s = await data.repoStatus();
  assert.equal(s.available, true);
  assert.equal(typeof s.branch, "string");
  assert.notEqual(s.branch, "");
  assert.equal(typeof s.clean, "boolean");
  assert.equal(s.clean, s.changed.length === 0);
});
