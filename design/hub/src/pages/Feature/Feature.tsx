import { useEffect, useMemo } from "react";
import { useFeature } from "../../api/features.ts";
import { EmptyState } from "../../components/EmptyState/EmptyState.tsx";
import type { MetaItem } from "../../components/MetaRow/MetaRow.tsx";
import { MetaRow } from "../../components/MetaRow/MetaRow.tsx";
import { RepoIndicator } from "../../components/RepoIndicator/RepoIndicator.tsx";
import { AppShell } from "../../components/Shell/AppShell.tsx";
import { TabControl, tabId, type TabItem } from "../../components/TabControl/TabControl.tsx";
import type { Feature as FeatureData } from "../../data/types.ts";
import { formatRange } from "../../lib/formatDate.ts";
import { knownStatus } from "../../lib/status.ts";
import type { PageMeta } from "../../router/routes.ts";
import { PrototypeControls, PrototypeStage, usePrototypeState } from "./PrototypeTab.tsx";
import { SpecTab } from "./SpecTab.tsx";

export type FeatureTab = "spec" | "prototype" | "final";

const TABS: Array<TabItem & { id: FeatureTab }> = [
  { id: "spec", label: "Spec", icon: "textAlignLeft" },
  { id: "prototype", label: "Prototype", icon: "play" },
  { id: "final", label: "Final", icon: "codeSimple" },
];

const PANEL = "feature-panel";

/** The tab a `?tab=` value names. Anything else is the Spec tab. */
export function tabFromQuery(value: string | null): FeatureTab {
  return TABS.find((t) => t.id === value)?.id ?? "spec";
}

function metaFor(feature: FeatureData): MetaItem[] {
  const items: MetaItem[] = [];
  if (feature.owner) items.push({ key: "owner", icon: "userCircle", text: feature.owner, label: "Owner" });
  const range = formatRange(feature.started, feature.shipped);
  if (range) items.push({ key: "dates", icon: "calendarBlank", text: range, label: "Dates" });
  if (feature.status) {
    const status = knownStatus(feature.status);
    const dot = { blue: "dotBlue", yellow: "dotYellow", cyan: "dotCyan" } as const;
    items.push({
      key: "status",
      icon: status ? dot[status.tone] : null,
      text: status?.value ?? feature.status,
      label: "Status",
    });
  }
  return items;
}

/** One feature: its facts and title in the band, then the Spec, Prototype or Final tab. */
export function FeaturePage({
  name,
  tab,
  base,
}: {
  name: string;
  tab: FeatureTab;
  base: PageMeta;
}) {
  const feature = useFeature(name);
  const proto = usePrototypeState();

  const ready = feature.phase === "ready" && feature.data.exists ? feature.data : null;
  const title = ready ? (ready.title ?? ready.name) : name;

  const page: PageMeta = useMemo(
    () => ({
      ...base,
      title,
      crumbs: base.crumbs.map((c, i) => (i === base.crumbs.length - 1 ? { ...c, label: title } : c)),
    }),
    [base, title],
  );

  useEffect(() => {
    document.title = `${title} · Design Hub`;
  }, [title]);

  function choose(id: string) {
    const to = `#/history/${encodeURIComponent(name)}`;
    window.location.hash = id === "spec" ? to : `${to}?tab=${id}`;
  }

  if (!ready) {
    return (
      <AppShell page={page} headerEnd={<RepoIndicator />}>
        {feature.phase === "loading" && <div aria-busy="true" />}
        {feature.phase === "failed" && (
          <EmptyState
            title="Could not read this feature"
            description="Check that the Hub is still running, then reload this page."
          />
        )}
        {feature.phase === "ready" && (
          <EmptyState
            title="Feature not found"
            description={`There is no folder named ${name} in design/features.`}
            action={{ label: "Back to Design history", href: "#/history" }}
          />
        )}
      </AppShell>
    );
  }

  return (
    <AppShell
      page={page}
      headerEnd={<RepoIndicator />}
      tone={tab === "prototype" ? "default" : "secondary"}
      meta={<MetaRow items={metaFor(ready)} />}
      tabs={
        <TabControl
          variant="page"
          label="Feature views"
          items={TABS}
          value={tab}
          onChange={choose}
          panelId={PANEL}
        />
      }
      panel={{ id: PANEL, labelledBy: tabId(PANEL, tab) }}
      wide={tab === "prototype" ? <PrototypeStage sizes={proto.sizes} /> : undefined}
    >
      {tab === "spec" && <SpecTab feature={ready} />}
      {tab === "prototype" && (
        <PrototypeControls
          feature={ready}
          variant={proto.variant}
          onVariant={proto.setVariant}
          sizes={proto.sizes}
          onSizes={proto.setSizes}
        />
      )}
      {/* Final: the tab is here and its panel is empty. */}
    </AppShell>
  );
}
