import assert from "node:assert/strict";
import { test } from "node:test";

// status.ts imports only a type, so it runs under plain Node.
const { STATUSES, knownStatus } = await import("../src/lib/status.ts");

test("the three statuses and the dot each one takes from the Figma", () => {
  assert.deepEqual(
    STATUSES.map((s) => [s.value, s.tone]),
    [["In progress", "blue"], ["In review", "yellow"], ["Shipped", "cyan"]],
  );
});

test("knownStatus: spelling and case do not matter; unknown and missing are null", () => {
  assert.equal(knownStatus("in-progress")?.value, "In progress");
  assert.equal(knownStatus("SHIPPED")?.value, "Shipped");
  assert.equal(knownStatus("Spec"), null);
  assert.equal(knownStatus(null), null);
});
