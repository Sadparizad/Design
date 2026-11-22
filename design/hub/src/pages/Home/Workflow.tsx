import { Fragment, useMemo, useState, type ReactNode } from "react";
import { Select } from "../../components/Select/Select.tsx";
import { WORKFLOWS } from "./home.config.ts";
import { parseWorkflow, type WorkflowPart } from "./parseWorkflow.ts";
import styles from "./Workflow.module.css";

const OPTIONS = WORKFLOWS.map(({ value, label }) => ({ value, label }));

function StepNumber({ n }: { n: string }) {
  return (
    <span className={styles.step}>
      <span className="visually-hidden">Step </span>
      {n}
    </span>
  );
}

function renderParts(parts: WorkflowPart[]): ReactNode[] {
  const out: ReactNode[] = [];
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (part.type === "code") {
      out.push(<code key={i} className={styles.code}>{part.value}</code>);
    } else if (part.type === "text") {
      out.push(<Fragment key={i}>{part.value}</Fragment>);
    } else {
      // Keep a step number on the same line as the first word after it.
      const next = parts[i + 1];
      const split = next?.type === "text" ? /^(\s*\S+)([\s\S]*)$/.exec(next.value) : null;
      if (split) {
        out.push(
          <span key={i} className={styles.keep}>
            <StepNumber n={part.value} />
            {split[1]}
          </span>,
        );
        if (split[2]) out.push(<Fragment key={i + 1}>{split[2]}</Fragment>);
        i++;
      } else {
        out.push(<StepNumber key={i} n={part.value} />);
      }
    }
  }
  return out;
}

/** The workflow heading, its dropdown, and the paragraph the dropdown switches. */
export function Workflow() {
  const [value, setValue] = useState(WORKFLOWS[0].value);
  const current = WORKFLOWS.find((w) => w.value === value) ?? WORKFLOWS[0];
  const parts = useMemo(() => parseWorkflow(current.text), [current]);

  return (
    <section className={styles.section} aria-labelledby="workflow-heading">
      <span className={styles.glow} aria-hidden="true" />
      <div className={styles.header}>
        <h2 id="workflow-heading" className={styles.heading}>
          Workflow
        </h2>
        <Select
          variant="pill"
          label="Choose a workflow"
          value={current.value}
          onChange={setValue}
          options={OPTIONS}
        />
      </div>
      <p className={styles.text}>{renderParts(parts)}</p>
    </section>
  );
}
