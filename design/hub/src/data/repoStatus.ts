import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { RepoStatus } from "./types.ts";

const run = promisify(execFile);

/**
 * Only read-only Git subcommands are used here. `--no-optional-locks` stops `status`
 * from refreshing the index, so nothing in .git is ever written.
 */
async function git(cwd: string, args: string[]): Promise<string> {
  const { stdout } = await run("git", ["--no-optional-locks", "-C", cwd, ...args], {
    env: { ...process.env, GIT_OPTIONAL_LOCKS: "0", LC_ALL: "C" },
    timeout: 10_000,
    maxBuffer: 4 * 1024 * 1024,
  });
  return stdout;
}

const UNAVAILABLE: RepoStatus = { available: false, branch: null, clean: null, changed: [] };

/** Current branch and whether anything under `designRoot` has uncommitted changes. */
export async function readRepoStatus(designRoot: string): Promise<RepoStatus> {
  try {
    await git(designRoot, ["rev-parse", "--is-inside-work-tree"]);
  } catch {
    return { ...UNAVAILABLE };
  }
  try {
    let branch: string | null = null;
    try {
      // Works on a branch with no commits yet; fails on a detached HEAD.
      branch = (await git(designRoot, ["symbolic-ref", "--short", "-q", "HEAD"])).trim() || null;
    } catch {
      try {
        branch = (await git(designRoot, ["rev-parse", "--short", "HEAD"])).trim() || null;
      } catch {
        branch = null;
      }
    }
    // `.` limits the check to design/, so edits elsewhere in the host repo don't count.
    const out = await git(designRoot, ["status", "--porcelain", "--", "."]);
    const changed = out.split("\n").filter((l) => l.trim() !== "");
    return { available: true, branch, clean: changed.length === 0, changed };
  } catch {
    return { ...UNAVAILABLE };
  }
}
