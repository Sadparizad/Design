import { Card } from "../Card/Card.tsx";
import { Icon } from "../Icon.tsx";
import type { IconName } from "../icons.ts";
import styles from "./TileCard.module.css";

interface TileCardProps {
  title: string;
  /** Two lines at most. Leave out for a card with only a title. */
  description?: string | null;
  /** Makes the whole card a link. Without it the card is plain and shows no arrow. */
  href?: string;
  /** An address on another site: opens in a new tab. */
  external?: boolean;
  /** A short underlined line under the title, such as "Figma file". It reads as the link text. */
  detail?: string;
  /** The arrow at the bottom corner. Defaults to the orange arrow right. */
  icon?: IconName;
  /** Height follows the text instead of the fixed 194px. */
  hug?: boolean;
  /** Something is still being read. The card shows its title only. */
  busy?: boolean;
}

/** A 392x194 card: title, a two-line description and an orange arrow at the bottom right. */
export function TileCard({
  title,
  description,
  detail,
  icon = "arrowRightBrand",
  hug = false,
  href,
  external = false,
  busy = false,
}: TileCardProps) {
  const link = href !== undefined;
  return (
    <Card
      variant="tile"
      href={href}
      external={external}
      className={`${styles.tile} ${link ? "" : styles.plain} ${hug ? styles.hug : ""}`}
    >
      <div className={styles.content} aria-busy={busy || undefined}>
        <p className={styles.title}>
          {title}
          {external && <span className="visually-hidden"> (opens in a new tab)</span>}
        </p>
        {description && <p className={styles.description}>{description}</p>}
        {detail && <p className={styles.detail}>{detail}</p>}
      </div>
      {link && <Icon name={icon} />}
    </Card>
  );
}
