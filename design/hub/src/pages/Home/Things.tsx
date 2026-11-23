import type { ReactNode } from "react";
import { useDocuments } from "../../api/documents.ts";
import { EmptyState } from "../../components/EmptyState/EmptyState.tsx";
import { GroupHeading } from "../../components/GroupHeading/GroupHeading.tsx";
import { TileCard } from "../../components/TileCard/TileCard.tsx";
import { matchRoute, pageFor } from "../../router/routes.ts";
import { FILE_ROUTES, SOURCE_ROUTES } from "./home.config.ts";
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

/** Storybook and Figma each have a page of their own in the Hub; the cards take that page's copy. */
function SourcesGroup() {
  return (
    <Group id="things-sources" title="Sources">
      {SOURCE_ROUTES.map((href) => {
        const page = pageFor(matchRoute(href));
        return <TileCard key={href} title={page.title} description={page.description} href={href} />;
      })}
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
