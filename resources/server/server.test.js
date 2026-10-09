// @vitest-environment node
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, expect, test } from "vitest";
import { createServer } from "./index.js";

let server;
let base;
let dir;
let dataFile;

const SEED = [
  {
    id: "one",
    title: "One",
    format: "video",
    collection: null,
    source: "Sample Source",
    url: null,
    description: "First entry.",
    age_groups: ["all-ages"],
    tags: ["topic"],
    published_date: null,
    added_date: "2025-01-01",
    banner: null,
    embed: null,
  },
];

const DRAFT = {
  id: "two",
  title: "Two",
  format: "tool",
  collection: null,
  source: "Sample Source",
  url: null,
  description: "Second entry.",
  age_groups: ["18-65"],
  tags: ["a", "b"],
  published_date: "2025-02-02",
  added_date: "2025-02-02",
  banner: { kind: "image", src: "/media/banners/two.jpg", alt: "Artwork" },
  embed: null,
};

beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), "resources-server-test-"));
  dataFile = join(dir, "data", "entries.json");
  const seedFile = join(dir, "seed.json");
  await writeFile(seedFile, JSON.stringify(SEED));
  const staticDir = join(dir, "static");
  await mkdir(staticDir, { recursive: true });
  await writeFile(join(staticDir, "index.html"), "<!doctype html><title>app</title>");

  server = createServer({
    dataFile,
    seedFile,
    staticDir,
    password: "test-password",
    sessionSecret: "test-secret",
    log: () => {},
  });
  await new Promise((done) => server.listen(0, "127.0.0.1", done));
  base = `http://127.0.0.1:${server.address().port}`;
});

afterAll(async () => {
  await new Promise((done) => server.close(done));
  await rm(dir, { recursive: true, force: true });
});

async function login() {
  const response = await fetch(`${base}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ password: "test-password" }),
  });
  const cookie = (response.headers.getSetCookie?.() ?? [response.headers.get("set-cookie")])
    .map((part) => part.split(";")[0])
    .join("; ");
  return { response, cookie };
}

test("seeds its data file from the shipped data and serves the list", async () => {
  const response = await fetch(`${base}/api/entries`);
  expect(response.status).toBe(200);
  const data = await response.json();
  expect(data.entries.map((entry) => entry.id)).toEqual(["one"]);
  expect(existsSync(dataFile)).toBe(true);
});

test("serves the built app with a shell fallback for deep links", async () => {
  const home = await fetch(`${base}/`);
  expect(home.status).toBe(200);
  expect(home.headers.get("content-type")).toContain("text/html");
  expect(await home.text()).toContain("app");

  const deep = await fetch(`${base}/entry/one`);
  expect(deep.status).toBe(200);
  expect(deep.headers.get("content-type")).toContain("text/html");
});

test("api paths that miss return json, not the shell", async () => {
  const response = await fetch(`${base}/api/nope`);
  expect(response.status).toBe(404);
  expect(response.headers.get("content-type")).toContain("application/json");
});

test("refuses writes without a session", async () => {
  const response = await fetch(`${base}/api/entries`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(DRAFT),
  });
  expect(response.status).toBe(401);
});

test("rejects the wrong password and accepts the right one", async () => {
  const bad = await fetch(`${base}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ password: "nope" }),
  });
  expect(bad.status).toBe(401);

  const { response, cookie } = await login();
  expect(response.status).toBe(200);
  expect(cookie).toContain("resources_session=");

  const status = await fetch(`${base}/api/auth/status`, { headers: { cookie } });
  expect((await status.json()).authed).toBe(true);
});

test("runs the full create, edit, remove round trip", async () => {
  const { cookie } = await login();
  const withSession = {
    headers: { "content-type": "application/json", cookie },
  };

  const created = await fetch(`${base}/api/entries`, {
    method: "POST",
    ...withSession,
    body: JSON.stringify(DRAFT),
  });
  expect(created.status).toBe(201);
  const createdEntry = (await created.json()).entry;
  expect(createdEntry.id).toBe("two");
  expect(createdEntry.updated_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);

  const afterCreate = await (await fetch(`${base}/api/entries`)).json();
  expect(afterCreate.entries.map((entry) => entry.id)).toEqual(["one", "two"]);

  const edited = await fetch(`${base}/api/entries/two`, {
    method: "PUT",
    ...withSession,
    body: JSON.stringify({ ...DRAFT, title: "Two, revised" }),
  });
  expect(edited.status).toBe(200);
  expect((await edited.json()).entry.title).toBe("Two, revised");

  const afterEdit = await (await fetch(`${base}/api/entries`)).json();
  expect(afterEdit.entries.find((entry) => entry.id === "two").title).toBe("Two, revised");

  const removed = await fetch(`${base}/api/entries/two`, { method: "DELETE", headers: { cookie } });
  expect(removed.status).toBe(200);

  const afterRemove = await (await fetch(`${base}/api/entries`)).json();
  expect(afterRemove.entries.map((entry) => entry.id)).toEqual(["one"]);

  // The write-through storage keeps one backup generation.
  expect(existsSync(`${dataFile}.bak`)).toBe(true);
  const stored = JSON.parse(await readFile(dataFile, "utf8"));
  expect(stored.map((entry) => entry.id)).toEqual(["one"]);
});

test("validates entries and refuses duplicates", async () => {
  const { cookie } = await login();
  const withSession = {
    headers: { "content-type": "application/json", cookie },
  };

  const badSlug = await fetch(`${base}/api/entries`, {
    method: "POST",
    ...withSession,
    body: JSON.stringify({ ...DRAFT, id: "Not A Slug!" }),
  });
  expect(badSlug.status).toBe(400);

  const duplicate = await fetch(`${base}/api/entries`, {
    method: "POST",
    ...withSession,
    body: JSON.stringify({ ...DRAFT, id: "one" }),
  });
  expect(duplicate.status).toBe(409);

  const noAges = await fetch(`${base}/api/entries`, {
    method: "POST",
    ...withSession,
    body: JSON.stringify({ ...DRAFT, era: true, age_groups: [] }),
  });
  expect(noAges.status).toBe(400);

  const wrongType = await fetch(`${base}/api/entries`, {
    method: "POST",
    headers: { "content-type": "text/plain", cookie },
    body: "nope",
  });
  expect(wrongType.status).toBe(415);
});

test("signing out clears the session cookie", async () => {
  const { cookie } = await login();
  const response = await fetch(`${base}/api/auth/logout`, {
    method: "POST",
    headers: { cookie },
  });
  expect(response.status).toBe(200);
  const cleared = (response.headers.getSetCookie?.() ?? [response.headers.get("set-cookie")]).join(
    ";",
  );
  expect(cleared).toContain("resources_session=");
  expect(cleared).toContain("Max-Age=0");
});
