import { useEffect, useState } from "react";
import { STATIC, apiUrl } from "../lib/staticMode.ts";
import type { DocumentEntry, DocumentKind, ReadResult, WriteResult } from "../data/types.ts";

export type Fetched<T> =
  | { phase: "loading" }
  | { phase: "ready"; data: T }
  | { phase: "failed" };

/**
 * GET a JSON address on the local server. Aborts when the address changes or the page leaves.
 * Changing `reload` fetches again; the earlier result stays on screen until the new one lands,
 * so a refresh never flashes a loading state.
 */
export function useJson<T>(url: string, reload = 0): Fetched<T> {
  const [state, setState] = useState<{ url: string; result: Fetched<T> } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch(apiUrl(url), { signal: controller.signal })
      .then((res) => {
        // No snapshot file means the file is not in design/, which the server reports as exists: false.
        if (STATIC && res.status === 404 && url.startsWith("/api/document?")) {
          const path = new URL(url, "http://x").searchParams.get("path") ?? "";
          return { path, exists: false, text: "", modifiedAt: null } as T;
        }
        if (!res.ok) throw new Error(String(res.status));
        return res.json() as Promise<T>;
      })
      .then((data) => setState({ url, result: { phase: "ready", data } }))
      .catch((err: unknown) => {
        if ((err as Error).name !== "AbortError") setState({ url, result: { phase: "failed" } });
      });
    return () => controller.abort();
  }, [url, reload]);

  // A result for an earlier address counts as still loading.
  return state && state.url === url ? state.result : { phase: "loading" };
}

/** Every mounted document list, so a save can ask them to re-read (a front matter edit changes a description). */
const listListeners = new Set<() => void>();

/** Re-read the document lists now. */
export function refreshDocuments(): void {
  listListeners.forEach((reload) => reload());
}

/** A number that goes up when the window regains focus, or `refreshDocuments()` is called. */
function useReloadTick(): number {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const bump = () => setTick((n) => n + 1);
    const onVisible = () => {
      if (document.visibilityState === "visible") bump();
    };
    listListeners.add(bump);
    window.addEventListener("focus", bump);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      listListeners.delete(bump);
      window.removeEventListener("focus", bump);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);
  return tick;
}

/** The files or skills the data layer lists, in order. */
export function useDocuments(kind: DocumentKind): Fetched<DocumentEntry[]> {
  const reload = useReloadTick();
  return useJson<DocumentEntry[]>(`/api/documents?kind=${encodeURIComponent(kind)}`, reload);
}

/** One file, read through the data layer. A missing file comes back with `exists: false`. */
export function useDocument(path: string): Fetched<ReadResult> {
  return useJson<ReadResult>(`/api/document?path=${encodeURIComponent(path)}`);
}

/** Read one file now (not a hook). Throws when the server cannot be reached or answers an error. */
export async function readDocumentNow(path: string, signal?: AbortSignal): Promise<ReadResult> {
  const res = await fetch(apiUrl(`/api/document?path=${encodeURIComponent(path)}`), { signal });
  if (!res.ok) throw new Error(String(res.status));
  return (await res.json()) as ReadResult;
}

/** What a save came to, in the three ways the writer can answer. */
export type SaveOutcome =
  | { kind: "saved"; modifiedAt: number }
  | { kind: "conflict"; reason: "conflict" | "missing"; message: string }
  | { kind: "failed"; message: string };

/**
 * Turn the server's answer into a SaveOutcome. 200 with `ok` is a save, 409 is the writer
 * refusing because the file changed on disk, anything else is a failure with the best message
 * we have. Kept free of fetch so it can be tested on its own.
 */
export function interpretSave(status: number, body: unknown): SaveOutcome {
  const b = (body && typeof body === "object" ? body : {}) as Partial<WriteResult> & { error?: unknown };
  if (status === 200 && b.ok === true && typeof b.modifiedAt === "number") {
    return { kind: "saved", modifiedAt: b.modifiedAt };
  }
  if (status === 409 && b.ok === false && (b.reason === "conflict" || b.reason === "missing")) {
    return { kind: "conflict", reason: b.reason, message: b.message ?? "" };
  }
  const detail = typeof b.error === "string" && b.error !== "" ? ` ${b.error}` : "";
  const message =
    status === 413
      ? "That file is too large to save."
      : status === 403
        ? `The Hub would not save to that path.${detail}`
        : status >= 500
          ? "Something went wrong on the Hub's side while saving."
          : `The Hub could not save the file.${detail}`;
  return { kind: "failed", message };
}

/** Save a file through writeDocument. Never overwrites: a stale `loadedAt` comes back as a conflict. */
export async function saveDocument(
  path: string,
  content: string,
  loadedAt: number | null,
): Promise<SaveOutcome> {
  let res: Response;
  try {
    res = await fetch("/api/document", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path, content, loadedAt }),
    });
  } catch {
    return {
      kind: "failed",
      message: "Could not reach the Hub. Is it still running? The save may not have gone through.",
    };
  }
  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    // An answer that is not JSON still tells us the status.
  }
  return interpretSave(res.status, body);
}
