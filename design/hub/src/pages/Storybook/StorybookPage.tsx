import { useState } from "react";
import { useDocument } from "../../api/documents.ts";
import { Button } from "../../components/Button/Button.tsx";
import { PreviewStage } from "../../components/DeviceFrame/PreviewStage.tsx";
import { Icon } from "../../components/Icon.tsx";
import { RepoIndicator } from "../../components/RepoIndicator/RepoIndicator.tsx";
import { AppShell } from "../../components/Shell/AppShell.tsx";
import { parseFrontMatter } from "../../data/frontmatter.ts";
import { firstLink } from "../../data/markdown.ts";
import { formatDate } from "../../lib/formatDate.ts";
import type { PageMeta } from "../../router/routes.ts";
import { STORYBOOK_PATH } from "../Home/home.config.ts";
import styles from "./StorybookPage.module.css";

/**
 * Storybook inside the Hub: the live catalogue shown in a desktop frame. Its address and the
 * date it was last updated are kept in one file, so the page needs no setting of its own.
 */
export function StorybookPage({ page }: { page: PageMeta }) {
  const doc = useDocument(STORYBOOK_PATH);
  // Bumped by "Get update": a new key makes the browser load the catalogue again.
  const [loads, setLoads] = useState(0);

  const text = doc.phase === "ready" && doc.data.exists ? doc.data.text : "";
  const link = firstLink(text);
  const updated = parseFrontMatter(text).data.updated;

  const screen = link ? (
    <iframe key={loads} className={styles.embed} src={link} title="Storybook" />
  ) : (
    <p className={styles.empty}>
      {doc.phase === "loading" ? "" : `Link not set yet. Add it to ${STORYBOOK_PATH.split("/").slice(-2).join("/")}.`}
    </p>
  );

  return (
    <AppShell
      page={page}
      headerEnd={<RepoIndicator />}
      tone="default"
      titleEnd={
        <>
          <div className={styles.actions}>
            <Button variant="secondary" size="compact" disabled={!link} onClick={() => setLoads((n) => n + 1)}>
              Get update
            </Button>
            {link ? (
              <Button
                variant="secondary"
                size="compact"
                iconOnly
                href={link}
                external
                aria-label="Open Storybook in a new tab"
              >
                <Icon name="arrowUpRight" />
              </Button>
            ) : (
              <Button variant="secondary" size="compact" iconOnly disabled aria-label="Open Storybook in a new tab">
                <Icon name="arrowUpRight" />
              </Button>
            )}
          </div>
          {updated && <p className={styles.updated}>Last update: {formatDate(updated)}</p>}
        </>
      }
      wide={<PreviewStage sizes="desktop" screen={screen} />}
      wideOverlap
    />
  );
}
