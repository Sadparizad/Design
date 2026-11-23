import type { ReactNode } from "react";
import type { PageMeta } from "../../router/routes.ts";
import { Header } from "./Header.tsx";
import styles from "./Shell.module.css";
import { TitleBand } from "./TitleBand.tsx";

interface AppShellProps {
  page: PageMeta;
  /** The 32x32 slot at the far right of the header. */
  headerEnd?: ReactNode;
  /** Actions at the far end of the title row. */
  titleEnd?: ReactNode;
  /** Controls that cross the bottom edge of the title band. */
  controls?: ReactNode;
  /** The detail page: facts above the title, and the tab bar below it, inside the band. */
  meta?: ReactNode;
  tabs?: ReactNode;
  /** The page behind the body: grey by default, white on the Prototype tab. */
  tone?: "secondary" | "default";
  /** Content that runs the width of the window, below the 800px column. */
  wide?: ReactNode;
  /** Pull `wide` up over the bottom edge of the title band. */
  wideOverlap?: boolean;
  /** The detail page: the body is the panel of the selected tab. */
  panel?: { id: string; labelledBy: string };
  children?: ReactNode;
}

/** The frame every page is built from: header, title band, then the body. */
export function AppShell({
  page,
  headerEnd,
  titleEnd,
  controls,
  meta,
  tabs,
  tone = "secondary",
  wide,
  wideOverlap = false,
  panel,
  children,
}: AppShellProps) {
  return (
    <div className={`${styles.shell} ${tone === "default" ? styles.shellDefault : ""}`}>
      <Header crumbs={page.crumbs} back={page.back} end={headerEnd} />
      <TitleBand
        title={page.title}
        description={page.description}
        hero={page.hero}
        end={titleEnd}
        controls={controls}
        meta={meta}
        tabs={tabs}
      />
      <main className={styles.body}>
        <div
          {...(panel ? { role: "tabpanel", id: panel.id, "aria-labelledby": panel.labelledBy } : {})}
        >
          <div className={styles.column}>{children}</div>
          {wide && (
            <div className={`${styles.wide} ${wideOverlap ? styles.wideOverlap : ""}`}>{wide}</div>
          )}
        </div>
      </main>
    </div>
  );
}
