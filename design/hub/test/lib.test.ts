import assert from "node:assert/strict";
import { test } from "node:test";
import { listVariants } from "../src/data/variants.ts";
import { formatDate, formatRange } from "../src/lib/formatDate.ts";

const now = new Date(2026, 10, 22);

test("formatDate: this year has no year, another year keeps it", () => {
  assert.equal(formatDate("2026-03-12", now), "Mar 12");
  assert.equal(formatDate("2025-09-08", now), "Sep 8, 2025");
});

test("formatDate: anything that is not a real date comes back as written", () => {
  assert.equal(formatDate("March", now), "March");
  assert.equal(formatDate("2026-02-30", now), "2026-02-30");
  assert.equal(formatDate("12/03/2026", now), "12/03/2026");
});

test("formatRange: Open until shipped; nothing when neither date is set", () => {
  assert.equal(formatRange("2026-03-12", null, now), "Mar 12 - Open");
  assert.equal(formatRange("2026-03-12", "2026-11-24", now), "Mar 12 - Nov 24");
  assert.equal(formatRange(null, "2026-11-24", now), "Unknown - Nov 24");
  assert.equal(formatRange(null, null, now), null);
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
