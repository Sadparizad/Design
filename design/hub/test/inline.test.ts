import assert from "node:assert/strict";
import { test } from "node:test";
import { tokenizeInline } from "../src/lib/inline.ts";

test("plain text is one token; empty is none", () => {
  assert.deepEqual(tokenizeInline("Paid today"), [{ type: "text", text: "Paid today" }]);
  assert.deepEqual(tokenizeInline(""), []);
});

test("code, bold and a link, with the text around them kept", () => {
  assert.deepEqual(tokenizeInline("Use `bnpl.receipt.fee` and **never** [the doc](https://a.example/x) ok"), [
    { type: "text", text: "Use " },
    { type: "code", text: "bnpl.receipt.fee" },
    { type: "text", text: " and " },
    { type: "bold", text: "never" },
    { type: "text", text: " " },
    { type: "link", text: "the doc", href: "https://a.example/x" },
    { type: "text", text: " ok" },
  ]);
});

test("only http(s) links are links; an unclosed mark is just text", () => {
  assert.deepEqual(tokenizeInline("[x](javascript:alert(1))"), [
    { type: "text", text: "[x](javascript:alert(1))" },
  ]);
  assert.deepEqual(tokenizeInline("a `b and **c"), [{ type: "text", text: "a `b and **c" }]);
});

test("the placeholder in angle brackets stays text", () => {
  assert.deepEqual(tokenizeInline("As a <user>, I want <action>"), [
    { type: "text", text: "As a <user>, I want <action>" },
  ]);
});
