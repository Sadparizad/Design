import { useMemo, useState } from "react";
import { useFeatures } from "../../api/features.ts";
import { Card } from "../../components/Card/Card.tsx";
import { EmptyState } from "../../components/EmptyState/EmptyState.tsx";
import { Icon } from "../../components/Icon.tsx";
import { SearchInput } from "../../components/SearchInput/SearchInput.tsx";
import { RepoIndicator } from "../../components/RepoIndicator/RepoIndicator.tsx";
import { Select } from "../../components/Select/Select.tsx";
import { AppShell } from "../../components/Shell/AppShell.tsx";
import { StatusDot } from "../../components/StatusDot/StatusDot.tsx";
import type { FeatureSummary } from "../../data/types.ts";
import { formatRange } from "../../lib/formatDate.ts";
import { knownStatus, STATUSES } from "../../lib/status.ts";
import type { PageMeta } from "../../router/routes.ts";
import { featureTitle, filterFeatures, sortFeatures } from "./filter.ts";
import styles from "./History.module.css";

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  ...STATUSES.map((s) => ({ value: s.value, label: s.value })),
];

function FeatureRow({ feature }: { feature: FeatureSummary }) {
  const status = knownStatus(feature.status);
  const range = formatRange(feature.started, feature.shipped);
  return (
    <Card variant="row" href={`#/history/${encodeURIComponent(feature.name)}`} className={styles.row}>
      <span className={styles.name}>{featureTitle(feature)}</span>
      <span className={styles.dates}>{range}</span>
      <span className={styles.status}>
        {(status || feature.status) && (
          <StatusDot tone={status?.tone ?? null} label={status?.value ?? feature.status ?? ""} />
        )}
      </span>
      <Icon name="arrowRight" />
    </Card>
  );
}

/** Design history: one row per feature folder, each row a link to its detail page. */
export function History({ page }: { page: PageMeta }) {
  const features = useFeatures();
  const [query, setQuery] = useState("");
  // "" is no choice yet, which the control shows as "Select", as the frame does.
  const [status, setStatus] = useState("");

  const all = useMemo(
    () => (features.phase === "ready" ? sortFeatures(features.data) : []),
    [features],
  );
  const shown = useMemo(
    () => filterFeatures(all, query, status === "all" ? "" : status),
    [all, query, status],
  );

  return (
    <AppShell
      page={page}
      headerEnd={<RepoIndicator />}
      controls={
        <>
          <div className={styles.search}>
            <SearchInput value={query} onChange={setQuery} label="Search features by name" />
          </div>
          <div className={styles.select}>
            <Select
              filter
              value={status}
              onChange={setStatus}
              options={STATUS_OPTIONS}
              label="Filter by status"
            />
          </div>
        </>
      }
    >
      <div className={styles.body} aria-busy={features.phase === "loading" || undefined}>
        {features.phase === "loading" && (
          <ul className={styles.list} aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <li key={i} className={styles.skeleton} />
            ))}
          </ul>
        )}

        {features.phase === "failed" && (
          <EmptyState
            title="Could not read the features"
            description="Check that the Hub is still running, then reload this page."
          />
        )}

        {features.phase === "ready" && all.length === 0 && (
          <EmptyState
            title="No features yet"
            description="Copy design/features/_template to a new folder, fill in its README.md and spec.md, and it shows up here."
          />
        )}

        {features.phase === "ready" && all.length > 0 && shown.length === 0 && (
          <EmptyState
            title="No features match"
            description="Try a different name, or choose All statuses."
          />
        )}

        {shown.length > 0 && (
          <>
            <p className="visually-hidden" role="status">
              {shown.length} {shown.length === 1 ? "feature" : "features"}
            </p>
            <ul className={styles.list}>
              {shown.map((feature) => (
                <li key={feature.name}>
                  <FeatureRow feature={feature} />
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </AppShell>
  );
}
