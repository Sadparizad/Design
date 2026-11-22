// Writes the read-only copy of design/ that GitHub Pages serves: every /api/* answer the
// Hub reads, saved as a JSON file under dist/api. Run after `vite build`.
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createDataLayer } from "../src/data/index.ts";

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
console.log(`Snapshot: ${features.length} features, ${documents} documents -> dist/api`);
