import type { ReactNode, Ref } from "react";
import { Icon } from "../Icon.tsx";
import styles from "./DeviceFrame.module.css";

export type DeviceKind = "mobile" | "desktop";

interface DeviceFrameProps {
  kind: DeviceKind;
  /** What renders into the screen. Empty until a variant is shown there. */
  children?: ReactNode;
  frameRef?: Ref<HTMLDivElement>;
}

/**
 * A device mock: a status bar, then the screen a variant renders into. The screen is exactly
 * the size product-prd.md gives (Mobile 384x760, Desktop 1440x1024); the tokens hold the numbers.
 * Scaling to fit is the stage's job, so the screen itself is always true size.
 */
export function DeviceFrame({ kind, children, frameRef }: DeviceFrameProps) {
  const mobile = kind === "mobile";
  return (
    <section
      ref={frameRef}
      className={`${styles.frame} ${mobile ? styles.mobile : styles.desktop}`}
      aria-label={mobile ? "Mobile preview" : "Desktop preview"}
    >
      <div className={styles.bar} aria-hidden="true">
        {mobile ? (
          <>
            <span className={styles.time}>9:41</span>
            <span className={styles.glyphs}>
              <Icon name="signal" />
              <Icon name="wifi" />
              <Icon name="battery" />
            </span>
          </>
        ) : (
          <>
            <Icon name="trafficLights" />
            <span className={styles.address}>
              <Icon name="arrowCircleDown" />
              <Icon name="export" />
              <Icon name="plus" />
            </span>
          </>
        )}
      </div>
      <div className={styles.screen} data-screen={kind}>
        {children}
      </div>
    </section>
  );
}
