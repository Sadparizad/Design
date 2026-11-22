import { Card } from "../Card/Card.tsx";
import { Icon } from "../Icon.tsx";
import styles from "./TileCard.module.css";

interface TileCardProps {
  title: string;
  /** Two lines at most. Leave out for a card with only a title. */
  description?: string | null;
  /** Makes the whole card a link. Without it the card is plain and shows no arrow. */
  href?: string;
  /** An address on another site: opens in a new tab. */
  external?: boolean;
  /** Something is still being read. The card shows its title only. */
  busy?: boolean;
}

/** A 392x194 card: title, a two-line description and an orange arrow at the bottom right. */
export function TileCard({ title, description, href, external = false, busy = false }: TileCardProps) {
  const link = href !== undefined;
  return (
    <Card
      variant="tile"
      href={href}
      external={external}
      className={`${styles.tile} ${link ? "" : styles.plain}`}
    >
      <div className={styles.content} aria-busy={busy || undefined}>
        <p className={styles.title}>
          {title}
          {external && <span className="visually-hidden"> (opens in a new tab)</span>}
        </p>
        {description && <p className={styles.description}>{description}</p>}
      </div>
      {link && <Icon name="arrowRightBrand" />}
    </Card>
  );
}
