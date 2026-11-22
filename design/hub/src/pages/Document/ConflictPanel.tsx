import { Button } from "../../components/Button/Button.tsx";
import type { SaveState } from "./draft.ts";
import styles from "./DocumentPage.module.css";

type Conflict = Extract<SaveState, { phase: "conflict" }>;

interface ConflictPanelProps {
  title: string;
  conflict: Conflict;
  mine: string;
  onKeepMine: () => void;
  onUseDisk: () => void;
  onKeepEditing: () => void;
  onRetryDisk: () => void;
}

/**
 * The file changed on disk since it was opened, so nothing was saved. Both versions are
 * shown and the designer picks. Plain on purpose: this state has no design yet.
 */
export function ConflictPanel({
  title,
  conflict,
  mine,
  onKeepMine,
  onUseDisk,
  onKeepEditing,
  onRetryDisk,
}: ConflictPanelProps) {
  const { disk, reason } = conflict;
  const deleted = reason === "missing";

  return (
    <section className={styles.conflict} role="alert" aria-labelledby="conflict-title">
      <h3 id="conflict-title" className={styles.conflictTitle}>
        {deleted ? `${title} was deleted after you opened it` : `${title} changed on disk after you opened it`}
      </h3>
      <p className={styles.conflictText}>
        Nothing was saved, and your text is still here. Someone else may have edited this file, or it
        changed when you pulled from Git. Choose which version to keep.
      </p>

      <div className={styles.versions}>
        <div className={styles.version}>
          <h4 className={styles.versionTitle} id="version-mine">
            Your version
          </h4>
          <pre className={styles.versionText} tabIndex={0} aria-labelledby="version-mine">
            {mine === "" ? "(empty)" : mine}
          </pre>
        </div>
        <div className={styles.version}>
          <h4 className={styles.versionTitle} id="version-disk">
            On disk now
          </h4>
          {disk.status === "loading" && (
            <p className={styles.versionNote} role="status">
              Loading the file on disk…
            </p>
          )}
          {disk.status === "failed" && (
            <p className={styles.versionNote}>
              Could not read the file on disk. <button type="button" className={styles.linkButton} onClick={onRetryDisk}>Try again</button>
            </p>
          )}
          {disk.status === "ready" &&
            (disk.exists ? (
              <pre className={styles.versionText} tabIndex={0} aria-labelledby="version-disk">
                {disk.text === "" ? "(empty)" : disk.text}
              </pre>
            ) : (
              <p className={styles.versionNote}>The file no longer exists.</p>
            ))}
        </div>
      </div>

      <div className={styles.conflictActions}>
        <Button disabled={disk.status !== "ready"} onClick={onKeepMine}>
          {deleted ? "Save my version as a new file" : "Replace the file with my version"}
        </Button>
        <Button variant="secondary" disabled={disk.status !== "ready"} onClick={onUseDisk}>
          {deleted ? "Discard my changes" : "Discard my changes, use the file on disk"}
        </Button>
        <Button variant="secondary" onClick={onKeepEditing}>
          Keep editing
        </Button>
      </div>
    </section>
  );
}
