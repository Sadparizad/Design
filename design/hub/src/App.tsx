import { useEffect } from "react";
import { EmptyState } from "./components/EmptyState/EmptyState.tsx";
import { RepoIndicator } from "./components/RepoIndicator/RepoIndicator.tsx";
import { AppShell } from "./components/Shell/AppShell.tsx";
import { DocumentPage } from "./pages/Document/DocumentPage.tsx";
import { FeaturePage, tabFromQuery } from "./pages/Feature/Feature.tsx";
import { History } from "./pages/History/History.tsx";
import { Home } from "./pages/Home/Home.tsx";
import { useRoute } from "./router/useRoute.ts";

/**
 * Every route renders the shell. History and a feature build their own, to fill its slots.
 * Files and Skills are one DocumentPage over two lists.
 */
export function App() {
  const { route, page, query } = useRoute();

  useEffect(() => {
    if (route.id === "feature") return; // the feature page names itself once it has read its title
    document.title = route.id === "home" ? "Design Hub" : `${page.title} · Design Hub`;
  }, [route.id, page.title]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [route.id, route.params.feature]);

  if (route.id === "history") return <History page={page} />;
  if (route.id === "feature") {
    return (
      <FeaturePage
        key={route.params.feature}
        name={route.params.feature}
        tab={tabFromQuery(query.get("tab"))}
        base={page}
      />
    );
  }

  return (
    <AppShell page={page} headerEnd={<RepoIndicator />}>
      {route.id === "home" && <Home />}
      {(route.id === "files" || route.id === "file") && (
        <DocumentPage kind="files" name={route.params.name} />
      )}
      {(route.id === "skills" || route.id === "skill") && (
        <DocumentPage kind="skills" name={route.params.name} />
      )}
      {route.id === "notFound" && (
        <EmptyState
          title="Nothing to show"
          description="Check the address, or start again from the home page."
          action={{ label: "Go to Design Hub", href: "#/" }}
        />
      )}
    </AppShell>
  );
}
