import { useMemo, useSyncExternalStore } from "react";
import { matchRoute, pageFor, queryFromHash, type PageMeta, type Route } from "./routes.ts";

function subscribe(onChange: () => void): () => void {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
}

const getHash = () => window.location.hash;

/** The current route, its page copy and its `?query`. Re-renders when the hash changes. */
export function useRoute(): { route: Route; page: PageMeta; query: URLSearchParams } {
  const hash = useSyncExternalStore(subscribe, getHash, () => "");
  return useMemo(() => {
    const route = matchRoute(hash);
    return { route, page: pageFor(route), query: queryFromHash(hash) };
  }, [hash]);
}
