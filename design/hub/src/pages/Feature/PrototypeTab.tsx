import { useState } from "react";
import { PreviewStage, type PreviewSizes } from "../../components/DeviceFrame/PreviewStage.tsx";
import { EmptyState } from "../../components/EmptyState/EmptyState.tsx";
import { TabControl } from "../../components/TabControl/TabControl.tsx";
import { parseSpec } from "../../data/spec.ts";
import type { Feature } from "../../data/types.ts";
import { listVariants } from "../../data/variants.ts";
import styles from "./Prototype.module.css";

const SIZES: Array<{ id: PreviewSizes; label: string; icon?: "deviceMobileCamera" | "desktop" }> = [
  { id: "both", label: "Both" },
  { id: "mobile", label: "Mobile", icon: "deviceMobileCamera" },
  { id: "desktop", label: "Desktop", icon: "desktop" },
];

/** The filters, and the summary under them. These sit in the 800px column. */
export function PrototypeControls({
  feature,
  variant,
  onVariant,
  sizes,
  onSizes,
}: {
  feature: Feature;
  variant: string;
  onVariant: (id: string) => void;
  sizes: PreviewSizes;
  onSizes: (id: PreviewSizes) => void;
}) {
  const variants = listVariants(feature.variants.data);
  const summary = feature.spec.exists ? parseSpec(feature.spec.text).summary : null;
  const selected = variants.some((v) => v.id === variant) ? variant : (variants[0]?.id ?? "");

  return (
    <div className={styles.controls}>
      <div className={styles.filters}>
        <div className={styles.filterVariant}>
          <p className={styles.label} aria-hidden="true">
            Variant
          </p>
          {variants.length > 0 ? (
            <TabControl
              variant="filter"
              label="Variant"
              value={selected}
              onChange={onVariant}
              items={variants.map((v) => ({ id: v.id, label: v.title }))}
            />
          ) : (
            <EmptyState
              title={feature.variants.error ? "variants.json could not be read" : "No variants yet"}
              description={
                feature.variants.error
                  ? feature.variants.error
                  : 'List them in variants.json, one per line, like { "A": "Table", "B": "Cards" }.'
              }
            />
          )}
        </div>
        <div className={styles.filterSizes}>
          <p className={styles.label} aria-hidden="true">
            Sizes
          </p>
          <TabControl
            variant="filter"
            spacious
            label="Sizes"
            value={sizes}
            onChange={(id) => onSizes(id as PreviewSizes)}
            items={SIZES}
          />
        </div>
      </div>
      {summary && <p className={styles.summary} dir="auto">{summary}</p>}
    </div>
  );
}

/**
 * The preview frames. They are empty on purpose: each is the container the selected variant
 * renders into, at the size product-prd.md gives. Nothing renders into them yet.
 */
export function PrototypeStage({ sizes }: { sizes: PreviewSizes }) {
  return <PreviewStage sizes={sizes} />;
}

export function usePrototypeState() {
  const [variant, setVariant] = useState("");
  const [sizes, setSizes] = useState<PreviewSizes>("both");
  return { variant, setVariant, sizes, setSizes };
}
