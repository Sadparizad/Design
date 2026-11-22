import assert from "node:assert/strict";
import { test } from "node:test";
import type { FeatureSummary } from "../src/data/types.ts";
import { featureTitle, filterFeatures, sortFeatures } from "../src/pages/History/filter.ts";

const f = (name: string, over: Partial<FeatureSummary> = {}): FeatureSummary => ({
  name,
  title: null,
  status: null,
  owner: null,
  preview: null,
  started: null,
  shipped: null,
  ...over,
});

const list = [
  f("wallet", { title: "Wallet Top-up v1.3", status: "In progress", started: "2026-11-04" }),
  f("bnpl", { title: "BNPL Payment Receipt v2.2", status: "In progress", started: "2026-03-12" }),
  f("crypto", { title: "Crypto Checkout v1.0", status: "In review", started: "2026-03-12" }),
  f("history", { title: "Payment History v1.2", status: "Shipped", started: "2025-09-08" }),
  f("draft", { status: "Spec" }),
];

test("featureTitle: the spec title, else the folder name", () => {
  assert.equal(featureTitle(list[0]), "Wallet Top-up v1.3");
  assert.equal(featureTitle(list[4]), "draft");
});

test("sortFeatures: by status, newest start first, unknown status last; input untouched", () => {
  const before = list.map((x) => x.name);
  assert.deepEqual(sortFeatures(list).map((x) => x.name), ["wallet", "bnpl", "crypto", "history", "draft"]);
  assert.deepEqual(list.map((x) => x.name), before);
});

test("sortFeatures: undated sorts after dated, then by name", () => {
  const out = sortFeatures([f("b"), f("a"), f("c", { started: "2026-01-01" })]);
  assert.deepEqual(out.map((x) => x.name), ["c", "a", "b"]);
});

test("filterFeatures: search matches the title or the folder name, in any case", () => {
  assert.deepEqual(filterFeatures(list, "wallet", "").map((x) => x.name), ["wallet"]);
  assert.deepEqual(filterFeatures(list, "  PAYMENT ", "").map((x) => x.name), ["bnpl", "history"]);
  assert.deepEqual(filterFeatures(list, "draft", "").map((x) => x.name), ["draft"]);
});

test("filterFeatures: status filter, alone and with a search", () => {
  assert.deepEqual(filterFeatures(list, "", "In progress").map((x) => x.name), ["wallet", "bnpl"]);
  assert.deepEqual(filterFeatures(list, "bnpl", "In progress").map((x) => x.name), ["bnpl"]);
  assert.deepEqual(filterFeatures(list, "bnpl", "Shipped"), []);
});

test("filterFeatures: nothing chosen keeps everything, including an unknown status", () => {
  assert.equal(filterFeatures(list, "", "").length, 5);
  assert.deepEqual(filterFeatures([], "x", "Shipped"), []);
});
