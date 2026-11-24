import type { ReactNode, Ref } from "react";
import { Icon } from "../Icon.tsx";
import styles from "./DeviceFrame.module.css";

export type DeviceKind = "mobile" | "desktop";

interface DeviceFrameProps {
  kind: DeviceKind;
  /** What renders into the screen. Empty until a variant is shown there. */
  children?: ReactNode;
  frameRef?: Ref<HTMLDivElement>;
  /** Where the upright arrow opens this preview on its own page, in a new tab. Without it the arrow is only drawn. */
  openHref?: string;
}

/**
 * A device mock: a bar with the upright arrow, then the screen a variant renders into. The screen is exactly
 * the size product-prd.md gives (Mobile 384x760, Desktop 1440x1024); the tokens hold the numbers.
 * Scaling to fit is the stage's job, so the screen itself is always true size.
 */
export function DeviceFrame({ kind, children, frameRef, openHref }: DeviceFrameProps) {
  const mobile = kind === "mobile";
  return (
    <section
      ref={frameRef}
      className={`${styles.frame} ${mobile ? styles.mobile : styles.desktop}`}
      aria-label={mobile ? "Mobile preview" : "Desktop preview"}
    >
      <div className={styles.bar}>
        {mobile ? <span className={styles.time} aria-hidden="true">9:41</span> : <Icon name="trafficLights" />}
        {openHref ? (
          <a
            className={styles.open}
            href={openHref}
            target="_blank"
            rel="noreferrer"
            aria-label={`Open the ${mobile ? "mobile" : "desktop"} preview in a new tab`}
          >
            <Icon name="arrowUpRightSmall" />
          </a>
        ) : (
          <span className={styles.open} aria-hidden="true">
            <Icon name="arrowUpRightSmall" />
          </span>
        )}
      </div>
      <div className={styles.screen} data-screen={kind}>
        {children}
      </div>
    </section>
  );
}
