import styles from "./EmptyState.module.css";

interface EmptyStateProps {
  title: string;
  description?: string;
  /** An optional way out, such as a link back to the home page. */
  action?: { label: string; href: string };
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className={styles.empty}>
      <p className={styles.title}>{title}</p>
      {description && <p className={styles.description}>{description}</p>}
      {action && (
        <a className={styles.action} href={action.href}>
          {action.label}
        </a>
      )}
    </div>
  );
}
