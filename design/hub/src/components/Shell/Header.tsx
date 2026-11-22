import type { ReactNode } from "react";
import type { Crumb } from "../../router/routes.ts";
import { Icon } from "../Icon.tsx";
import { icons } from "../icons.ts";
import { Breadcrumb } from "./Breadcrumb.tsx";
import styles from "./Shell.module.css";

interface HeaderProps {
  crumbs: Crumb[];
  /** Where the back button goes. Leave out on the home page: there is no back button. */
  back?: Crumb | null;
  /** The 32x32 slot at the far right. */
  end?: ReactNode;
}

export function Header({ crumbs, back, end }: HeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.start}>
        {back && back.href !== null && (
          <a className={styles.iconButton} href={back.href} aria-label={`Back to ${back.label}`}>
            <Icon name="arrowLeft" />
          </a>
        )}
      </div>
      <div className={styles.brand}>
        <img
          className={styles.logo}
          src={icons.logo.src}
          width={icons.logo.size}
          height={icons.logo.size}
          alt=""
          aria-hidden="true"
        />
        <Breadcrumb crumbs={crumbs} />
      </div>
      <div className={styles.end}>{end}</div>
    </header>
  );
}
