import { useEffect, useState } from "react";
import type { DocumentEntry, DocumentKind, ReadResult } from "../data/types.ts";

export type Fetched<T> =
  | { phase: "loading" }
  | { phase: "ready"; data: T }
  | { phase: "failed" };

/** GET a JSON address on the local server. Aborts when the address changes or the page leaves. */
function useJson<T>(url: string): Fetched<T> {
  const [state, setState] = useState<{ url: string; result: Fetched<T> } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch(url, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(String(res.status));
        return res.json() as Promise<T>;
      })
      .then((data) => setState({ url, result: { phase: "ready", data } }))
      .catch((err: unknown) => {
        if ((err as Error).name !== "AbortError") setState({ url, result: { phase: "failed" } });
      });
    return () => controller.abort();
  }, [url]);

  // A result for an earlier address counts as still loading.
  return state && state.url === url ? state.result : { phase: "loading" };
}

/** The files or skills the data layer lists, in order. */
export function useDocuments(kind: DocumentKind): Fetched<DocumentEntry[]> {
  return useJson<DocumentEntry[]>(`/api/documents?kind=${encodeURIComponent(kind)}`);
}

/** One file, read through the data layer. A missing file comes back with `exists: false`. */
export function useDocument(path: string): Fetched<ReadResult> {
  return useJson<ReadResult>(`/api/document?path=${encodeURIComponent(path)}`);
}
