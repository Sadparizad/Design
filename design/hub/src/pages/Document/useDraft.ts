import { useCallback, useEffect, useReducer, useRef } from "react";
import { readDocumentNow, refreshDocuments, saveDocument } from "../../api/documents.ts";
import { refreshRepoStatus } from "../../api/repoStatus.ts";
import type { ReadResult } from "../../data/types.ts";
import { setUnsavedChanges } from "../../router/leaveGuard.ts";
import { draftReducer, initDraft, isDirty, type Disk } from "./draft.ts";

const toDisk = (r: ReadResult): Disk => ({ exists: r.exists, text: r.text, modifiedAt: r.modifiedAt });

/**
 * One open document: the editor text, whether it is unsaved, and saving it. All the rules
 * live in `draftReducer`; this hook does the talking to the server.
 */
export function useDraft(path: string, initial: ReadResult) {
  const [state, dispatch] = useReducer(draftReducer, initial, (r) => initDraft(toDisk(r)));
  const latest = useRef(state);
  const busy = useRef(false);
  const dirty = isDirty(state);

  useEffect(() => {
    latest.current = state;
  });

  // The page leaves only after a warning while there is something to lose.
  useEffect(() => {
    setUnsavedChanges(dirty);
    return () => setUnsavedChanges(false);
  }, [dirty]);

  const loadDisk = useCallback(async () => {
    dispatch({ type: "diskLoading" });
    try {
      dispatch({ type: "diskLoaded", disk: toDisk(await readDocumentNow(path)) });
    } catch {
      dispatch({ type: "diskFailed" });
    }
  }, [path]);

  /**
   * Save the editor text. `loadedAt` is the time the writer compares with the file on disk:
   * the time we opened (or last saved) it, unless the designer has just chosen to replace
   * the version they were shown.
   */
  const save = useCallback(
    async (loadedAt?: number | null) => {
      if (busy.current) return;
      const { base, draft } = latest.current;
      const sent = draft;
      busy.current = true;
      dispatch({ type: "saveStarted" });
      try {
        const result = await saveDocument(path, sent, loadedAt === undefined ? base.modifiedAt : loadedAt);
        if (result.kind === "saved") {
          dispatch({ type: "saved", sent, modifiedAt: result.modifiedAt });
          refreshRepoStatus(); // the branch and clean / dirty dot in the header
          refreshDocuments(); // a front matter edit changes a description
        } else if (result.kind === "conflict") {
          dispatch({ type: "conflict", reason: result.reason, message: result.message });
          void loadDisk();
        } else {
          dispatch({ type: "failed", message: result.message });
        }
      } finally {
        busy.current = false;
      }
    },
    [path, loadDisk],
  );

  /** Conflict choice: write my version over the one on disk, checked against the version I was shown. */
  const keepMine = useCallback(() => {
    const s = latest.current.save;
    if (s.phase !== "conflict" || s.disk.status !== "ready") return;
    void save(s.disk.exists ? s.disk.modifiedAt : null);
  }, [save]);

  // A file changed by a pull or a checkout while the Hub is open: pick it up when nothing is being edited.
  useEffect(() => {
    const check = async () => {
      if (document.visibilityState !== "visible" || busy.current || isDirty(latest.current)) return;
      try {
        dispatch({ type: "external", disk: toDisk(await readDocumentNow(path)) });
      } catch {
        // The server may be restarting. The next focus tries again.
      }
    };
    window.addEventListener("focus", check);
    document.addEventListener("visibilitychange", check);
    return () => {
      window.removeEventListener("focus", check);
      document.removeEventListener("visibilitychange", check);
    };
  }, [path]);

  return {
    text: state.draft,
    save: state.save,
    dirty,
    edit: (text: string) => dispatch({ type: "edit", text }),
    submit: () => void save(),
    keepMine,
    adoptDisk: () => dispatch({ type: "useDisk" }),
    keepEditing: () => dispatch({ type: "dismiss" }),
    retryDisk: loadDisk,
  };
}
