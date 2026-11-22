import { useId } from "react";
import { Card } from "../../components/Card/Card.tsx";
import { EmptyState } from "../../components/EmptyState/EmptyState.tsx";
import { Table } from "../../components/Table/Table.tsx";
import { parseSpec, type Pick, type SpecBlock, type SpecSection } from "../../data/spec.ts";
import type { Feature } from "../../data/types.ts";
import { formatDate } from "../../lib/formatDate.ts";
import { Inline } from "./Inline.tsx";
import styles from "./Spec.module.css";

/** The one section the template says to hide when it has nothing in it. */
const HIDDEN_WHEN_EMPTY = "evidence";

function Block({ block, title }: { block: SpecBlock; title: string }) {
  switch (block.type) {
    case "paragraph":
      return (
        <p className={styles.text} dir="auto">
          <Inline text={block.text} />
        </p>
      );
    case "list": {
      const List = block.ordered ? "ol" : "ul";
      return (
        <List className={`${styles.text} ${styles.list} ${block.ordered ? styles.ordered : ""}`} dir="auto">
          {block.items
            .filter((item) => item.trim() !== "")
            .map((item, i) => (
              <li key={i}>
                <Inline text={item} />
              </li>
            ))}
        </List>
      );
    }
    case "table":
      return <SpecTable title={title} header={block.header} rows={block.rows} />;
    case "code":
      return <pre className={styles.pre}>{block.text}</pre>;
  }
}

/** Cells can carry inline marks, so the shared Table is given the plain text and the marks are drawn here. */
function SpecTable({ title, header, rows }: { title: string; header: string[]; rows: string[][] }) {
  return <Table label={title} header={header} rows={rows} renderCell={(text) => <Inline text={text} />} />;
}

function Section({ section }: { section: SpecSection }) {
  const id = useId();
  return (
    <section className={styles.section} aria-labelledby={id}>
      <h2 id={id} className={styles.title} dir="auto">
        {section.title}
      </h2>
      {section.empty ? (
        <p className={styles.none}>Nothing written yet.</p>
      ) : (
        section.blocks.map((block, i) => <Block key={i} block={block} title={section.title} />)
      )}
    </section>
  );
}

/**
 * The newest decision, shown as a card above the rest. The template calls this section "Pick":
 * it has no frame, so it reuses the history list's row card and the page's section heading.
 */
function PickSection({ pick }: { pick: Pick }) {
  const id = useId();
  const facts = [
    pick.date ? formatDate(pick.date) : null,
    pick.decidedBy ? `Decided by ${pick.decidedBy}` : null,
    pick.story,
  ].filter((f): f is string => Boolean(f));
  return (
    <section className={styles.section} aria-labelledby={id}>
      <h2 id={id} className={styles.title}>
        Pick
      </h2>
      <Card variant="row" className={styles.pick}>
        <p className={styles.decision} dir="auto">
          <Inline text={pick.decision} />
        </p>
        {facts.length > 0 && (
          <ul className={styles.facts}>
            {facts.map((fact) => (
              <li key={fact}>{fact}</li>
            ))}
          </ul>
        )}
      </Card>
    </section>
  );
}

export function SpecTab({ feature }: { feature: Feature }) {
  if (!feature.spec.exists) {
    return (
      <EmptyState
        title="No spec yet"
        description="Add a spec.md to this feature's folder, copied from the template, and it shows up here."
      />
    );
  }
  const spec = parseSpec(feature.spec.text);
  const sections = spec.sections.filter(
    (s) => !(s.empty && s.title.trim().toLowerCase() === HIDDEN_WHEN_EMPTY),
  );
  if (sections.length === 0 && !spec.pick) {
    return (
      <EmptyState
        title="The spec has no sections yet"
        description="Add a ## heading, such as ## Summary, to spec.md and it shows up here."
      />
    );
  }
  return (
    <div className={styles.spec}>
      {spec.pick && <PickSection pick={spec.pick} />}
      {sections.map((section, i) => (
        <Section key={`${i}-${section.title}`} section={section} />
      ))}
    </div>
  );
}
