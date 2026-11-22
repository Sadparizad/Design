import { useCallback, useEffect, useRef, useState } from "react";
import type { RepoStatus } from "../data/types.ts";

export type RepoState =
  | { phase: "loading" }
  | { phase: "ready"; status: RepoStatus }
  | { phase: "failed" };

const REFRESH_MS = 30_000;

/** Every mounted `useRepoStatus`, so any page can ask the header to re-check Git. */
const listeners = new Set<() => void>();

/** Re-read the branch and clean / dirty state now. Call it after anything that writes a file. */
export function refreshRepoStatus(): void {
  listeners.forEach((refresh) => refresh());
}

/**
 * The branch and working tree state, read through the local server (which runs repoStatus()).
 * Re-checked when the window regains focus and every 30 seconds while it is visible.
 */
export function useRepoStatus(): { state: RepoState; refresh: () => void } {
  const [state, setState] = useState<RepoState>({ phase: "loading" });
  const inflight = useRef<AbortController | null>(null);

  const refresh = useCallback(() => {
    inflight.current?.abort();
    const controller = new AbortController();
    inflight.current = controller;
    fetch("/api/status", { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(String(res.status));
        return res.json() as Promise<RepoStatus>;
      })
      .then((status) => setState({ phase: "ready", status }))
      .catch((err: unknown) => {
        if ((err as Error).name !== "AbortError") setState({ phase: "failed" });
      });
  }, []);

  useEffect(() => {
    refresh();
    listeners.add(refresh);
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    const timer = window.setInterval(onVisible, REFRESH_MS);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      listeners.delete(refresh);
      inflight.current?.abort();
      window.clearInterval(timer);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh]);

  return { state, refresh };
}
