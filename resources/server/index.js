// The resources management server: the built app, a small JSON API, and the admin session. No dependencies.

import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import {
  copyFileSync,
  createReadStream,
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { createServer as createHttpServer } from "node:http";
import { dirname, extname, join, normalize, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const SERVER_DIR = dirname(fileURLToPath(import.meta.url));
const DEFAULT_DATA_FILE = join(SERVER_DIR, "data", "entries.json");
const DEFAULT_SEED_FILE = join(SERVER_DIR, "..", "src", "data", "entries.json");
const DEFAULT_STATIC_DIR = join(SERVER_DIR, "..", "dist");
const DEFAULT_UPLOADS_DIR = join(SERVER_DIR, "uploads");

const SESSION_COOKIE = "resources_session";
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

const FORMATS = [
  "library",
  "lesson-plan",
  "video",
  "podcast",
  "organization-website",
  "article-nonresearch",
  "article-research",
  "tool",
  "app",
];
const COLLECTIONS = ["our-library", "mhcc-directory", "mindapps"];
const AGE_GROUPS = ["all-ages", "under-18", "18-65", "65-plus"];

const CONTENT_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".pdf": "application/pdf",
  ".txt": "text/plain; charset=utf-8",
};

const UPLOAD_TYPES = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "video/mp4": ".mp4",
  "video/webm": ".webm",
};

function send(res, status, data, headers = {}) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(body),
    ...headers,
  });
  res.end(body);
}

function readBody(req, limit = 1_000_000) {
  return new Promise((ok, fail) => {
    let size = 0;
    const chunks = [];
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > limit) {
        fail(new Error("too large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => ok(Buffer.concat(chunks).toString("utf8")));
    req.on("error", fail);
  });
}

// The same read, kept as bytes, for uploaded files.
function readBodyBuffer(req, limit = 16_000_000) {
  return new Promise((ok, fail) => {
    let size = 0;
    const chunks = [];
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > limit) {
        fail(new Error("too large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => ok(Buffer.concat(chunks)));
    req.on("error", fail);
  });
}

// A safe stored name for an upload: the file's own name, slugged, plus a
// short unique tail so repeats never collide.
function uploadName(headerName, ext) {
  const base =
    String(headerName ?? "")
      .toLowerCase()
      .replace(/\.[a-z0-9]+$/, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "upload";
  return `${base}-${Date.now().toString(36)}-${randomBytes(3).toString("hex")}${ext}`;
}

function parseCookies(header) {
  const out = {};
  if (!header) return out;
  for (const part of header.split(";")) {
    const index = part.indexOf("=");
    if (index === -1) continue;
    out[part.slice(0, index).trim()] = part.slice(index + 1).trim();
  }
  return out;
}

// A JSON file written through with an atomic swap and one backup generation.
function createStore({ dataFile = DEFAULT_DATA_FILE, seedFile = DEFAULT_SEED_FILE } = {}) {
  function write(entries) {
    mkdirSync(dirname(dataFile), { recursive: true });
    const tempFile = `${dataFile}.tmp-${process.pid}`;
    writeFileSync(tempFile, `${JSON.stringify(entries, null, 2)}\n`);
    if (existsSync(dataFile)) copyFileSync(dataFile, `${dataFile}.bak`);
    renameSync(tempFile, dataFile);
  }

  function ensure() {
    if (existsSync(dataFile)) return;
    const seed = JSON.parse(readFileSync(seedFile, "utf8"));
    if (!Array.isArray(seed)) throw new Error("Seed data must be an array of entries.");
    write(seed);
  }

  function read() {
    ensure();
    const entries = JSON.parse(readFileSync(dataFile, "utf8"));
    if (!Array.isArray(entries)) throw new Error("Stored data must be an array of entries.");
    return entries;
  }

  return { read, write };
}

function createSessions(secret) {
  const key = secret ?? randomBytes(32).toString("hex");

  const sign = (value) => createHmac("sha256", key).update(value).digest("hex");

  return {
    issue() {
      const payload = Buffer.from(JSON.stringify({ exp: Date.now() + SESSION_TTL_MS })).toString(
        "base64url",
      );
      return `${payload}.${sign(payload)}`;
    },
    verify(token) {
      if (typeof token !== "string") return false;
      const dot = token.lastIndexOf(".");
      if (dot < 1) return false;
      const payload = token.slice(0, dot);
      const signature = token.slice(dot + 1);
      const expected = sign(payload);
      if (signature.length !== expected.length) return false;
      if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return false;
      try {
        const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
        return typeof data.exp === "number" && data.exp > Date.now();
      } catch {
        return false;
      }
    },
  };
}

function passwordMatches(given, expected) {
  const a = createHash("sha256").update(String(given)).digest();
  const b = createHash("sha256").update(String(expected)).digest();
  return timingSafeEqual(a, b);
}

function cleanDate(value) {
  if (value == null || String(value).trim() === "") return null;
  const text = String(value).trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : undefined;
}

function cleanUrl(value) {
  if (value == null) return null;
  const text = String(value).trim();
  return text === "" ? null : text;
}

function validateEntry(input) {
  if (!input || typeof input !== "object") return { error: "Entry payload must be an object." };
  const entry = {};

  entry.id = String(input.id ?? "").trim();
  if (!/^[a-z0-9][a-z0-9-]*$/.test(entry.id)) {
    return { error: "Id must be a lowercase slug (letters, numbers, and dashes)." };
  }

  entry.title = String(input.title ?? "").trim();
  if (!entry.title) return { error: "Title is required." };

  if (!FORMATS.includes(input.format)) return { error: `Unknown format: ${input.format}` };
  entry.format = input.format;
  if (entry.format === "app") {
    if (!COLLECTIONS.includes(input.collection)) return { error: "App entries need a collection." };
    entry.collection = input.collection;
  } else {
    entry.collection = null;
  }

  entry.source = String(input.source ?? "").trim();
  entry.url = cleanUrl(input.url);

  entry.description = String(input.description ?? "").trim();

  const ages = Array.isArray(input.age_groups)
    ? input.age_groups.filter((key) => AGE_GROUPS.includes(key))
    : [];
  if (ages.length === 0) return { error: "Pick at least one age group." };
  entry.age_groups = [...new Set(ages)];

  entry.tags = Array.isArray(input.tags)
    ? input.tags.map((tag) => String(tag).trim()).filter(Boolean)
    : [];

  const published = cleanDate(input.published_date);
  if (published === undefined) return { error: "Published date must be YYYY-MM-DD or empty." };
  entry.published_date = published;

  const added = cleanDate(input.added_date);
  if (!added) return { error: "Added date must be YYYY-MM-DD." };
  entry.added_date = added;

  if (input.banner == null) {
    entry.banner = null;
  } else {
    const banner = input.banner;
    if (!["image", "video"].includes(banner.kind)) {
      return { error: "Banner kind must be image or video." };
    }
    const src = String(banner.src ?? "").trim();
    if (!src) return { error: "Banner needs a source path." };
    entry.banner = { kind: banner.kind, src, alt: String(banner.alt ?? "").trim() };
    if (banner.kind === "video") {
      const poster = String(banner.poster ?? "").trim();
      if (poster) entry.banner.poster = poster;
    }
  }

  if (input.embeds == null) {
    entry.embeds = [];
  } else {
    if (!Array.isArray(input.embeds)) return { error: "Embeds must be a list." };
    if (input.embeds.length > 20) return { error: "Too many media items (max 20)." };
    entry.embeds = [];
    for (const item of input.embeds) {
      if (!item || typeof item !== "object") return { error: "Each media item must be an object." };
      if (!["video", "pdf"].includes(item.kind)) {
        return { error: "Media kind must be video or pdf." };
      }
      const url = String(item.url ?? "").trim();
      if (!url) return { error: "Each media item needs a link." };
      entry.embeds.push({ kind: item.kind, url, title: String(item.title ?? "").trim() });
    }
  }

  return { entry };
}

// The request handler. Options make it testable. Without options, everything comes from the environment.
export function createServer(options = {}) {
  const store = createStore(options);
  const sessions = createSessions(options.sessionSecret ?? process.env.SESSION_SECRET);
  const password = options.password ?? process.env.ADMIN_PASSWORD ?? "";
  const staticDir = options.staticDir ?? DEFAULT_STATIC_DIR;
  const uploadsDir = options.uploadsDir ?? process.env.UPLOADS_DIR ?? DEFAULT_UPLOADS_DIR;
  const log = options.log ?? ((...args) => console.error(...args));

  function authed(req) {
    const cookies = parseCookies(req.headers.cookie);
    return sessions.verify(cookies[SESSION_COOKIE]);
  }

  function serveFile(req, res, filePath) {
    const type = CONTENT_TYPES[extname(filePath).toLowerCase()] ?? "application/octet-stream";
    const size = statSync(filePath).size;
    const range = req.headers.range;

    if (range) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(String(range).trim());
      if (match) {
        let start = match[1] === "" ? null : Number(match[1]);
        let end = match[2] === "" ? null : Number(match[2]);
        if (start === null && end !== null) {
          start = Math.max(0, size - end);
          end = size - 1;
        }
        if (end === null || end >= size) end = size - 1;
        if (start !== null && start <= end) {
          res.writeHead(206, {
            "content-type": type,
            "accept-ranges": "bytes",
            "content-range": `bytes ${start}-${end}/${size}`,
            "content-length": end - start + 1,
          });
          if (req.method === "HEAD") {
            res.end();
            return;
          }
          createReadStream(filePath, { start, end }).pipe(res);
          return;
        }
      }
    }

    res.writeHead(200, {
      "content-type": type,
      "content-length": size,
      "accept-ranges": "bytes",
      "cache-control": extname(filePath) === ".html" ? "no-cache" : "public, max-age=3600",
    });
    if (req.method === "HEAD") {
      res.end();
      return;
    }
    createReadStream(filePath).pipe(res);
  }

  async function handle(req, res) {
    const url = new URL(req.url ?? "/", "http://localhost");
    const pathname = decodeURIComponent(url.pathname);

    // API

    if (pathname === "/api/entries" && req.method === "GET") {
      send(res, 200, { entries: store.read() });
      return;
    }

    if (pathname === "/api/auth/status" && req.method === "GET") {
      send(res, 200, { authed: authed(req), configured: password !== "" });
      return;
    }

    if (pathname === "/api/auth/login" && req.method === "POST") {
      if (password === "") {
        send(res, 503, { error: "The server has no admin password set." });
        return;
      }
      let payload;
      try {
        payload = JSON.parse(await readBody(req));
      } catch {
        send(res, 400, { error: "Invalid request body." });
        return;
      }
      if (!passwordMatches(payload.password ?? "", password)) {
        send(res, 401, { error: "That password is not correct." });
        return;
      }
      send(
        res,
        200,
        { ok: true },
        {
          "set-cookie": `${SESSION_COOKIE}=${sessions.issue()}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}`,
        },
      );
      return;
    }

    if (pathname === "/api/auth/logout" && req.method === "POST") {
      send(
        res,
        200,
        { ok: true },
        {
          "set-cookie": `${SESSION_COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`,
        },
      );
      return;
    }

    // Uploads: an image or video file straight in the body, stored on disk,
    // and answered with the path the entry's media fields can use.
    if (pathname === "/api/uploads" && req.method === "POST") {
      if (!authed(req)) {
        send(res, 401, { error: "Sign in required." });
        return;
      }
      const type = String(req.headers["content-type"] ?? "")
        .split(";")[0]
        .trim()
        .toLowerCase();
      const ext = UPLOAD_TYPES[type];
      if (!ext) {
        send(res, 415, {
          error: "Upload an image or video file (jpg, png, webp, gif, mp4, or webm).",
        });
        return;
      }
      let body;
      try {
        body = await readBodyBuffer(req);
      } catch {
        send(res, 413, { error: "That file is too large (16 MB maximum)." });
        return;
      }
      if (body.length === 0) {
        send(res, 400, { error: "The file was empty." });
        return;
      }
      mkdirSync(uploadsDir, { recursive: true });
      const name = uploadName(req.headers["x-file-name"], ext);
      writeFileSync(join(uploadsDir, name), body);
      send(res, 201, { src: `/uploads/${name}` });
      return;
    }

    if (pathname === "/api/entries" && req.method === "POST") {
      if (!authed(req)) {
        send(res, 401, { error: "Sign in required." });
        return;
      }
      if (!String(req.headers["content-type"] ?? "").includes("application/json")) {
        send(res, 415, { error: "Expected application/json." });
        return;
      }
      let payload;
      try {
        payload = JSON.parse(await readBody(req));
      } catch {
        send(res, 400, { error: "Invalid request body." });
        return;
      }
      const { entry, error } = validateEntry(payload);
      if (error) {
        send(res, 400, { error });
        return;
      }
      const entries = store.read();
      if (entries.some((item) => item.id === entry.id)) {
        send(res, 409, { error: "An entry with that id already exists." });
        return;
      }
      entry.updated_date = new Date().toISOString().slice(0, 10);
      entries.push(entry);
      store.write(entries);
      send(res, 201, { entry });
      return;
    }

    const entryMatch = pathname.match(/^\/api\/entries\/([a-z0-9-]+)$/);
    if (entryMatch && (req.method === "PUT" || req.method === "DELETE")) {
      if (!authed(req)) {
        send(res, 401, { error: "Sign in required." });
        return;
      }
      const id = entryMatch[1];
      const entries = store.read();
      const index = entries.findIndex((item) => item.id === id);
      if (index === -1) {
        send(res, 404, { error: "No entry with that id." });
        return;
      }

      if (req.method === "DELETE") {
        entries.splice(index, 1);
        store.write(entries);
        send(res, 200, { ok: true });
        return;
      }

      if (!String(req.headers["content-type"] ?? "").includes("application/json")) {
        send(res, 415, { error: "Expected application/json." });
        return;
      }
      let payload;
      try {
        payload = JSON.parse(await readBody(req));
      } catch {
        send(res, 400, { error: "Invalid request body." });
        return;
      }
      const { entry, error } = validateEntry(payload);
      if (error) {
        send(res, 400, { error });
        return;
      }
      if (entry.id !== id) {
        send(res, 400, { error: "An entry id cannot change." });
        return;
      }
      entry.updated_date = new Date().toISOString().slice(0, 10);
      entries[index] = entry;
      store.write(entries);
      send(res, 200, { entry });
      return;
    }

    if (pathname.startsWith("/api/")) {
      send(res, 404, { error: "Not found." });
      return;
    }

    // Static files

    if (req.method === "GET" || req.method === "HEAD") {
      if (pathname.startsWith("/uploads/")) {
        const relative = pathname.slice("/uploads/".length);
        const filePath = normalize(join(uploadsDir, relative));
        if (
          filePath.startsWith(uploadsDir + sep) &&
          existsSync(filePath) &&
          statSync(filePath).isFile()
        ) {
          serveFile(req, res, filePath);
          return;
        }
        res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
        res.end("Not found.");
        return;
      }

      if (!existsSync(staticDir)) {
        res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
        res.end("Not built yet. Run npm run build, then start the server again.");
        return;
      }

      const relative = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
      const filePath = normalize(join(staticDir, relative));
      if (
        filePath.startsWith(staticDir + sep) &&
        existsSync(filePath) &&
        statSync(filePath).isFile()
      ) {
        serveFile(req, res, filePath);
        return;
      }

      const shell = join(staticDir, "index.html");
      if (existsSync(shell)) {
        serveFile(req, res, shell);
        return;
      }
    }

    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end("Not found.");
  }

  const server = createHttpServer((req, res) => {
    handle(req, res).catch((err) => {
      log("resources server error:", err);
      if (!res.headersSent) {
        send(res, 500, { error: "Something went wrong." });
      } else {
        res.end();
      }
    });
  });

  return server;
}

function main() {
  const port = Number(process.env.PORT ?? 5210);
  const host = process.env.HOST ?? "127.0.0.1";
  const server = createServer({ dataFile: process.env.DATA_FILE });
  server.listen(port, host, () => {
    console.log(`Resources server listening on http://${host}:${port}`);
    if (!process.env.ADMIN_PASSWORD) {
      console.log("ADMIN_PASSWORD is not set, so signing in is disabled.");
    }
  });
}

const isDirectRun = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirectRun) main();
