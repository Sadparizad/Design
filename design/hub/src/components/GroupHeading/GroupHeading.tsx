import styles from "./GroupHeading.module.css";

interface GroupHeadingProps {
  id?: string;
  children: string;
}

/** A small label with a hairline rule running to its right. */
export function GroupHeading({ id, children }: GroupHeadingProps) {
  return (
    <div className={styles.row}>
      <h3 id={id} className={styles.label}>
        {children}
      </h3>
      <span className={styles.rule} aria-hidden="true" />
    </div>
  );
}
