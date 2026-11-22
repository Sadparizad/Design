import path from "node:path";
import { fileURLToPath } from "node:url";

/** Raised when a caller asks for a path outside the design/ folder, or a malformed name. */
export class PathError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PathError";
  }
}

/** The design/ folder this hub sits in: hub/src/data -> hub/src -> hub -> design. */
export function defaultDesignRoot(): string {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
}

/**
 * Turn a path relative to the design/ folder into an absolute one, refusing anything
 * that would land outside it. Every public data function goes through this.
 */
export function resolveInside(root: string, relPath: string): string {
  if (typeof relPath !== "string" || relPath === "" || relPath.includes("\0")) {
    throw new PathError("A file path is required.");
  }
  if (path.isAbsolute(relPath) || /^[A-Za-z]:/.test(relPath)) {
    throw new PathError("Paths must be relative to the design folder.");
  }
  const abs = path.resolve(root, relPath);
  const rel = path.relative(root, abs);
  if (rel === ".." || rel.startsWith(".." + path.sep) || path.isAbsolute(rel)) {
    throw new PathError("That path is outside the design folder.");
  }
  return abs;
}

/** A single folder name: no separators, no "..", not hidden. */
export function assertName(name: string): string {
  if (
    typeof name !== "string" ||
    name === "" ||
    name.startsWith(".") ||
    /[\\/\0]/.test(name)
  ) {
    throw new PathError("That name is not valid.");
  }
  return name;
}

export function toPosix(p: string): string {
  return p.split(path.sep).join("/");
}
