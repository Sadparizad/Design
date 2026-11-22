import assert from "node:assert/strict";
import { test } from "node:test";
import { listVariants } from "../src/data/variants.ts";
import { formatDate, formatRange } from "../src/lib/formatDate.ts";

test("formatDate: never shows the year", () => {
  assert.equal(formatDate("2026-03-12"), "Mar 12");
  assert.equal(formatDate("2025-09-08"), "Sep 8");
});

test("formatDate: anything that is not a real date comes back as written", () => {
  assert.equal(formatDate("March"), "March");
  assert.equal(formatDate("2026-02-30"), "2026-02-30");
  assert.equal(formatDate("12/03/2026"), "12/03/2026");
});

test("formatRange: Open until shipped; nothing when neither date is set", () => {
  assert.equal(formatRange("2026-03-12", null), "Mar 12 - Open");
  assert.equal(formatRange("2026-03-12", "2026-11-24"), "Mar 12 - Nov 24");
  assert.equal(formatRange(null, "2026-11-24"), "Unknown - Nov 24");
  assert.equal(formatRange(null, null), null);
});

test("listVariants: id to label, in file order, and D is not skipped", () => {
  const list = listVariants({ A: "Table", B: "Cards", C: "Form", D: "Stepper", E: "Wizard" });
  assert.deepEqual(list.map((v) => v.title), ["A - Table", "B - Cards", "C - Form", "D - Stepper", "E - Wizard"]);
});

test("listVariants: no label shows the id; empty, array and broken data give none", () => {
  assert.deepEqual(listVariants({ A: "" })[0].title, "A");
  assert.deepEqual(listVariants({ A: 3 })[0].title, "A");
  assert.deepEqual(listVariants({}), []);
  assert.deepEqual(listVariants([]), []);
  assert.deepEqual(listVariants(null), []);
  assert.deepEqual(listVariants("x"), []);
});
