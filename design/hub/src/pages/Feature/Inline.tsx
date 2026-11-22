import { tokenizeInline } from "../../lib/inline.ts";
import styles from "./Spec.module.css";

/** Text with `code`, **bold** and https links drawn. Everything else is plain text. */
export function Inline({ text }: { text: string }) {
  return (
    <>
      {tokenizeInline(text).map((t, i) => {
        if (t.type === "code") return <code key={i} className={styles.code}>{t.text}</code>;
        if (t.type === "bold") return <strong key={i} className={styles.bold}>{t.text}</strong>;
        if (t.type === "link") {
          return (
            <a key={i} className={styles.link} href={t.href} target="_blank" rel="noreferrer">
              {t.text}
              <span className="visually-hidden"> (opens in a new tab)</span>
            </a>
          );
        }
        return t.text;
      })}
    </>
  );
}
