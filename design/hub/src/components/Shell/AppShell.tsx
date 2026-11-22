import type { ReactNode } from "react";
import type { PageMeta } from "../../router/routes.ts";
import { Header } from "./Header.tsx";
import styles from "./Shell.module.css";
import { TitleBand } from "./TitleBand.tsx";

interface AppShellProps {
  page: PageMeta;
  /** The 32x32 slot at the far right of the header. */
  headerEnd?: ReactNode;
  /** Controls that cross the bottom edge of the title band. */
  controls?: ReactNode;
  children?: ReactNode;
}

/** The frame every page is built from: header, title band, then the body. */
export function AppShell({ page, headerEnd, controls, children }: AppShellProps) {
  return (
    <div className={styles.shell}>
      <Header crumbs={page.crumbs} back={page.back} end={headerEnd} />
      <TitleBand
        title={page.title}
        description={page.description}
        hero={page.hero}
        controls={controls}
      />
      <main className={styles.body}>
        <div className={styles.column}>{children}</div>
      </main>
    </div>
  );
}
