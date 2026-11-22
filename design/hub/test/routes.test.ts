import assert from "node:assert/strict";
import { test } from "node:test";
import { LABELS, matchRoute, pageFor, pathFromHash } from "../src/router/routes.ts";

test("pathFromHash: empty, trailing slash and query all normalise", () => {
  assert.equal(pathFromHash(""), "/");
  assert.equal(pathFromHash("#"), "/");
  assert.equal(pathFromHash("#/"), "/");
  assert.equal(pathFromHash("#/history/"), "/history");
  assert.equal(pathFromHash("#/history/x?tab=spec"), "/history/x");
  assert.equal(pathFromHash("#history"), "/history");
});

test("matchRoute: the five routes, plus the bare files and skills lists", () => {
  assert.deepEqual(matchRoute("#/"), { id: "home", params: {} });
  assert.deepEqual(matchRoute("#/history"), { id: "history", params: {} });
  assert.deepEqual(matchRoute("#/history/wallet-top-up"), {
    id: "feature",
    params: { feature: "wallet-top-up" },
  });
  assert.deepEqual(matchRoute("#/files/product"), { id: "file", params: { name: "product" } });
  assert.deepEqual(matchRoute("#/skills/spec-from-prd"), {
    id: "skill",
    params: { name: "spec-from-prd" },
  });
  assert.equal(matchRoute("#/files").id, "files");
  assert.equal(matchRoute("#/skills").id, "skills");
});

test("matchRoute: params are decoded; bad addresses are notFound", () => {
  assert.equal(matchRoute("#/history/caf%C3%A9").params.feature, "café");
  assert.equal(matchRoute("#/history/%E0%A4%A").id, "notFound");
  assert.equal(matchRoute("#/nope").id, "notFound");
  assert.equal(matchRoute("#/history/a/b").id, "notFound");
  assert.equal(matchRoute("#/files//").id, "files");
});

test("pageFor: the last crumb is never a link, every earlier one is", () => {
  const hashes = ["#/", "#/history", "#/history/x", "#/files", "#/files/a", "#/skills/b", "#/nope"];
  for (const hash of hashes) {
    const { crumbs } = pageFor(matchRoute(hash));
    assert.ok(crumbs.length >= 1);
    assert.equal(crumbs.at(-1)?.href, null, `${hash}: last crumb must not link`);
    for (const crumb of crumbs.slice(0, -1)) {
      assert.match(crumb.href ?? "", /^#\//, `${hash}: "${crumb.label}" must link`);
    }
  }
});

test("pageFor: crumbs follow the route, and the back button is the crumb before the last", () => {
  const home = pageFor(matchRoute("#/"));
  assert.deepEqual(home.crumbs.map((c) => c.label), [LABELS.home]);
  assert.equal(home.back, null, "no back button on the home page");

  const feature = pageFor(matchRoute("#/history/wallet-top-up"));
  assert.deepEqual(
    feature.crumbs.map((c) => c.label),
    [LABELS.home, LABELS.history, "wallet-top-up"],
  );
  assert.equal(feature.back?.href, "#/history");

  const file = pageFor(matchRoute("#/files/product"));
  assert.deepEqual(file.crumbs.map((c) => c.label), [LABELS.home, LABELS.files]);
  assert.equal(file.back?.href, "#/");
});

test("pageFor: only the home page is a hero", () => {
  assert.equal(pageFor(matchRoute("#/")).hero, true);
  assert.equal(pageFor(matchRoute("#/history")).hero, false);
});

test("queryFromHash: reads ?tab= and tolerates no query", async () => {
  const { queryFromHash } = await import("../src/router/routes.ts");
  assert.equal(queryFromHash("#/history/x?tab=prototype").get("tab"), "prototype");
  assert.equal(queryFromHash("#/history/x?a=1&tab=final").get("tab"), "final");
  assert.equal(queryFromHash("#/history/x").get("tab"), null);
  assert.equal(queryFromHash("").get("tab"), null);
});
