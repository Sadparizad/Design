import { Fragment } from "react";
import { Icon } from "../Icon.tsx";
import type { IconName } from "../icons.ts";
import styles from "./MetaRow.module.css";

export interface MetaItem {
  key: string;
  /** A status is a coloured dot, so it passes a dot icon here. */
  icon: IconName | null;
  text: string;
  /** Names the fact for screen readers: "Owner", "Dates", "Status". */
  label: string;
}

interface MetaRowProps {
  items: MetaItem[];
}

/** The row of facts above a detail page's title, with a hairline between them. */
export function MetaRow({ items }: MetaRowProps) {
  return (
    <ul className={styles.row}>
      {items.map((item, i) => (
        <Fragment key={item.key}>
          {i > 0 && (
            <li className={styles.divider} aria-hidden="true">
              <Icon name="divider" />
            </li>
          )}
          <li className={styles.item}>
            <span className="visually-hidden">{item.label}: </span>
            {item.icon && <Icon name={item.icon} />}
            {item.text}
          </li>
        </Fragment>
      ))}
    </ul>
  );
}
