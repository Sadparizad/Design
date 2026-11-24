/**
 * Serves a variant's prototype as a page of its own, at /prototype/<feature>/<variant>/.
 * The files come from features/<feature>/design/prototype/<variant>/. Nothing outside that
 * folder can be reached. Plain Node req/res, like the API handler.
 */
import fs from "node:fs/promises";
import type { IncomingMessage, ServerResponse } from "node:http";
import path from "node:path";

const TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".txt": "text/plain; charset=utf-8",
};

type Next = (err?: unknown) => void;

function page(res: ServerResponse, status: number, title: string, text: string): void {
  const body =
    `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">` +
    `<title>${title}</title><body style="margin:0;display:grid;place-items:center;min-height:100vh;` +
    `font:16px/1.5 system-ui,sans-serif;color:#555"><p>${text}</p>`;
  res.writeHead(status, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
  res.end(body);
}

/** A path segment that is safe to join: no separators, no "..", not hidden. */
function safeSegment(s: string): boolean {
  return s !== "" && s !== "." && s !== ".." && !s.startsWith(".") && !/[\\/\0]/.test(s);
}

export function createPrototypeHandler(designRoot: string) {
  const root = path.resolve(designRoot);

  return async function handler(req: IncomingMessage, res: ServerResponse, next: Next) {
    const url = new URL(req.url ?? "/", "http://x");
    const m = /^\/prototype\/(.*)$/.exec(url.pathname);
    if (!m) return next();
    if (req.method !== "GET" && req.method !== "HEAD") {
      res.writeHead(405, { Allow: "GET, HEAD" });
      return void res.end();
    }

    let parts: string[];
    try {
      parts = m[1].split("/").map(decodeURIComponent);
    } catch {
      return page(res, 400, "Bad address", "That address is not valid.");
    }
    const [feature, variant, ...rest] = parts;
    if (!feature || !variant) return page(res, 404, "Not found", "There is no prototype at this address.");

    // The variant's own page lives at a folder address; relative links in it need the slash.
    if (rest.length === 0) {
      res.writeHead(302, { Location: `${url.pathname}/${url.search}` });
      return void res.end();
    }
    if (rest[rest.length - 1] === "") rest[rest.length - 1] = "index.html";
    if (![feature, variant, ...rest].every(safeSegment)) {
      return page(res, 404, "Not found", "There is no prototype at this address.");
    }

    const dir = path.join(root, "features", feature, "design", "prototype", variant);
    const file = path.join(dir, ...rest);
    try {
      // Resolve links too, so a symlink cannot lead out of the variant's folder.
      const real = await fs.realpath(file);
      const realDir = await fs.realpath(dir);
      if (!real.startsWith(realDir + path.sep)) throw new Error("outside");
      const stat = await fs.stat(real);
      if (!stat.isFile()) throw new Error("not a file");
      res.writeHead(200, {
        "Content-Type": TYPES[path.extname(real).toLowerCase()] ?? "application/octet-stream",
        "Content-Length": stat.size,
        "Cache-Control": "no-store",
      });
      if (req.method === "HEAD") return void res.end();
      res.end(await fs.readFile(real));
    } catch {
      page(
        res,
        404,
        "Not built yet",
        rest.join("/") === "index.html"
          ? `Variant ${variant.replace(/[<>&"]/g, "")} has no prototype yet.`
          : "There is no such file in this prototype.",
      );
    }
  };
}
