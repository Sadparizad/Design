import type { Crumb } from "../../router/routes.ts";
import styles from "./Shell.module.css";

interface BreadcrumbProps {
  crumbs: Crumb[];
}

/** Every crumb links except the last, which is the page you are on. */
export function Breadcrumb({ crumbs }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className={styles.nav}>
      <ol className={styles.crumbs}>
        {crumbs.map((crumb, i) => (
          <li key={i} className={styles.item}>
            {i > 0 && (
              <span className={styles.separator} aria-hidden="true">
                /
              </span>
            )}
            {crumb.href === null ? (
              <span className={styles.crumb} aria-current="page">
                {crumb.label}
              </span>
            ) : (
              <a className={`${styles.crumb} ${styles.crumbLink}`} href={crumb.href}>
                {crumb.label}
              </a>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
