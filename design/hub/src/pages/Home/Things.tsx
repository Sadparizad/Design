import type { ReactNode } from "react";
import { useDocument, useDocuments } from "../../api/documents.ts";
import { EmptyState } from "../../components/EmptyState/EmptyState.tsx";
import { GroupHeading } from "../../components/GroupHeading/GroupHeading.tsx";
import { TileCard } from "../../components/TileCard/TileCard.tsx";
import { declaredDescription, firstLink } from "../../data/markdown.ts";
import { matchRoute, pageFor } from "../../router/routes.ts";
import { FILE_ROUTES, SOURCES } from "./home.config.ts";
import styles from "./Things.module.css";

function Group({ id, title, busy, children }: { id: string; title: string; busy?: boolean; children: ReactNode }) {
  return (
    <section className={styles.group} aria-labelledby={id}>
      <GroupHeading id={id}>{title}</GroupHeading>
      <div className={styles.grid} aria-busy={busy || undefined}>
        {children}
      </div>
    </section>
  );
}

/** Design history and the .md files: title and description are each page's own copy. */
function FilesGroup() {
  return (
    <Group id="things-files" title="Files">
      {FILE_ROUTES.map((href) => {
        const page = pageFor(matchRoute(href));
        return <TileCard key={href} title={page.title} description={page.description} href={href} />;
      })}
    </Group>
  );
}

/** A source is a link kept in a file. No link in the file yet means a card that says so. */
function SourceCard({ name, path }: { name: string; path: string }) {
  const doc = useDocument(path);
  if (doc.phase === "loading") return <TileCard title={name} busy />;
  if (doc.phase === "failed") {
    return <TileCard title={name} description={`Could not read ${path}.`} />;
  }
  const link = doc.data.exists ? firstLink(doc.data.text) : null;
  if (link === null) {
    // The last two parts of the path say which file, without a long path wrapping across the card.
    const file = path.split("/").slice(-2).join("/");
    return <TileCard title={name} description={`Link not set yet. Add it to ${file}.`} />;
  }
  return (
    <TileCard
      title={name}
      description={declaredDescription(doc.data.text)}
      href={link}
      external
    />
  );
}

function SourcesGroup() {
  const storybook = pageFor(matchRoute("#/storybook"));
  return (
    <Group id="things-sources" title="Sources">
      <TileCard title={storybook.title} description={storybook.description} href="#/storybook" />
      {SOURCES.map((source) => (
        <SourceCard key={source.path} {...source} />
      ))}
    </Group>
  );
}

/** One card per skill folder, so a new folder shows up here with no change to this page. */
function SkillsGroup() {
  const skills = useDocuments("skills");
  return (
    <Group id="things-skills" title="Skills" busy={skills.phase === "loading"}>
      {skills.phase === "loading" && (
        <>
          <div className={styles.skeleton} aria-hidden="true" />
          <div className={styles.skeleton} aria-hidden="true" />
        </>
      )}
      {skills.phase === "failed" && (
        <div className={styles.wide}>
          <EmptyState
            title="Could not read the skills"
            description="Check that the Hub is still running, then reload this page."
          />
        </div>
      )}
      {skills.phase === "ready" && skills.data.length === 0 && (
        <div className={styles.wide}>
          <EmptyState
            title="No skills yet"
            description="Add a folder with a SKILL.md file to the skills folder and it shows up here."
          />
        </div>
      )}
      {skills.phase === "ready" &&
        skills.data.map((skill) => (
          <TileCard
            key={skill.name}
            title={skill.name}
            description={skill.declaredDescription}
            href={`#/skills/${encodeURIComponent(skill.name)}`}
          />
        ))}
    </Group>
  );
}

export function Things() {
  return (
    <section className={styles.section} aria-labelledby="things-heading">
      <h2 id="things-heading" className={styles.heading}>
        Things
      </h2>
      <div className={styles.groups}>
        <FilesGroup />
        <SourcesGroup />
        <SkillsGroup />
      </div>
    </section>
  );
}
