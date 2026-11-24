// Writes the read-only copy of design/ that GitHub Pages serves: every /api/* answer the
// Hub reads, saved as a JSON file under dist/api. Run after `vite build`.
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createDataLayer } from "../src/data/index.ts";
import { FIGMA_PATH, STORYBOOK_PATH } from "../src/pages/Home/home.config.ts";

const hubDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const out = path.join(hubDir, "dist", "api");
const data = createDataLayer(path.resolve(hubDir, ".."));

async function write(name: string, body: unknown): Promise<void> {
  const file = path.join(out, `${name}.json`);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(body));
}

const features = await data.listFeatures();
await write("features", features);
for (const f of features) await write(`feature/${f.name}`, await data.readFeature(f.name));

let documents = 0;
for (const kind of ["files", "skills"] as const) {
  const entries = await data.listDocuments(kind);
  await write(`documents-${kind}`, entries);
  for (const e of entries) {
    await write(`document/${e.path}`, await data.readDocument(e.path));
    documents++;
  }
}
// Pages that read one file by its path, outside the Files and Skills lists: the Figma page
// (the cards come from figma.md) and the Storybook page (its link comes from its README).
for (const rel of [FIGMA_PATH, STORYBOOK_PATH]) {
  await write(`document/${rel}`, await data.readDocument(rel));
  documents++;
}
// Each built prototype is copied next to the page, so its own address works on GitHub Pages too.
let prototypes = 0;
for (const f of features) {
  const feature = await data.readFeature(f.name);
  for (const id of feature.prototypes) {
    await fs.cp(
      path.join(hubDir, "..", "features", f.name, "design", "prototype", id),
      path.join(hubDir, "dist", "prototype", f.name, id),
      { recursive: true, filter: (src) => !path.basename(src).startsWith(".") },
    );
    prototypes++;
  }
}
console.log(`Snapshot: ${features.length} features, ${documents} documents, ${prototypes} prototypes -> dist`);
