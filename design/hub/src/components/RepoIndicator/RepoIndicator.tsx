import { useEffect, useId, useRef, useState } from "react";
import { STATIC } from "../../lib/staticMode.ts";
import { useRepoStatus, type RepoState } from "../../api/repoStatus.ts";
import { Icon } from "../Icon.tsx";
import type { IconName } from "../icons.ts";
import styles from "./RepoIndicator.module.css";

interface View {
  dot: IconName;
  /** The branch name, when there is one. */
  branch: string | null;
  /** One plain sentence about the state of the folder. */
  summary: string;
}

/** Plain wording for each state. A clean tree is cyan, uncommitted changes are yellow. */
function describe(state: RepoState): View {
  if (state.phase === "loading") {
    return { dot: "dotBlue", branch: null, summary: "Checking the folder…" };
  }
  if (state.phase === "failed") {
    return { dot: "dotBlue", branch: null, summary: "Could not read the folder's Git state." };
  }
  const { status } = state;
  if (!status.available) {
    return { dot: "dotBlue", branch: null, summary: "Git is not available for this folder." };
  }
  const count = status.changed.length;
  return {
    dot: status.clean ? "dotCyan" : "dotYellow",
    branch: status.branch ?? "No branch (detached)",
    summary: status.clean
      ? "Everything is saved in Git."
      : `${count} ${count === 1 ? "file has" : "files have"} changes not yet saved in Git.`,
  };
}

/** The 32x32 button at the far right of the header. Shows the branch and whether work is unsaved. */
export function RepoIndicator() {
  return STATIC ? null : <LocalRepoIndicator />;
}

function LocalRepoIndicator() {
  const { state, refresh } = useRepoStatus();
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const view = describe(state);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className={styles.wrap} ref={wrap}>
      <button
        type="button"
        className={styles.button}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-label={view.branch ? `Branch ${view.branch}. ${view.summary}` : view.summary}
        onClick={() => {
          if (!open) refresh();
          setOpen(!open);
        }}
      >
        <Icon name={view.dot} />
      </button>
      {open && (
        <div id={panelId} className={styles.panel} role="group" aria-label="Git state">
          {view.branch && (
            <>
              <p className={styles.label}>Branch</p>
              <p className={styles.branch}>{view.branch}</p>
            </>
          )}
          <p className={styles.status}>
            <Icon name={view.dot} />
            {view.summary}
          </p>
        </div>
      )}
    </div>
  );
}
