import assert from "node:assert/strict";
import { test } from "node:test";
import { WORKFLOWS } from "../src/pages/Home/home.config.ts";
import { parseWorkflow } from "../src/pages/Home/parseWorkflow.ts";

const text = (value: string) => WORKFLOWS.find((w) => w.value === value)!.text;
const kinds = (parts: ReturnType<typeof parseWorkflow>, type: string) =>
  parts.filter((p) => p.type === type).map((p) => p.value);

test("parseWorkflow: plain text, a step number and a code chip", () => {
  assert.deepEqual(parseWorkflow("[1] Start with a `PRD` file."), [
    { type: "step", value: "1" },
    { type: "text", value: " Start with a " },
    { type: "code", value: "PRD" },
    { type: "text", value: " file." },
  ]);
  assert.deepEqual(parseWorkflow(""), []);
});

test("parseWorkflow: nothing is lost, so the words read exactly as written", () => {
  const flat = (t: string) => t.replace(/\s+/g, " ").trim();
  for (const { text: source } of WORKFLOWS) {
    const joined = parseWorkflow(source)
      .map((p) => (p.type === "step" ? " " : p.value))
      .join("");
    assert.equal(flat(joined), flat(source.replace(/\[\d+\]/g, " ").replace(/`/g, "")));
  }
});

test("workflow A: eight steps, five chips, punctuation inside the chip kept", () => {
  const parts = parseWorkflow(text("key-screens"));
  assert.deepEqual(kinds(parts, "step"), ["1", "2", "3", "4", "5", "6", "7", "8"]);
  assert.deepEqual(kinds(parts, "code"), [
    "PRD",
    "spec-from-prd",
    "spec.md",
    "prototype-shell.",
    "spec.md",
    "handoff",
  ]);
});

test("workflow B: seven steps, three chips, and handoff is plain text", () => {
  const parts = parseWorkflow(text("ai-everything"));
  assert.deepEqual(kinds(parts, "step"), ["1", "2", "3", "4", "5", "6", "7"]);
  assert.deepEqual(kinds(parts, "code"), ["PRD", "spec-from-prd", "spec.md", "spec.md"]);
  assert.match(parts.map((p) => p.value).join(""), /review the handoff files/);
  assert.match(parts.map((p) => p.value).join(""), /you're happy with one\./);
});

test("the two workflows are the only options, each with a dropdown label", () => {
  assert.deepEqual(
    WORKFLOWS.map((w) => w.label),
    ["If you have key screen designs", "If you want AI design everything"],
  );
});
