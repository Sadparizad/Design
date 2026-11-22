/**
 * The route table. Pure TypeScript with no React, so it can be tested on its own.
 * Every route is a hash route, so nothing but the local server is needed.
 */

/** Breadcrumb wording for each section. Change a label here and every page follows. */
export const LABELS = {
  home: "Design Hub",
  history: "Design history",
  files: "Files",
  skills: "Skills",
} as const;

export type RouteId =
  | "home"
  | "history"
  | "feature"
  | "files"
  | "file"
  | "skills"
  | "skill"
  | "notFound";

export interface Route {
  id: RouteId;
  /** Values for `:name` segments, already decoded. */
  params: Record<string, string>;
}

export interface Crumb {
  label: string;
  /** Null for the last crumb: the page you are on is not a link. */
  href: string | null;
}

export interface PageMeta {
  title: string;
  description: string | null;
  /** The home page: centred, larger title with the mascot, no rule under the band. */
  hero: boolean;
  crumbs: Crumb[];
  /** Where the back button goes. Null on the home page, where there is no back button. */
  back: Crumb | null;
}

const PATTERNS: Array<{ id: RouteId; pattern: string }> = [
  { id: "home", pattern: "/" },
  { id: "history", pattern: "/history" },
  { id: "feature", pattern: "/history/:feature" },
  { id: "files", pattern: "/files" },
  { id: "file", pattern: "/files/:name" },
  { id: "skills", pattern: "/skills" },
  { id: "skill", pattern: "/skills/:name" },
];

/** "#/history/x/?a=1" becomes "/history/x". */
export function pathFromHash(hash: string): string {
  let path = hash.replace(/^#/, "");
  const query = path.indexOf("?");
  if (query >= 0) path = path.slice(0, query);
  if (!path.startsWith("/")) path = "/" + path;
  return path.length > 1 ? path.replace(/\/+$/, "") || "/" : path;
}

export function matchRoute(hash: string): Route {
  const parts = pathFromHash(hash).split("/").slice(1);
  for (const { id, pattern } of PATTERNS) {
    const want = pattern.split("/").slice(1);
    if (want.length !== parts.length) continue;
    const params: Record<string, string> = {};
    let ok = true;
    for (let i = 0; i < want.length; i++) {
      if (want[i].startsWith(":")) {
        let value = "";
        try {
          value = decodeURIComponent(parts[i]);
        } catch {
          ok = false;
          break;
        }
        if (value === "") {
          ok = false;
          break;
        }
        params[want[i].slice(1)] = value;
      } else if (want[i] !== parts[i]) {
        ok = false;
        break;
      }
    }
    if (ok) return { id, params };
  }
  return { id: "notFound", params: {} };
}

/** Build a trail from links. The last one never links. */
function trail(...items: Array<[label: string, href: string]>): Crumb[] {
  return items.map(([label, href], i) => ({ label, href: i === items.length - 1 ? null : href }));
}

const HOME_CRUMB: [string, string] = [LABELS.home, "#/"];
const SKILLS_DESCRIPTION = "Things that help you in building.";

/** Copy for the title band, and the breadcrumb trail, for each route. */
export function pageFor(route: Route): PageMeta {
  const make = (
    crumbs: Crumb[],
    title: string,
    description: string | null,
    hero = false,
  ): PageMeta => ({
    title,
    description,
    hero,
    crumbs,
    back: crumbs.length > 1 ? crumbs[crumbs.length - 2] : null,
  });

  switch (route.id) {
    case "home":
      return make(
        trail(HOME_CRUMB),
        "AI Design Hub",
        "Specs, components, rules and helpers that designers and AI agents both read from.",
        true,
      );
    case "history":
      return make(
        trail(HOME_CRUMB, [LABELS.history, "#/history"]),
        "Design history",
        "Every feature, its status and the variants we tried.",
      );
    case "feature":
      return make(
        trail(HOME_CRUMB, [LABELS.history, "#/history"], [route.params.feature, ""]),
        route.params.feature,
        null,
      );
    case "files":
    case "file":
      return make(
        trail(HOME_CRUMB, [LABELS.files, "#/files"]),
        ".md files",
        "Three short files that give agents context: how to work here, and what the product is.",
      );
    case "skills":
      return make(trail(HOME_CRUMB, [LABELS.skills, "#/skills"]), "Skills", SKILLS_DESCRIPTION);
    case "skill": {
      // "Skills" is the same screen as a skill (the list is its sidebar), so the back button
      // goes to the home page rather than to a link that would only reopen this page.
      const page = make(
        trail(HOME_CRUMB, [LABELS.skills, "#/skills"], [route.params.name, ""]),
        "Skills",
        SKILLS_DESCRIPTION,
      );
      return { ...page, back: { label: LABELS.home, href: "#/" } };
    }
    case "notFound":
      return make(
        trail(HOME_CRUMB, ["Page not found", ""]),
        "Page not found",
        "That address does not match any page in the Hub.",
      );
  }
}
