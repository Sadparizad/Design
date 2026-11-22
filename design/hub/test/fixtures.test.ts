// The same readers against synthetic folders: one fully populated, one completely empty.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { after, test } from "node:test";
import { createDataLayer } from "../src/data/index.ts";
import { cleanUp, makeDesignRoot } from "./helpers.ts";

const roots: string[] = [];
after(() => Promise.all(roots.map(cleanUp)));
async function root(files?: Record<string, string>) {
  const r = await makeDesignRoot(files);
  roots.push(r);
  return r;
}

test("an empty design/ folder makes every reader return an empty result", async () => {
  const data = createDataLayer(await root());
  assert.deepEqual(await data.listFeatures(), []);
  assert.deepEqual(await data.listDocuments("files"), []);
  assert.deepEqual(await data.listDocuments("skills"), []);
  assert.equal((await data.readDocument("product/product.md")).exists, false);
  const f = await data.readFeature("anything");
  assert.equal(f.exists, false);
  assert.deepEqual(f.variantFiles, []);
  assert.equal((await data.repoStatus()).available, false);
});

test("listFeatures: reads title and README front matter, skips _template and hidden", async () => {
  const data = createDataLayer(
    await root({
      "features/_template/spec.md": "# <Feature name>\n",
      "features/.hidden/spec.md": "# Hidden\n",
      "features/checkout-v2/spec.md": "<!-- note -->\n# Checkout\n\n## Summary\n",
      "features/checkout-v2/README.md":
        "---\nstatus: Prototype\nOwner: Dana\nPreview Link: https://example.test/pr/1\n---\n\n# Checkout\n",
      "features/onboarding/README.md": "---\nstatus: <Status>\nowner: <Name>\n---\n",
      "features/bare/.gitkeep": "",
    }),
  );
  assert.deepEqual(await data.listFeatures(), [
    { name: "bare", title: null, status: null, owner: null, preview: null },
    {
      name: "checkout-v2",
      title: "Checkout",
      status: "Prototype",
      owner: "Dana",
      preview: "https://example.test/pr/1",
    },
    { name: "onboarding", title: null, status: null, owner: null, preview: null },
  ]);
});

test("listDocuments: files and skills, with descriptions and fallbacks", async () => {
  const data = createDataLayer(
    await root({
      "AGENT.md": "Rules for the agent.\n",
      "product/product.md": "# Acme\n\nText.\n",
      "product/notes.txt": "not markdown",
      "product/design-system/figma.md": "# deeper\n",
      "skills/alpha/SKILL.md": "---\nname: alpha\ndescription: >\n  Does the first\n  thing.\n---\n# alpha\n",
      "skills/beta/SKILL.md": "# beta\n",
      "skills/gamma/notes.md": "no SKILL.md here",
    }),
  );
  const files = await data.listDocuments("files");
  assert.deepEqual(
    files.map((f) => [f.name, f.path, f.description]),
    [
      ["AGENT", "AGENT.md", "Rules for the agent."],
      ["product", "product/product.md", "Acme"],
    ],
  );
  const skills = await data.listDocuments("skills");
  assert.deepEqual(
    skills.map((s) => [s.name, s.description]),
    [
      ["alpha", "Does the first thing."],
      ["beta", "beta"],
      ["gamma", null],
    ],
  );
  // The declared description is the front matter value alone: no heading or first-line fallback.
  assert.deepEqual(
    skills.map((s) => [s.name, s.declaredDescription]),
    [
      ["alpha", "Does the first thing."],
      ["beta", null],
      ["gamma", null],
    ],
  );
});

test("readFeature: strings, variants.json, variants/ contents, and a broken JSON file", async () => {
  const data = createDataLayer(
    await root({
      "features/f/spec.md": "# F\n",
      "features/f/strings.json": '{"a.b": "Hello"}',
      "features/f/variants.json": "{ not json",
      "features/f/variants/a/index.html": "<p>a</p>",
      "features/f/variants/b.html": "<p>b</p>",
      "features/f/variants/.gitkeep": "",
    }),
  );
  const f = await data.readFeature("f");
  assert.equal(f.title, "F");
  assert.deepEqual(f.strings.data, { "a.b": "Hello" });
  assert.equal(f.variants.exists, true);
  assert.deepEqual(f.variants.data, {});
  assert.ok(f.variants.error, "a parse message is reported");
  assert.deepEqual(f.variantFiles, [
    { path: "a", type: "dir", size: 0 },
    { path: "a/index.html", type: "file", size: 8 },
    { path: "b.html", type: "file", size: 8 },
  ]);
});

test("repoStatus: branch, and clean is scoped to design/", async () => {
  const repo = await root();
  const git = (...args: string[]) =>
    execFileSync("git", ["-c", "user.name=t", "-c", "user.email=t@example.test", "-C", repo, ...args], {
      stdio: "pipe",
    });
  git("init", "-q", "-b", "trunk");
  const design = path.join(repo, "design");
  await fs.mkdir(design);
  await fs.writeFile(path.join(design, "a.md"), "# a\n");
  await fs.writeFile(path.join(repo, "outside.txt"), "x");
  git("add", "-A");
  git("commit", "-q", "-m", "init");

  const data = createDataLayer(design);
  assert.deepEqual(await data.repoStatus(), {
    available: true,
    branch: "trunk",
    clean: true,
    changed: [],
  });

  await fs.writeFile(path.join(repo, "outside.txt"), "changed");
  assert.equal((await data.repoStatus()).clean, true, "edits outside design/ do not count");

  await fs.writeFile(path.join(design, "a.md"), "# changed\n");
  const dirty = await data.repoStatus();
  assert.equal(dirty.clean, false);
  assert.equal(dirty.changed.length, 1);
  assert.match(dirty.changed[0], /a\.md$/);
});
