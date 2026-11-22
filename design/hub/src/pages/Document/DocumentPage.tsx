import { useEffect } from "react";
import { useDocuments } from "../../api/documents.ts";
import { Card } from "../../components/Card/Card.tsx";
import { DocumentLayout } from "../../components/DocumentLayout/DocumentLayout.tsx";
import { EmptyState } from "../../components/EmptyState/EmptyState.tsx";
import type { DocumentEntry, DocumentKind } from "../../data/types.ts";
import { DocumentPane } from "./DocumentPane.tsx";
import styles from "./DocumentPage.module.css";

const COPY: Record<DocumentKind, { section: string; noun: string; empty: { title: string; description: string } }> = {
  files: {
    section: "Files",
    noun: "file",
    empty: {
      title: "No files yet",
      description: "AGENT.md and the .md files in the product folder show up here.",
    },
  },
  skills: {
    section: "Skills",
    noun: "skill",
    empty: {
      title: "No skills yet",
      description: "Add a folder with a SKILL.md file inside the skills folder and it shows up here.",
    },
  },
};

const hrefFor = (kind: DocumentKind, name: string) => `#/${kind}/${encodeURIComponent(name)}`;

/** Files list "AGENT.md", skills list the folder name. */
function labelFor(kind: DocumentKind, entry: DocumentEntry): string {
  return kind === "files" ? entry.path.slice(entry.path.lastIndexOf("/") + 1) : entry.name;
}

interface DocumentPageProps {
  kind: DocumentKind;
  /** The `:name` in the route. Undefined on the bare list address. */
  name?: string;
}

/**
 * Files and Skills are this one component over two lists. The sidebar is whatever the data
 * layer finds in the folder, so a new skill folder appears with no change here.
 */
export function DocumentPage({ kind, name }: DocumentPageProps) {
  const copy = COPY[kind];
  const list = useDocuments(kind);
  const entries = list.phase === "ready" ? list.data : null;
  const current = entries?.find((e) => e.name === name) ?? null;
  const first = entries && entries.length > 0 ? entries[0] : null;

  // The bare address (#/files) has nothing selected: open the first one, without a history entry.
  useEffect(() => {
    if (name === undefined && first) window.location.replace(hrefFor(kind, first.name));
  }, [name, first, kind]);

  const sidebar = (entries ?? []).map((entry) => (
    <Card
      key={entry.path}
      variant="item"
      href={hrefFor(kind, entry.name)}
      selected={entry.name === name}
    >
      <span className={styles.itemLabel}>{labelFor(kind, entry)}</span>
    </Card>
  ));

  let body;
  if (list.phase === "loading") {
    body = (
      <p className={styles.note} role="status">
        Loading…
      </p>
    );
  } else if (list.phase === "failed") {
    body = (
      <EmptyState
        title={`Could not load the ${copy.noun}s`}
        description="The Hub could not read the folder. Is it still running?"
      />
    );
  } else if (!first) {
    body = <EmptyState title={copy.empty.title} description={copy.empty.description} />;
  } else if (current) {
    // Keyed by path, so opening another document starts it from its own file, not this one's text.
    body = <DocumentPane key={current.path} entry={current} title={labelFor(kind, current)} />;
  } else if (name === undefined) {
    body = null; // redirecting
  } else {
    body = (
      <EmptyState
        title={`That ${copy.noun} is not in the list`}
        description={`There is no ${copy.noun} called "${name}". It may have been renamed or removed.`}
        action={{ label: `Open ${labelFor(kind, first)}`, href: hrefFor(kind, first.name) }}
      />
    );
  }

  return (
    <DocumentLayout sidebar={sidebar} sidebarLabel={copy.section}>
      {body}
    </DocumentLayout>
  );
}
