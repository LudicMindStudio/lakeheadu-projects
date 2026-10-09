// The app's server: plain node:http, no dependencies. It serves the built
// app, a small JSON API over the entries store, and the admin routes behind
// a single-password login.
//
//   npm run serve          (optionally with PORT and SERVICES_ADMIN_PASSWORD)
//
// Static hosting stays a first-class mode: the app falls back to the bundled
// sample dataset whenever this server is not there.

import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createAuth, parseCookies } from "./auth.js";
import { createStore, validateEntry } from "./store.js";
import { slugify } from "../src/lib/slug.js";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const APP_ROOT = path.resolve(HERE, "..");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
  ".map": "application/json; charset=utf-8",
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function createAppServer({
  distDir = path.join(APP_ROOT, "dist"),
  dataFile = process.env.SERVICES_DATA_FILE ||
    path.join(APP_ROOT, "server", "data", "entries.json"),
  password = process.env.SERVICES_ADMIN_PASSWORD ?? "",
} = {}) {
  const store = createStore({ file: dataFile });
  const auth = createAuth({ password });
  const failures = new Map(); // remote address to failed attempt count

  const json = (res, status, body, headers = {}) => {
    res.writeHead(status, {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...headers,
    });
    res.end(JSON.stringify(body));
  };

  const readBody = (req) =>
    new Promise((resolve, reject) => {
      const chunks = [];
      let size = 0;
      req.on("data", (chunk) => {
        size += chunk.length;
        if (size > 200_000) {
          reject(new Error("body too large"));
          req.destroy();
          return;
        }
        chunks.push(chunk);
      });
      req.on("end", () => {
        try {
          resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString("utf8")) : {});
        } catch {
          reject(new Error("bad json"));
        }
      });
      req.on("error", reject);
    });

  const isAdmin = (req) => auth.verify(parseCookies(req.headers.cookie)[auth.COOKIE_NAME]);

  const sendFile = (req, res, file, { cache }) => {
    let stat;
    try {
      stat = fs.statSync(file);
    } catch {
      res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      res.end("Not found");
      return;
    }
    res.writeHead(200, {
      "content-type": MIME[path.extname(file).toLowerCase()] ?? "application/octet-stream",
      "content-length": stat.size,
      "cache-control": cache,
    });
    if (req.method === "HEAD") {
      res.end();
      return;
    }
    fs.createReadStream(file).pipe(res);
  };

  const notFound = (res) => {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end("Not found");
  };

  const serveStatic = (req, res, pathname) => {
    const relative = pathname.replace(/^\/+/, "") || "index.html";
    const resolved = path.resolve(distDir, relative);
    const withinDist = resolved === distDir || resolved.startsWith(distDir + path.sep);
    if (!withinDist) {
      notFound(res);
      return;
    }
    const cache = /^(assets|fonts)\//.test(relative)
      ? "public, max-age=31536000, immutable"
      : "no-cache";
    if (fs.existsSync(resolved) && fs.statSync(resolved).isFile()) {
      sendFile(req, res, resolved, { cache });
      return;
    }
    // SPA routes fall back to the app shell. Missing files do not.
    if (path.extname(relative)) {
      notFound(res);
      return;
    }
    const index = path.join(distDir, "index.html");
    if (!fs.existsSync(index)) {
      res.writeHead(503, { "content-type": "text/plain; charset=utf-8" });
      res.end("Build the app first: npm run build");
      return;
    }
    sendFile(req, res, index, { cache: "no-cache" });
  };

  const server = http.createServer(async (req, res) => {
    let pathname;
    try {
      pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    } catch {
      json(res, 400, { error: "bad-request" });
      return;
    }

    try {
      // ----- public API -----
      if (pathname === "/api/entries" && req.method === "GET") {
        json(res, 200, { entries: store.list() });
        return;
      }

      // ----- session -----
      if (pathname === "/api/session") {
        if (req.method === "GET") {
          json(res, 200, { enabled: auth.enabled, admin: isAdmin(req) });
          return;
        }
        if (req.method === "POST") {
          if (!auth.enabled) {
            json(res, 403, { error: "not-enabled" });
            return;
          }
          const body = await readBody(req);
          const address = req.socket.remoteAddress ?? "unknown";
          if (!auth.checkPassword(body?.password)) {
            const count = (failures.get(address) ?? 0) + 1;
            failures.set(address, count);
            await delay(Math.min(2000, 250 * count));
            json(res, 401, { error: "bad-password" });
            return;
          }
          failures.delete(address);
          json(
            res,
            200,
            { admin: true },
            { "set-cookie": auth.cookie(auth.issue(), { maxAge: auth.SESSION_SECONDS }) },
          );
          return;
        }
        if (req.method === "DELETE") {
          json(res, 200, { admin: false }, { "set-cookie": auth.cookie("", { maxAge: 0 }) });
          return;
        }
        json(res, 405, { error: "method" });
        return;
      }

      // ----- admin: entries -----
      if (pathname === "/api/entries" && req.method === "POST") {
        if (!isAdmin(req)) {
          json(res, 401, { error: "unauthorized" });
          return;
        }
        const body = await readBody(req);
        const candidate = slugify(body?.slug || body?.program || "");
        if (candidate && store.get(candidate)) {
          json(res, 409, { errors: { slug: "Already used by another entry." } });
          return;
        }
        const result = validateEntry(body);
        if (result.errors) {
          json(res, 422, { errors: result.errors });
          return;
        }
        json(res, 201, { entry: store.add(result.entry) });
        return;
      }

      const entryMatch = pathname.match(/^\/api\/entries\/([^/]+)$/);
      if (entryMatch) {
        const slug = slugify(entryMatch[1]);
        if (req.method === "PUT") {
          if (!isAdmin(req)) {
            json(res, 401, { error: "unauthorized" });
            return;
          }
          if (!store.get(slug)) {
            json(res, 404, { error: "missing" });
            return;
          }
          const body = await readBody(req);
          const result = validateEntry({ ...(body ?? {}), slug });
          if (result.errors) {
            json(res, 422, { errors: result.errors });
            return;
          }
          json(res, 200, { entry: store.update(slug, result.entry) });
          return;
        }
        if (req.method === "DELETE") {
          if (!isAdmin(req)) {
            json(res, 401, { error: "unauthorized" });
            return;
          }
          const removed = store.remove(slug);
          json(res, removed ? 200 : 404, removed ? { ok: true } : { error: "missing" });
          return;
        }
        json(res, 405, { error: "method" });
        return;
      }

      if (pathname.startsWith("/api/")) {
        json(res, 404, { error: "not-found" });
        return;
      }

      // ----- static app -----
      if (req.method !== "GET" && req.method !== "HEAD") {
        json(res, 405, { error: "method" });
        return;
      }
      serveStatic(req, res, pathname);
    } catch {
      json(res, 400, { error: "bad-request" });
    }
  });

  return server;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  const port = Number(process.env.PORT ?? 5175);
  const server = createAppServer();
  server.listen(port, "127.0.0.1", () => {
    const editor = (process.env.SERVICES_ADMIN_PASSWORD ?? "").length > 0;
    console.log(`services: http://127.0.0.1:${port}`);
    console.log(
      editor
        ? "services: admin editor enabled"
        : "services: admin editor off (set SERVICES_ADMIN_PASSWORD to enable)",
    );
  });
}
