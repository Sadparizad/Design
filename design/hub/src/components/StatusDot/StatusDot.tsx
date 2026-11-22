import { Icon } from "../Icon.tsx";
import type { IconName } from "../icons.ts";
import styles from "./StatusDot.module.css";

/** The three dot colours in the design system: Icon/Info, Icon/Utility/Yellow, Icon/Utility/Cyan. */
const DOTS = { blue: "dotBlue", yellow: "dotYellow", cyan: "dotCyan" } as const satisfies Record<
  string,
  IconName
>;

export type StatusTone = keyof typeof DOTS;

interface StatusDotProps {
  /** Null for a status the Hub does not know: the label shows as written, with no dot. */
  tone: StatusTone | null;
  label: string;
}

/** A coloured dot with its label. The label carries the meaning; the colour only helps. */
export function StatusDot({ tone, label }: StatusDotProps) {
  return (
    <span className={styles.status}>
      {tone && <Icon name={DOTS[tone]} />}
      {label}
    </span>
  );
}
