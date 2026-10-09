// @vitest-environment node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { ENTRIES } from "../src/data/entries.js";
import { createAuth } from "./auth.js";
import { createAppServer } from "./server.js";
import { createStore, validateEntry } from "./store.js";

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "services-server-"));

function makeFixtureDist() {
  const dist = path.join(tmp, "dist");
  fs.mkdirSync(path.join(dist, "assets"), { recursive: true });
  fs.mkdirSync(path.join(dist, "tiles", "6", "14"), { recursive: true });
  fs.writeFileSync(path.join(dist, "index.html"), "<!doctype html><title>services shell</title>");
  fs.writeFileSync(path.join(dist, "assets", "app.js"), "console.log('app');");
  fs.writeFileSync(path.join(dist, "tiles", "6", "14", "21.webp"), "webp");
  return dist;
}

describe("store", () => {
  it("seeds from the sample dataset on first run", () => {
    const file = path.join(tmp, "store-a", "entries.json");
    const store = createStore({ file });
    expect(store.list()).toHaveLength(ENTRIES.length);
    expect(fs.existsSync(file)).toBe(true);
  });

  it("creates, updates, deletes, and persists", () => {
    const file = path.join(tmp, "store-b", "entries.json");
    const store = createStore({ file });
    const sample = { ...ENTRIES[0], slug: "copy-one", program: "Copy One" };
    store.add(sample);
    expect(store.get("copy-one").program).toBe("Copy One");

    const updated = store.update("copy-one", { ...sample, program: "Copy One v2" });
    expect(updated.program).toBe("Copy One v2");

    expect(store.remove("copy-one")).toBe(true);
    expect(store.get("copy-one")).toBeNull();

    const reloaded = createStore({ file });
    expect(reloaded.list()).toHaveLength(ENTRIES.length);
  });
});

describe("validateEntry", () => {
  it("accepts a complete entry and builds its slug", () => {
    const { entry, errors } = validateEntry({ ...ENTRIES[0], slug: "" });
    expect(errors).toBeUndefined();
    expect(entry.slug).toBe("walk-in-counselling");
  });

  it("reports missing and invalid fields", () => {
    const { errors } = validateEntry({ ...ENTRIES[0], program: "", cost: "cheap", lat: "north" });
    expect(errors.program).toBeTruthy();
    expect(errors.cost).toBeTruthy();
    expect(errors.lat).toBeTruthy();
  });

  it("refuses a slug already in use", () => {
    const { errors } = validateEntry(ENTRIES[1], {
      existingSlugs: new Set(["boreal-path-community-wellbeing"]),
    });
    expect(errors.slug).toBe("Already used by another entry.");
  });
});

describe("auth", () => {
  it("stays off without a password", () => {
    const auth = createAuth({ password: "" });
    expect(auth.enabled).toBe(false);
    expect(auth.checkPassword("anything")).toBe(false);
    expect(auth.verify("x.y")).toBe(false);
  });

  it("issues and verifies a signed session", () => {
    const auth = createAuth({ password: "hunter2" });
    const token = auth.issue();
    expect(auth.verify(token)).toBe(true);
    expect(auth.verify(`${token}0`)).toBe(false);
    expect(auth.verify("garbage")).toBe(false);
    expect(auth.checkPassword("hunter2")).toBe(true);
    expect(auth.checkPassword("hunter3")).toBe(false);
  });

  it("expires sessions", () => {
    vi.useFakeTimers();
    try {
      const auth = createAuth({ password: "pw" });
      const token = auth.issue();
      expect(auth.verify(token)).toBe(true);
      vi.setSystemTime(Date.now() + 13 * 60 * 60 * 1000);
      expect(auth.verify(token)).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("http server", () => {
  let server;
  let base;
  let cookie = "";

  beforeAll(async () => {
    server = createAppServer({
      distDir: makeFixtureDist(),
      dataFile: path.join(tmp, "http-store", "entries.json"),
      password: "test-password",
    });
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    base = `http://127.0.0.1:${server.address().port}`;
  });

  afterAll(async () => {
    await new Promise((resolve) => server.close(resolve));
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  it("serves the built app and its assets", async () => {
    const home = await fetch(`${base}/`);
    expect(home.status).toBe(200);
    expect(home.headers.get("content-type")).toContain("text/html");
    expect(await home.text()).toContain("services shell");

    const asset = await fetch(`${base}/assets/app.js`);
    expect(asset.status).toBe(200);
    expect(asset.headers.get("cache-control")).toContain("immutable");
  });

  it("falls back to the app shell for app routes and 404s for missing files", async () => {
    const route = await fetch(`${base}/entry/some-service`);
    expect(route.status).toBe(200);
    expect(await route.text()).toContain("services shell");

    const missing = await fetch(`${base}/missing.js`);
    expect(missing.status).toBe(404);
  });

  it("refuses to serve outside the build directory", async () => {
    const response = await fetch(`${base}/..%2F..%2F..%2Fetc%2Fpasswd`);
    expect(response.status).toBe(404);
  });

  it("reads entries publicly", async () => {
    const response = await fetch(`${base}/api/entries`);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.entries).toHaveLength(ENTRIES.length);
  });

  it("runs the login flow and guards the admin routes", async () => {
    const session = await (await fetch(`${base}/api/session`)).json();
    expect(session).toEqual({ enabled: true, admin: false });

    const denied = await fetch(`${base}/api/entries`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(ENTRIES[0]),
    });
    expect(denied.status).toBe(401);

    const bad = await fetch(`${base}/api/session`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password: "nope" }),
    });
    expect(bad.status).toBe(401);

    const good = await fetch(`${base}/api/session`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password: "test-password" }),
    });
    expect(good.status).toBe(200);
    cookie = good.headers.get("set-cookie").split(";")[0];
    expect(cookie).toContain("services_session=");

    const me = await (await fetch(`${base}/api/session`, { headers: { cookie } })).json();
    expect(me.admin).toBe(true);
  });

  it("creates, updates, and deletes entries behind the login", async () => {
    const draft = { ...ENTRIES[0], slug: "server-created", program: "Server Created" };

    const created = await fetch(`${base}/api/entries`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify(draft),
    });
    expect(created.status).toBe(201);

    const duplicate = await fetch(`${base}/api/entries`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify(draft),
    });
    expect(duplicate.status).toBe(409);

    const invalid = await fetch(`${base}/api/entries`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({ ...draft, program: "", slug: "bad-one" }),
    });
    expect(invalid.status).toBe(422);
    const invalidBody = await invalid.json();
    expect(invalidBody.errors.program).toBeTruthy();

    const updated = await fetch(`${base}/api/entries/server-created`, {
      method: "PUT",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({ ...draft, program: "Server Created v2" }),
    });
    expect(updated.status).toBe(200);

    const list = await (await fetch(`${base}/api/entries`)).json();
    expect(
      list.entries.some(
        (entry) => entry.slug === "server-created" && entry.program === "Server Created v2",
      ),
    ).toBe(true);

    const removed = await fetch(`${base}/api/entries/server-created`, {
      method: "DELETE",
      headers: { cookie },
    });
    expect(removed.status).toBe(200);

    const removedAgain = await fetch(`${base}/api/entries/server-created`, {
      method: "DELETE",
      headers: { cookie },
    });
    expect(removedAgain.status).toBe(404);
  });

  it("logs out", async () => {
    const out = await fetch(`${base}/api/session`, { method: "DELETE", headers: { cookie } });
    expect(out.status).toBe(200);
    expect(out.headers.get("set-cookie")).toContain("Max-Age=0");
  });
});
