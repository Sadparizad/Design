import type { ReactNode } from "react";
import styles from "./DocumentLayout.module.css";

interface DocumentLayoutProps {
  /** The list of documents on the inline-start side. */
  sidebar: ReactNode;
  /** The open document. */
  children?: ReactNode;
  sidebarLabel?: string;
}

/** The page layout Files and Skills share. */
export function DocumentLayout({ sidebar, children, sidebarLabel = "Documents" }: DocumentLayoutProps) {
  return (
    <div className={styles.layout}>
      <nav className={styles.sidebar} aria-label={sidebarLabel}>
        {sidebar}
      </nav>
      <div className={styles.document}>{children}</div>
    </div>
  );
}
