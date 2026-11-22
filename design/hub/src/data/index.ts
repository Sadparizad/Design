/**
 * The data module: the only code in the hub that touches the file system.
 * Every path is relative to the design/ folder the hub sits in.
 * Missing files and empty folders are normal and read as empty results.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { cleanValue, declaredDescription, describe, firstHeading } from "./markdown.ts";
import { parseFrontMatter } from "./frontmatter.ts";
import { readRepoStatus } from "./repoStatus.ts";
import { assertName, defaultDesignRoot, resolveInside, toPosix } from "./root.ts";
import type {
  DataLayer,
  DocumentEntry,
  DocumentKind,
  Feature,
  FeatureSummary,
  JsonRead,
  ReadResult,
  VariantFile,
  WriteResult,
} from "./types.ts";

export { PathError } from "./root.ts";
export type * from "./types.ts";

/** Some file systems store modified times coarsely; ignore differences this small. */
const MTIME_TOLERANCE_MS = 1;
const MAX_VARIANT_ENTRIES = 2000;

function isMissing(err: unknown): boolean {
  const code = (err as NodeJS.ErrnoException)?.code;
  return code === "ENOENT" || code === "ENOTDIR";
}

async function statOrNull(abs: string) {
  try {
    return await fs.stat(abs);
  } catch (err) {
    if (isMissing(err)) return null;
    throw err;
  }
}

async function readTextOrNull(abs: string): Promise<string | null> {
  try {
    return await fs.readFile(abs, "utf8");
  } catch (err) {
    if (isMissing(err) || (err as NodeJS.ErrnoException)?.code === "EISDIR") return null;
    throw err;
  }
}

function byCodepoint(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** Names of sub-folders (following links), sorted. Missing folder reads as empty. */
async function listDirNames(abs: string): Promise<string[]> {
  let entries;
  try {
    entries = await fs.readdir(abs, { withFileTypes: true });
  } catch (err) {
    if (isMissing(err)) return [];
    throw err;
  }
  const names: string[] = [];
  for (const e of entries) {
    if (e.isDirectory()) names.push(e.name);
    else if (e.isSymbolicLink() && (await statOrNull(path.join(abs, e.name)))?.isDirectory()) {
      names.push(e.name);
    }
  }
  return names.sort(byCodepoint);
}

/** Names of regular files ending in `ext`, sorted. Missing folder reads as empty. */
async function listFileNames(abs: string, ext: string): Promise<string[]> {
  let entries;
  try {
    entries = await fs.readdir(abs, { withFileTypes: true });
  } catch (err) {
    if (isMissing(err)) return [];
    throw err;
  }
  const names: string[] = [];
  for (const e of entries) {
    if (!e.name.toLowerCase().endsWith(ext)) continue;
    if (e.isFile() || (e.isSymbolicLink() && (await statOrNull(path.join(abs, e.name)))?.isFile())) {
      names.push(e.name);
    }
  }
  return names.sort(byCodepoint);
}

function parseJsonText(text: string | null): JsonRead {
  if (text === null) return { exists: false, data: {}, error: null };
  if (text.trim() === "") return { exists: true, data: {}, error: null };
  try {
    return { exists: true, data: JSON.parse(text), error: null };
  } catch (err) {
    return { exists: true, data: {}, error: (err as Error).message };
  }
}

/** Case- and spacing-insensitive lookup: "Preview link", "previewLink" and "preview" all work. */
function pick(data: Record<string, string>, ...keys: string[]): string | null {
  const wanted = new Set(keys);
  for (const [k, v] of Object.entries(data)) {
    if (wanted.has(k.toLowerCase().replace(/[^a-z]/g, ""))) {
      const value = cleanValue(v);
      if (value) return value;
    }
  }
  return null;
}

async function walkVariants(abs: string, prefix: string, out: VariantFile[]): Promise<void> {
  let entries;
  try {
    entries = await fs.readdir(abs, { withFileTypes: true });
  } catch (err) {
    if (isMissing(err)) return;
    throw err;
  }
  entries.sort((a, b) => byCodepoint(a.name, b.name));
  for (const e of entries) {
    if (out.length >= MAX_VARIANT_ENTRIES) return;
    if (e.name.startsWith(".") || e.name === "node_modules") continue;
    const rel = prefix ? `${prefix}/${e.name}` : e.name;
    const full = path.join(abs, e.name);
    if (e.isDirectory()) {
      out.push({ path: rel, type: "dir", size: 0 });
      await walkVariants(full, rel, out);
    } else if (e.isFile()) {
      out.push({ path: rel, type: "file", size: (await fs.stat(full)).size });
    }
  }
}

/** Create the data layer for one design/ folder. Defaults to the folder this hub sits in. */
export function createDataLayer(designRoot: string = defaultDesignRoot()): DataLayer {
  const root = path.resolve(designRoot);
  const at = (rel: string) => resolveInside(root, rel);

  async function summarize(name: string): Promise<FeatureSummary> {
    const spec = await readTextOrNull(at(`features/${name}/spec.md`));
    const readme = await readTextOrNull(at(`features/${name}/README.md`));
    const meta = readme === null ? {} : parseFrontMatter(readme).data;
    return {
      name,
      title: spec === null ? null : firstHeading(spec),
      status: pick(meta, "status"),
      owner: pick(meta, "owner"),
      preview: pick(meta, "preview", "previewlink"),
    };
  }

  async function listFeatures(): Promise<FeatureSummary[]> {
    const names = (await listDirNames(at("features"))).filter(
      (n) => !n.startsWith("_") && !n.startsWith("."),
    );
    return Promise.all(names.map(summarize));
  }

  async function entryFor(kind: DocumentKind, name: string, rel: string): Promise<DocumentEntry> {
    const text = await readTextOrNull(at(rel));
    return {
      kind,
      name,
      path: rel,
      description: text === null ? null : describe(text),
      declaredDescription: text === null ? null : declaredDescription(text),
    };
  }

  async function listDocuments(kind: DocumentKind): Promise<DocumentEntry[]> {
    if (kind === "files") {
      const out: DocumentEntry[] = [];
      if ((await statOrNull(at("AGENT.md")))?.isFile()) {
        out.push(await entryFor("files", "AGENT", "AGENT.md"));
      }
      for (const file of await listFileNames(at("product"), ".md")) {
        out.push(await entryFor("files", file.replace(/\.md$/i, ""), `product/${file}`));
      }
      return out;
    }
    if (kind === "skills") {
      const names = (await listDirNames(at("skills"))).filter((n) => !n.startsWith("."));
      return Promise.all(names.map((n) => entryFor("skills", n, `skills/${n}/SKILL.md`)));
    }
    throw new TypeError(`Unknown document kind: ${String(kind)}`);
  }

  async function readDocument(rel: string): Promise<ReadResult> {
    const abs = at(rel);
    const outPath = toPosix(path.relative(root, abs));
    const st = await statOrNull(abs);
    if (!st || !st.isFile()) return { path: outPath, exists: false, text: "", modifiedAt: null };
    // Stat before reading: if the file changes in between, the recorded time is older
    // than the content, so a later save is refused instead of silently winning.
    const text = await readTextOrNull(abs);
    if (text === null) return { path: outPath, exists: false, text: "", modifiedAt: null };
    return { path: outPath, exists: true, text, modifiedAt: st.mtimeMs };
  }

  async function writeDocument(
    rel: string,
    content: string,
    loadedAt: number | null,
  ): Promise<WriteResult> {
    if (typeof content !== "string") throw new TypeError("content must be text");
    const abs = at(rel);

    const check = async (): Promise<WriteResult | { ok: true; mode: number | null }> => {
      const st = await statOrNull(abs);
      if (st && !st.isFile()) throw new TypeError("That path is a folder, not a file.");
      if (st === null) {
        if (loadedAt === null) return { ok: true, mode: null };
        return {
          ok: false,
          reason: "missing",
          modifiedAt: null,
          message: "This file was deleted after you opened it. Nothing was saved.",
        };
      }
      if (loadedAt === null || st.mtimeMs > loadedAt + MTIME_TOLERANCE_MS) {
        return {
          ok: false,
          reason: "conflict",
          modifiedAt: st.mtimeMs,
          message:
            "This file changed after you opened it, so nothing was saved. " +
            "Someone else may have edited it. Reload to see the latest version.",
        };
      }
      return { ok: true, mode: st.mode & 0o777 };
    };

    const first = await check();
    if (!first.ok) return first;

    await fs.mkdir(path.dirname(abs), { recursive: true });
    const tmp = path.join(
      path.dirname(abs),
      `.${path.basename(abs)}.${process.pid}.${Date.now()}.tmp`,
    );
    try {
      await fs.writeFile(tmp, content, "utf8");
      if ("mode" in first && first.mode !== null) await fs.chmod(tmp, first.mode);
      // Check again right before the swap to keep the window for a lost edit as small as possible.
      const second = await check();
      if (!second.ok) {
        await fs.rm(tmp, { force: true });
        return second;
      }
      await fs.rename(tmp, abs);
    } catch (err) {
      await fs.rm(tmp, { force: true });
      throw err;
    }
    const written = await fs.stat(abs);
    return { ok: true, modifiedAt: written.mtimeMs };
  }

  async function readFeature(name: string): Promise<Feature> {
    assertName(name);
    const dir = `features/${name}`;
    const exists = Boolean((await statOrNull(at(dir)))?.isDirectory());
    const summary = await summarize(name);
    const spec = await readDocument(`${dir}/spec.md`);
    const strings = parseJsonText(await readTextOrNull(at(`${dir}/strings.json`)));
    const variants = parseJsonText(await readTextOrNull(at(`${dir}/variants.json`)));
    const variantFiles: VariantFile[] = [];
    await walkVariants(at(`${dir}/variants`), "", variantFiles);
    return { ...summary, exists, spec, strings, variants, variantFiles };
  }

  return {
    listFeatures,
    listDocuments,
    readDocument,
    writeDocument,
    readFeature,
    repoStatus: () => readRepoStatus(root),
  };
}
