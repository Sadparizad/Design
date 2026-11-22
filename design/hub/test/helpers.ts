import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

/** Make a throwaway design/ folder from `{ "relative/path": "text" }`. */
export async function makeDesignRoot(files: Record<string, string> = {}): Promise<string> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "design-hub-test-"));
  for (const [rel, text] of Object.entries(files)) {
    const abs = path.join(root, rel);
    await fs.mkdir(path.dirname(abs), { recursive: true });
    await fs.writeFile(abs, text);
  }
  return root;
}

export function cleanUp(root: string): Promise<void> {
  return fs.rm(root, { recursive: true, force: true });
}
