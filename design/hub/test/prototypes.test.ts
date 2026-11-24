import assert from "node:assert/strict";
import fs from "node:fs/promises";
import http from "node:http";
import type { AddressInfo } from "node:net";
import path from "node:path";
import { after, before, test } from "node:test";
import { createDataLayer } from "../src/data/index.ts";
import { createPrototypeHandler } from "../src/server/prototypes.ts";
import { cleanUp, makeDesignRoot } from "./helpers.ts";

let server: http.Server;
let base = "";
let root = "";

before(async () => {
  root = await makeDesignRoot({
    "features/f/spec.md": "# F\n",
    "features/f/design/prototype/A/index.html": "<p>variant a</p>",
    "features/f/design/prototype/A/app.js": "console.log(1)",
    "features/f/design/prototype/B/notes.txt": "no index here",
    "features/secret.txt": "top secret",
  });
  await fs.symlink(path.join(root, "features/secret.txt"), path.join(root, "features/f/design/prototype/A/leak.txt"));
  const handler = createPrototypeHandler(root);
  server = http.createServer((req, res) => {
    void handler(req, res, () => {
      res.statusCode = 200;
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

test("readFeature lists the variants that have an index.html", async () => {
  const f = await createDataLayer(root).readFeature("f");
  assert.deepEqual(f.prototypes, ["A"]);
});

test("a variant opens as a page of its own, and its files load", async () => {
  const page = await fetch(`${base}/prototype/f/A/`);
  assert.equal(page.status, 200);
  assert.match(page.headers.get("content-type") ?? "", /^text\/html/);
  assert.equal(await page.text(), "<p>variant a</p>");
  const js = await fetch(`${base}/prototype/f/A/app.js`);
  assert.match(js.headers.get("content-type") ?? "", /javascript/);
});

test("the address without a closing slash redirects to the one with it", async () => {
  const res = await fetch(`${base}/prototype/f/A`, { redirect: "manual" });
  assert.equal(res.status, 302);
  assert.equal(res.headers.get("location"), "/prototype/f/A/");
});

test("a variant with no index.html says it is not built, and other paths pass through", async () => {
  assert.equal((await fetch(`${base}/prototype/f/B/`)).status, 404);
  assert.equal((await fetch(`${base}/prototype/f/Z/`)).status, 404);
  assert.equal(await (await fetch(`${base}/api/features`)).text(), "next");
});

test("nothing outside the variant's folder can be read", async () => {
  for (const p of ["/prototype/f/A/..%2f..%2f..%2fsecret.txt", "/prototype/f/A/%2e%2e/x", "/prototype/..%2f/A/", "/prototype/f/A/leak.txt"]) {
    const res = await fetch(`${base}${p}`);
    assert.equal(res.status, 404, p);
    assert.doesNotMatch(await res.text(), /top secret/);
  }
});
