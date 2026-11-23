import { useState } from "react";
import { useDocument } from "../../api/documents.ts";
import { STATIC } from "../../lib/staticMode.ts";
import { downloadText } from "../../lib/download.ts";
import { Button } from "../../components/Button/Button.tsx";
import { Icon } from "../../components/Icon.tsx";
import { CodeEditor } from "../../components/CodeEditor/CodeEditor.tsx";
import { Markdown } from "../../components/Markdown/Markdown.tsx";
import { TabControl, type TabItem } from "../../components/TabControl/TabControl.tsx";
import type { DocumentEntry, ReadResult } from "../../data/types.ts";
import { ConflictPanel } from "./ConflictPanel.tsx";
import styles from "./DocumentPage.module.css";
import { useDraft } from "./useDraft.ts";

type Mode = "preview" | "edit";

const MODES: TabItem[] = [
  { id: "preview", label: "Preview", icon: "eye" },
  { id: "edit", label: "Edit", icon: "codeSimple", disabled: STATIC },
];

interface PaneProps {
  entry: DocumentEntry;
  /** What the sidebar and the title call it: "AGENT.md", or a skill's folder name. */
  title: string;
}

function Summary({ title, description }: { title: string; description: string | null }) {
  return (
    <div className={styles.summary}>
      <h2 className={styles.title} dir="auto">
        {title}
      </h2>
      {description && (
        <p className={styles.description} dir="auto">
          {description}
        </p>
      )}
    </div>
  );
}

/** The open document: title, description, Preview / Edit, and the body. The file is read once here. */
export function DocumentPane({ entry, title }: PaneProps) {
  const [attempt, setAttempt] = useState(0);
  return <Reader key={attempt} entry={entry} title={title} onRetry={() => setAttempt((n) => n + 1)} />;
}

function Reader({ entry, title, onRetry }: PaneProps & { onRetry: () => void }) {
  const doc = useDocument(entry.path);

  if (doc.phase === "ready") return <Loaded entry={entry} title={title} initial={doc.data} />;

  return (
    <div className={styles.pane}>
      <Summary title={title} description={entry.description} />
      {doc.phase === "loading" ? (
        <p className={styles.note} role="status">
          Loading…
        </p>
      ) : (
        <p className={styles.note} role="alert">
          Could not read this file. Is the Hub still running?{" "}
          <button type="button" className={styles.linkButton} onClick={onRetry}>
            Try again
          </button>
        </p>
      )}
    </div>
  );
}

function Loaded({ entry, title, initial }: PaneProps & { initial: ReadResult }) {
  const [mode, setMode] = useState<Mode>("preview");
  const draft = useDraft(entry.path, initial);
  const saving = draft.save.phase === "saving";
  // The file keeps its own name on disk: AGENT.md, SKILL.md.
  const fileName = entry.path.slice(entry.path.lastIndexOf("/") + 1);

  return (
    <div className={`${styles.pane} ${mode === "edit" ? styles.paneEdit : ""}`}>
      <div className={styles.header}>
        <div className={styles.top}>
          <Summary title={title} description={entry.description} />
          <div className={styles.actions}>
            {mode === "edit" && (
              <Button disabled={!draft.dirty || saving} onClick={draft.submit}>
                {saving ? "Saving…" : "Save changes"}
              </Button>
            )}
            <Button
              variant="tertiary"
              iconOnly
              aria-label={`Download ${fileName}`}
              onClick={() => downloadText(fileName, draft.text)}
            >
              <Icon name="arrowLineDown" />
            </Button>
          </div>
        </div>
        <TabControl fill items={MODES} value={mode} onChange={(id) => setMode(id as Mode)} label="View" />
        <SaveNotice state={draft.save} />
        {draft.save.phase === "conflict" && (
          <ConflictPanel
            title={title}
            conflict={draft.save}
            mine={draft.text}
            onKeepMine={draft.keepMine}
            onUseDisk={draft.adoptDisk}
            onKeepEditing={draft.keepEditing}
            onRetryDisk={draft.retryDisk}
          />
        )}
      </div>

      {mode === "edit" ? (
        <CodeEditor
          value={draft.text}
          onChange={draft.edit}
          label={`Contents of ${title}`}
          onSave={draft.dirty ? draft.submit : undefined}
        />
      ) : !initial.exists && draft.text === "" ? (
        <p className={styles.note}>This file does not exist yet. Switch to Edit and save to create it.</p>
      ) : draft.text.trim() === "" ? (
        <p className={styles.note}>This file is empty.</p>
      ) : (
        <Markdown text={draft.text} />
      )}
    </div>
  );
}

/** Loading, success and failure of a save, in plain words. These states have no design yet. */
function SaveNotice({ state }: { state: ReturnType<typeof useDraft>["save"] }) {
  if (state.phase === "saving") {
    return (
      <p className={styles.notice} role="status">
        Saving…
      </p>
    );
  }
  if (state.phase === "saved") {
    return (
      <p className={`${styles.notice} ${styles.noticeSaved}`} role="status">
        Saved.
      </p>
    );
  }
  if (state.phase === "failed") {
    return (
      <p className={`${styles.notice} ${styles.noticeFailed}`} role="alert">
        {state.message} Your text is still here.
      </p>
    );
  }
  return null;
}
