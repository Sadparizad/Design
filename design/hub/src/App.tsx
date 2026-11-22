import { useEffect } from "react";
import { EmptyState } from "./components/EmptyState/EmptyState.tsx";
import { RepoIndicator } from "./components/RepoIndicator/RepoIndicator.tsx";
import { AppShell } from "./components/Shell/AppShell.tsx";
import { DocumentPage } from "./pages/Document/DocumentPage.tsx";
import { Home } from "./pages/Home/Home.tsx";
import { useRoute } from "./router/useRoute.ts";

/**
 * Every route renders the shell. Files and Skills are one DocumentPage over two lists; the
 * rest of the pages come in later stages.
 */
export function App() {
  const { route, page } = useRoute();

  useEffect(() => {
    document.title = route.id === "home" ? "Design Hub" : `${page.title} · Design Hub`;
    window.scrollTo(0, 0);
  }, [route.id, page.title]);

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
