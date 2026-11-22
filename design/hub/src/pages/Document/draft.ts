/**
 * The state of one open document: what is on disk (as far as we know), what is in the editor,
 * and where a save has got to. A pure reducer, so every failure path can be tested.
 *
 * The rule it enforces: the text in the editor is never replaced except by the designer's own
 * choice ("Use the file on disk") or because they have changed nothing and the file moved on.
 */

/** A version of the file on disk. */
export interface Disk {
  exists: boolean;
  text: string;
  /** Pass it back to the writer as `loadedAt`. Null when the file does not exist. */
  modifiedAt: number | null;
}

/** The on-disk version shown beside the designer's own during a conflict. */
export type DiskView = { status: "loading" } | { status: "failed" } | ({ status: "ready" } & Disk);

export type SaveState =
  | { phase: "idle" }
  | { phase: "saving" }
  | { phase: "saved" }
  /** The save did not happen. The text is untouched. */
  | { phase: "failed"; message: string }
  /** The file changed on disk (or was deleted) since it was opened. Nothing was written. */
  | { phase: "conflict"; reason: "conflict" | "missing"; message: string; disk: DiskView };

export interface DraftState {
  /** The last version we know is on disk: what was opened, or what we last saved. */
  base: Disk;
  /** What is in the editor. */
  draft: string;
  save: SaveState;
}

export type DraftAction =
  | { type: "edit"; text: string }
  | { type: "saveStarted" }
  | { type: "saved"; sent: string; modifiedAt: number }
  | { type: "failed"; message: string }
  | { type: "conflict"; reason: "conflict" | "missing"; message: string }
  | { type: "diskLoading" }
  | { type: "diskLoaded"; disk: Disk }
  | { type: "diskFailed" }
  /** The designer chose the file on disk over their own edits. */
  | { type: "useDisk" }
  /** The designer chose to keep editing. */
  | { type: "dismiss" }
  /** The file changed on disk while nothing was being edited. */
  | { type: "external"; disk: Disk };

export function initDraft(disk: Disk): DraftState {
  return { base: disk, draft: disk.text, save: { phase: "idle" } };
}

export const isDirty = (s: DraftState): boolean => s.draft !== s.base.text;

export function draftReducer(s: DraftState, a: DraftAction): DraftState {
  switch (a.type) {
    case "edit":
      return {
        ...s,
        draft: a.text,
        // "Saved." stops being true the moment the text moves on. A failure or conflict stays.
        save: s.save.phase === "saved" ? { phase: "idle" } : s.save,
      };

    case "saveStarted":
      return { ...s, save: { phase: "saving" } };

    case "saved": {
      // Typing may have carried on while the save was in flight: only `sent` is on disk.
      const base: Disk = { exists: true, text: a.sent, modifiedAt: a.modifiedAt };
      return { base, draft: s.draft, save: s.draft === a.sent ? { phase: "saved" } : { phase: "idle" } };
    }

    case "failed":
      return { ...s, save: { phase: "failed", message: a.message } };

    case "conflict":
      return {
        ...s,
        save: { phase: "conflict", reason: a.reason, message: a.message, disk: { status: "loading" } },
      };

    case "diskLoading":
      return s.save.phase === "conflict" ? { ...s, save: { ...s.save, disk: { status: "loading" } } } : s;

    case "diskLoaded": {
      if (s.save.phase !== "conflict") return s;
      // The file only changed in time, not in content (a touch, a checkout): nothing is in conflict.
      if (a.disk.exists && a.disk.text === s.draft) {
        return { base: a.disk, draft: s.draft, save: { phase: "saved" } };
      }
      return { ...s, save: { ...s.save, disk: { status: "ready", ...a.disk } } };
    }

    case "diskFailed":
      return s.save.phase === "conflict" ? { ...s, save: { ...s.save, disk: { status: "failed" } } } : s;

    case "useDisk": {
      if (s.save.phase !== "conflict" || s.save.disk.status !== "ready") return s;
      const { status: _status, ...disk } = s.save.disk;
      return { base: disk, draft: disk.text, save: { phase: "idle" } };
    }

    case "dismiss":
      return s.save.phase === "conflict" ? { ...s, save: { phase: "idle" } } : s;

    case "external": {
      // Only when nothing is at stake: no edits, and no save under way or waiting on a choice.
      const quiet = s.save.phase === "idle" || s.save.phase === "saved";
      if (isDirty(s) || !quiet) return s;
      if (a.disk.modifiedAt === s.base.modifiedAt && a.disk.exists === s.base.exists) return s;
      return { base: a.disk, draft: a.disk.text, save: { phase: "idle" } };
    }
  }
}
