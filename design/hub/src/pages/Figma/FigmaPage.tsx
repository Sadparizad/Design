import { useDocument } from "../../api/documents.ts";
import { EmptyState } from "../../components/EmptyState/EmptyState.tsx";
import { RepoIndicator } from "../../components/RepoIndicator/RepoIndicator.tsx";
import { AppShell } from "../../components/Shell/AppShell.tsx";
import { TileCard } from "../../components/TileCard/TileCard.tsx";
import type { PageMeta } from "../../router/routes.ts";
import { FIGMA_PATH } from "../Home/home.config.ts";
import { parseFigmaLinks } from "./figmaLinks.ts";
import styles from "./FigmaPage.module.css";

/** The Figma files, one card each. The cards are the list lines in design-system/figma.md. */
export function FigmaPage({ page }: { page: PageMeta }) {
  const doc = useDocument(FIGMA_PATH);
  const file = FIGMA_PATH.split("/").slice(-2).join("/");
  const links = doc.phase === "ready" && doc.data.exists ? parseFigmaLinks(doc.data.text) : [];

  return (
    <AppShell page={page} headerEnd={<RepoIndicator />} smallDescription bodyOverlap>
      {doc.phase === "loading" && <div aria-busy="true" />}
      {doc.phase === "failed" && (
        <EmptyState
          title="Could not read the Figma links"
          description="Check that the Hub is still running, then reload this page."
        />
      )}
      {doc.phase === "ready" && links.length === 0 && (
        <EmptyState
          title="No Figma links yet"
          description={`Add a line such as "- Design System: [Figma file](link)" to ${file}.`}
        />
      )}
      {links.length > 0 && (
        <div className={styles.grid}>
          {links.map((link, i) => (
            <TileCard
              key={`${link.title}-${i}`}
              title={link.title}
              detail={link.href ? link.label : "Link not set yet."}
              icon="arrowUpRightLarge"
              hug
              href={link.href ?? undefined}
              external={link.href !== null}
            />
          ))}
        </div>
      )}
    </AppShell>
  );
}
