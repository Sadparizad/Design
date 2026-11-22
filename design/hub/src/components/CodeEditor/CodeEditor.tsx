import { useMemo, type ChangeEvent, type CSSProperties, type KeyboardEvent } from "react";
import styles from "./CodeEditor.module.css";

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  /** Names the field for screen readers, for example "Contents of AGENT.md". */
  label: string;
  readOnly?: boolean;
  /** Ctrl/Cmd+S inside the editor. */
  onSave?: () => void;
}

/**
 * A plain code editor: line numbers in a left gutter, monospace text, no colouring.
 *
 * The gutter lines up with soft-wrapped text without measuring anything. A hidden copy of
 * the text is laid out as one row per line, each row holding its number and the line itself
 * (invisible). A wrapped line makes its row taller, so the number stays beside the first
 * line of it. The real <textarea> sits exactly over the text column of that grid, with the
 * same font and width, so its text wraps the same way.
 */
export function CodeEditor({ value, onChange, label, readOnly = false, onSave }: CodeEditorProps) {
  const lines = useMemo(() => value.split("\n"), [value]);
  const style = { "--digits": String(lines.length).length } as CSSProperties;

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (onSave && (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
      e.preventDefault();
      onSave();
    }
  }

  return (
    <div className={styles.panel}>
      <div className={styles.surface}>
        <div className={styles.grid} style={style}>
          {lines.map((line, i) => (
            <div key={i} className={styles.row} aria-hidden="true">
              <span className={styles.number}>{i + 1}</span>
              <span className={styles.mirror}>{line}</span>
            </div>
          ))}
          <textarea
            className={styles.textarea}
            value={value}
            readOnly={readOnly}
            aria-label={label}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            wrap="soft"
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value)}
            onKeyDown={onKeyDown}
          />
        </div>
      </div>
    </div>
  );
}
