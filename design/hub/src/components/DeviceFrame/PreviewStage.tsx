import { useLayoutEffect, useRef, useState } from "react";
import { DeviceFrame, type DeviceKind } from "./DeviceFrame.tsx";
import styles from "./PreviewStage.module.css";

export type PreviewSizes = "both" | "mobile" | "desktop";

interface PreviewStageProps {
  sizes: PreviewSizes;
}

const KINDS: Record<PreviewSizes, DeviceKind[]> = {
  both: ["mobile", "desktop"],
  mobile: ["mobile"],
  desktop: ["desktop"],
};

interface Natural {
  width: number;
  height: number;
}

/**
 * The preview frames at true size, scaled down together so they fit the window side by side.
 * One scale for all of them keeps Mobile and Desktop in true proportion. Frames never scale
 * up past true size. What renders inside a screen still sees a real 384 or 1440 pixel viewport.
 */
export function PreviewStage({ sizes }: PreviewStageProps) {
  const stage = useRef<HTMLDivElement>(null);
  const frames = useRef<Partial<Record<DeviceKind, HTMLDivElement | null>>>({});
  const [natural, setNatural] = useState<Partial<Record<DeviceKind, Natural>>>({});
  const [scale, setScale] = useState(1);
  const kinds = KINDS[sizes];

  useLayoutEffect(() => {
    const el = stage.current;
    if (!el) return;

    function fit() {
      if (!el) return;
      const measured: Partial<Record<DeviceKind, Natural>> = {};
      let total = 0;
      for (const kind of kinds) {
        const frame = frames.current[kind];
        if (!frame) continue;
        // offsetWidth ignores the scale transform, so this is the true size.
        measured[kind] = { width: frame.offsetWidth, height: frame.offsetHeight };
        total += frame.offsetWidth;
      }
      const gap = parseFloat(getComputedStyle(el).columnGap) || 0;
      const room = el.clientWidth - gap * Math.max(0, kinds.length - 1);
      setNatural(measured);
      setScale(total > 0 ? Math.min(1, room / total) : 1);
    }

    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(el);
    return () => observer.disconnect();
  }, [kinds]);

  return (
    <div ref={stage} className={styles.stage} data-scale={scale.toFixed(3)}>
      {kinds.map((kind) => {
        const size = natural[kind];
        return (
          <div
            key={kind}
            className={styles.slot}
            style={size ? { inlineSize: size.width * scale, blockSize: size.height * scale } : undefined}
          >
            <div className={styles.scaled} style={{ transform: `scale(${scale})` }}>
              <DeviceFrame
                kind={kind}
                frameRef={(node) => {
                  frames.current[kind] = node;
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
