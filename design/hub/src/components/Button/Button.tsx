import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";
import styles from "./Button.module.css";

interface Shared {
  /** primary: the black button (Save changes). secondary: white with a border. tertiary: warm grey, no border. */
  variant?: "primary" | "secondary" | "tertiary";
  /** compact: 10px by 14px padding and a 12px radius, 40px tall. */
  size?: "default" | "compact";
  /** Only an icon inside: a 48px square, or 40px when compact. Give it an aria-label. */
  iconOnly?: boolean;
}

type AsButton = Shared &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className"> & { href?: undefined };

type AsLink = Shared &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "className" | "href"> & {
    href: string;
    /** An address on another site: opens in a new tab. */
    external?: boolean;
  };

export type ButtonProps = AsButton | AsLink;

/** A button, or a link that looks like one when it has an `href`. */
export function Button(props: ButtonProps) {
  const { variant = "primary", size = "default", iconOnly = false, children } = props;
  const classes = [
    styles.button,
    styles[variant],
    size === "compact" && styles.compact,
    iconOnly && styles.iconOnly,
  ]
    .filter(Boolean)
    .join(" ");

  if (props.href !== undefined) {
    const { variant: _v, size: _s, iconOnly: _i, external, href, children: _c, ...rest } = props;
    return (
      <a className={classes} href={href} {...(external ? { target: "_blank", rel: "noreferrer" } : {})} {...rest}>
        <span className={styles.text}>{children}</span>
      </a>
    );
  }

  const { variant: _v, size: _s, iconOnly: _i, type = "button", children: _c, ...rest } = props;
  return (
    <button type={type} className={classes} {...rest}>
      <span className={styles.text}>{children}</span>
    </button>
  );
}
