import type { ReactNode } from "react";
import styles from "./Card.module.css";

interface CardProps {
  /** tile: home cards. row: list rows. item: sidebar entries. */
  variant?: "tile" | "row" | "item";
  /** Turns the card into a link. */
  href?: string;
  /** For an external link, such as Storybook or Figma: opens in a new tab. */
  external?: boolean;
  /** The open entry, for the `item` variant. */
  selected?: boolean;
  children?: ReactNode;
  className?: string;
}

export function Card({
  variant = "tile",
  href,
  external = false,
  selected = false,
  children,
  className,
}: CardProps) {
  const classes = [styles.card, styles[variant], selected && styles.itemSelected, className]
    .filter(Boolean)
    .join(" ");

  if (href === undefined) return <div className={classes}>{children}</div>;
  return (
    <a
      className={classes}
      href={href}
      aria-current={selected ? "page" : undefined}
      {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
    >
      {children}
    </a>
  );
}
