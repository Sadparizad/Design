import assert from "node:assert/strict";
import http from "node:http";
import type { AddressInfo } from "node:net";
import { after, before, test } from "node:test";
import { createDataLayer } from "../src/data/index.ts";
import { createApiHandler } from "../src/server/api.ts";
import { cleanUp, makeDesignRoot } from "./helpers.ts";

let server: http.Server;
let base = "";
let root = "";

before(async () => {
  root = await makeDesignRoot({ "product/product.md": "# Acme\n" });
  const handler = createApiHandler(createDataLayer(root));
  server = http.createServer((req, res) => {
    handler(req, res, () => {
      res.statusCode = 404;
      res.end("next");
    });
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
after(async () => {
  await new Promise((r) => server.close(r));
  await cleanUp(root);
});

const put = (body: unknown, headers: Record<string, string> = {}) =>
  fetch(`${base}/api/document`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });

test("GET routes return empty or stub results, not errors", async () => {
  assert.deepEqual(await (await fetch(`${base}/api/features`)).json(), []);
  assert.deepEqual(await (await fetch(`${base}/api/documents?kind=skills`)).json(), []);
  const missing = await (await fetch(`${base}/api/document?path=nope.md`)).json();
  assert.equal(missing.exists, false);
  const feature = await (await fetch(`${base}/api/feature/nope`)).json();
  assert.equal(feature.exists, false);
  assert.equal((await fetch(`${base}/api/status`)).status, 200);
});

test("bad requests get plain 4xx answers", async () => {
  assert.equal((await fetch(`${base}/api/documents?kind=x`)).status, 400);
  assert.equal((await fetch(`${base}/api/document?path=../x`)).status, 403);
  assert.equal((await fetch(`${base}/api/nothing`)).status, 404);
  assert.equal((await put({ path: "a.md" })).status, 400);
});

test("PUT: save, then a stale save answers 409 with the conflict", async () => {
  const doc = await (await fetch(`${base}/api/document?path=product/product.md`)).json();
  const ok = await put({ path: "product/product.md", content: "# Edited\n", loadedAt: doc.modifiedAt });
  assert.equal(ok.status, 200);
  const stale = await put({ path: "product/product.md", content: "# Stale\n", loadedAt: 1 });
  assert.equal(stale.status, 409);
  assert.equal((await stale.json()).reason, "conflict");
});

test("PUT from another site, or without JSON, is refused", async () => {
  const cross = await put(
    { path: "x.md", content: "x", loadedAt: null },
    { Origin: "https://evil.example" },
  );
  assert.equal(cross.status, 403);
  const plain = await fetch(`${base}/api/document`, {
    method: "PUT",
    headers: { "Content-Type": "text/plain" },
    body: "{}",
  });
  assert.equal(plain.status, 415);
});
