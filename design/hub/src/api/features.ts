import type { Feature, FeatureSummary } from "../data/types.ts";
import { useJson, type Fetched } from "./documents.ts";

/** Every feature the data layer lists, with the status, owner and dates from its README. */
export function useFeatures(): Fetched<FeatureSummary[]> {
  return useJson<FeatureSummary[]>("/api/features");
}

/** One feature: its spec text, strings and variants, read through the data layer. */
export function useFeature(name: string): Fetched<Feature> {
  return useJson<Feature>(`/api/feature/${encodeURIComponent(name)}`);
}
