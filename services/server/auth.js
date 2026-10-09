// A single admin password from the environment, and a signed, httpOnly
// session cookie. Secrets never live in the repo.

import crypto from "node:crypto";

const COOKIE_NAME = "services_session";
const SESSION_SECONDS = 12 * 60 * 60;

export function createAuth({ password } = {}) {
  const enabled = typeof password === "string" && password.length > 0;
  const key = crypto
    .createHash("sha256")
    .update(`services-admin:${password ?? ""}`)
    .digest();

  const sign = (payload) => crypto.createHmac("sha256", key).update(payload).digest("base64url");

  function issue() {
    const expires = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
    const payload = Buffer.from(JSON.stringify({ exp: expires })).toString("base64url");
    return `${payload}.${sign(payload)}`;
  }

  function verify(token) {
    if (!enabled || typeof token !== "string" || token === "") {
      return false;
    }
    const index = token.lastIndexOf(".");
    if (index === -1) {
      return false;
    }
    const payload = token.slice(0, index);
    const signature = token.slice(index + 1);
    const expected = sign(payload);
    const given = Buffer.from(signature);
    const wanted = Buffer.from(expected);
    if (given.length !== wanted.length || !crypto.timingSafeEqual(given, wanted)) {
      return false;
    }
    try {
      const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
      return typeof parsed.exp === "number" && parsed.exp > Date.now() / 1000;
    } catch {
      return false;
    }
  }

  function checkPassword(attempt) {
    if (!enabled || typeof attempt !== "string") {
      return false;
    }
    const given = crypto.createHash("sha256").update(attempt).digest();
    const wanted = crypto.createHash("sha256").update(password).digest();
    return crypto.timingSafeEqual(given, wanted);
  }

  function cookie(value, { maxAge } = {}) {
    const parts = [`${COOKIE_NAME}=${value}`, "Path=/", "HttpOnly", "SameSite=Lax"];
    if (maxAge !== undefined) {
      parts.push(`Max-Age=${maxAge}`);
    }
    return parts.join("; ");
  }

  return { enabled, issue, verify, checkPassword, cookie, COOKIE_NAME, SESSION_SECONDS };
}

export function parseCookies(header) {
  const jar = {};
  if (!header) {
    return jar;
  }
  for (const part of header.split(";")) {
    const index = part.indexOf("=");
    if (index === -1) {
      continue;
    }
    jar[part.slice(0, index).trim()] = part.slice(index + 1).trim();
  }
  return jar;
}
