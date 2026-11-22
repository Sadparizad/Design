import assert from "node:assert/strict";
import { test } from "node:test";
import { interpretSave } from "../src/api/documents.ts";
import { draftReducer, initDraft, isDirty, type Disk, type DraftAction, type DraftState } from "../src/pages/Document/draft.ts";

const disk = (text: string, modifiedAt: number | null = 100): Disk => ({ exists: modifiedAt !== null, text, modifiedAt });
const run = (s: DraftState, ...actions: DraftAction[]) => actions.reduce(draftReducer, s);

test("a fresh document is clean; editing makes it dirty; editing back makes it clean again", () => {
  let s = initDraft(disk("one"));
  assert.equal(isDirty(s), false);
  s = run(s, { type: "edit", text: "two" });
  assert.equal(isDirty(s), true);
  s = run(s, { type: "edit", text: "one" });
  assert.equal(isDirty(s), false);
});

test("a save moves the base to what was sent, and its time becomes the next loadedAt", () => {
  const s = run(initDraft(disk("one", 100)), { type: "edit", text: "two" }, { type: "saveStarted" }, { type: "saved", sent: "two", modifiedAt: 200 });
  assert.deepEqual(s.base, { exists: true, text: "two", modifiedAt: 200 });
  assert.equal(isDirty(s), false);
  assert.equal(s.save.phase, "saved");
});

test("typing during a save: only the sent text is on disk, so the editor stays dirty", () => {
  const s = run(
    initDraft(disk("one")),
    { type: "edit", text: "two" },
    { type: "saveStarted" },
    { type: "edit", text: "two, and more" },
    { type: "saved", sent: "two", modifiedAt: 200 },
  );
  assert.equal(s.base.text, "two");
  assert.equal(s.draft, "two, and more");
  assert.equal(isDirty(s), true);
  assert.equal(s.save.phase, "idle", "'Saved.' would be untrue");
});

test("editing after a save clears 'Saved.'", () => {
  const s = run(initDraft(disk("a")), { type: "edit", text: "b" }, { type: "saved", sent: "b", modifiedAt: 2 }, { type: "edit", text: "c" });
  assert.equal(s.save.phase, "idle");
});

test("a failed save keeps the text and the base, and says why", () => {
  const s = run(initDraft(disk("one")), { type: "edit", text: "mine" }, { type: "saveStarted" }, { type: "failed", message: "No." });
  assert.equal(s.draft, "mine");
  assert.equal(s.base.text, "one");
  assert.deepEqual(s.save, { phase: "failed", message: "No." });
  assert.equal(isDirty(s), true);
  // Editing on does not hide the failure.
  assert.equal(run(s, { type: "edit", text: "mine!" }).save.phase, "failed");
});

test("a conflict never touches the text; the disk version arrives after", () => {
  let s = run(initDraft(disk("one")), { type: "edit", text: "mine" }, { type: "saveStarted" }, { type: "conflict", reason: "conflict", message: "Changed." });
  assert.equal(s.draft, "mine");
  assert.equal(s.base.text, "one", "base is not moved: the next save still has to pass the check");
  assert.equal(s.save.phase === "conflict" && s.save.disk.status, "loading");
  s = run(s, { type: "diskLoaded", disk: disk("theirs", 300) });
  assert.equal(s.draft, "mine");
  assert.deepEqual(s.save.phase === "conflict" && s.save.disk, { status: "ready", exists: true, text: "theirs", modifiedAt: 300 });
});

test("a conflict where the disk text equals mine is not a conflict", () => {
  const s = run(
    initDraft(disk("one")),
    { type: "edit", text: "same" },
    { type: "conflict", reason: "conflict", message: "" },
    { type: "diskLoaded", disk: disk("same", 300) },
  );
  assert.equal(isDirty(s), false);
  assert.equal(s.base.modifiedAt, 300);
  assert.equal(s.save.phase, "saved");
});

test("'Use the file on disk' replaces the editor only after the disk version is in hand", () => {
  const conflict = run(initDraft(disk("one")), { type: "edit", text: "mine" }, { type: "conflict", reason: "conflict", message: "" });
  const early = run(conflict, { type: "useDisk" });
  assert.equal(early.draft, "mine", "nothing to adopt yet");
  const s = run(conflict, { type: "diskLoaded", disk: disk("theirs", 300) }, { type: "useDisk" });
  assert.equal(s.draft, "theirs");
  assert.equal(s.base.modifiedAt, 300);
  assert.equal(s.save.phase, "idle");
});

test("the disk version failing to load leaves both choices that need it unavailable, and the text alone", () => {
  const s = run(initDraft(disk("one")), { type: "edit", text: "mine" }, { type: "conflict", reason: "conflict", message: "" }, { type: "diskFailed" });
  assert.equal(s.save.phase === "conflict" && s.save.disk.status, "failed");
  assert.equal(run(s, { type: "useDisk" }).draft, "mine");
  assert.equal(run(s, { type: "diskLoading" }).save.phase === "conflict" && run(s, { type: "diskLoading" }).save.phase, "conflict");
});

test("a file deleted on disk: using the disk version means an empty, missing file", () => {
  const s = run(
    initDraft(disk("one")),
    { type: "edit", text: "mine" },
    { type: "conflict", reason: "missing", message: "Deleted." },
    { type: "diskLoaded", disk: { exists: false, text: "", modifiedAt: null } },
  );
  assert.equal(s.save.phase === "conflict" && s.save.disk.status === "ready" && s.save.disk.exists, false);
  const adopted = run(s, { type: "useDisk" });
  assert.deepEqual(adopted.base, { exists: false, text: "", modifiedAt: null });
});

test("dismissing a conflict keeps the text and the stale base, so a second save conflicts again", () => {
  const s = run(initDraft(disk("one", 100)), { type: "edit", text: "mine" }, { type: "conflict", reason: "conflict", message: "" }, { type: "dismiss" });
  assert.equal(s.draft, "mine");
  assert.equal(s.base.modifiedAt, 100);
  assert.equal(s.save.phase, "idle");
});

test("a file that moves on while nothing is edited is picked up; one being edited is not", () => {
  const clean = run(initDraft(disk("one", 100)), { type: "external", disk: disk("newer", 200) });
  assert.equal(clean.draft, "newer");
  assert.equal(clean.base.modifiedAt, 200);

  const dirty = run(initDraft(disk("one", 100)), { type: "edit", text: "mine" }, { type: "external", disk: disk("newer", 200) });
  assert.equal(dirty.draft, "mine");
  assert.equal(dirty.base.text, "one");

  const same = initDraft(disk("one", 100));
  assert.equal(run(same, { type: "external", disk: disk("one", 100) }), same, "no change, no new state");
});

test("an external change never lands in the middle of a save or a conflict", () => {
  const saving = run(initDraft(disk("one")), { type: "saveStarted" });
  assert.equal(run(saving, { type: "external", disk: disk("x", 999) }), saving);
  const conflict = run(initDraft(disk("one")), { type: "edit", text: "mine" }, { type: "conflict", reason: "conflict", message: "" });
  assert.equal(run(conflict, { type: "external", disk: disk("x", 999) }), conflict);
});

test("interpretSave: saved, conflict, missing, and every other failure", () => {
  assert.deepEqual(interpretSave(200, { ok: true, modifiedAt: 5 }), { kind: "saved", modifiedAt: 5 });
  assert.deepEqual(interpretSave(409, { ok: false, reason: "conflict", modifiedAt: 9, message: "m" }), { kind: "conflict", reason: "conflict", message: "m" });
  assert.equal(interpretSave(409, { ok: false, reason: "missing", modifiedAt: null, message: "gone" }).kind, "conflict");
  for (const status of [400, 403, 413, 415, 500, 502]) {
    const r = interpretSave(status, { error: "why" });
    assert.equal(r.kind, "failed", String(status));
    assert.ok(r.kind === "failed" && r.message.length > 0);
  }
  assert.equal(interpretSave(500, null).kind, "failed");
  assert.equal(interpretSave(200, {}).kind, "failed", "a 200 that does not say ok is not a save");
  assert.equal(interpretSave(409, {}).kind, "failed", "a 409 we cannot read is not shown as a conflict with nothing to compare");
});
