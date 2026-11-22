/**
 * JSON API over the data layer. Plain Node req/res, no framework, and no knowledge of
 * Vite, so the same handler can serve a future production server.
 */
import type { IncomingMessage, ServerResponse } from "node:http";
import { PathError } from "../data/root.ts";
import type { DataLayer, DocumentKind } from "../data/types.ts";

const MAX_BODY_BYTES = 5 * 1024 * 1024;

type Next = (err?: unknown) => void;

class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}

function send(res: ServerResponse, status: number, body: unknown): void {
  const text = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Content-Length": Buffer.byteLength(text),
  });
  res.end(text);
}

async function readBody(req: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    size += (chunk as Buffer).length;
    if (size > MAX_BODY_BYTES) throw new HttpError(413, "That file is too large to save.");
    chunks.push(chunk as Buffer);
  }
  return Buffer.concat(chunks).toString("utf8");
}

/** A page on another site must not be able to write files through this local server. */
function assertSameOrigin(req: IncomingMessage): void {
  const origin = req.headers.origin;
  if (origin && new URL(origin).host !== req.headers.host) {
    throw new HttpError(403, "Requests from other sites are not allowed.");
  }
}

export function createApiHandler(data: DataLayer) {
  async function route(req: IncomingMessage, res: ServerResponse, url: URL): Promise<void> {
    const method = req.method ?? "GET";
    const p = url.pathname;

    if (method === "GET" && p === "/api/status") return send(res, 200, await data.repoStatus());
    if (method === "GET" && p === "/api/features") return send(res, 200, await data.listFeatures());

    if (method === "GET" && p === "/api/documents") {
      const kind = url.searchParams.get("kind");
      if (kind !== "files" && kind !== "skills") {
        throw new HttpError(400, 'kind must be "files" or "skills".');
      }
      return send(res, 200, await data.listDocuments(kind as DocumentKind));
    }

    if (method === "GET" && p === "/api/document") {
      return send(res, 200, await data.readDocument(url.searchParams.get("path") ?? ""));
    }

    if (method === "PUT" && p === "/api/document") {
      assertSameOrigin(req);
      if (!/^application\/json\b/i.test(req.headers["content-type"] ?? "")) {
        throw new HttpError(415, "Send the file as JSON.");
      }
      let body: { path?: unknown; content?: unknown; loadedAt?: unknown };
      try {
        body = JSON.parse(await readBody(req));
      } catch (err) {
        if (err instanceof HttpError) throw err;
        throw new HttpError(400, "The request was not valid JSON.");
      }
      const { path, content, loadedAt } = body ?? {};
      if (
        typeof path !== "string" ||
        typeof content !== "string" ||
        !(loadedAt === null || typeof loadedAt === "number")
      ) {
        throw new HttpError(400, "Expected { path: string, content: string, loadedAt: number | null }.");
      }
      const result = await data.writeDocument(path, content, loadedAt);
      return send(res, result.ok ? 200 : 409, result);
    }

    const feature = /^\/api\/feature\/([^/]+)$/.exec(p);
    if (method === "GET" && feature) {
      return send(res, 200, await data.readFeature(decodeURIComponent(feature[1])));
    }

    throw new HttpError(404, "Not found.");
  }

  return function apiMiddleware(req: IncomingMessage, res: ServerResponse, next: Next): void {
    const url = new URL(req.url ?? "/", "http://localhost");
    if (!url.pathname.startsWith("/api/")) return next();
    route(req, res, url).catch((err: unknown) => {
      if (err instanceof HttpError) return send(res, err.status, { error: err.message });
      if (err instanceof PathError) return send(res, 403, { error: err.message });
      if (err instanceof TypeError) return send(res, 400, { error: err.message });
      return send(res, 500, { error: "Something went wrong reading or saving the file." });
    });
  };
}
