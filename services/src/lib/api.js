// Small client for the admin API. The public site works without it; the
// editor asks for it and shows a quiet note when it is not there.

async function request(path, { method = "GET", body } = {}) {
  const options = { method, headers: {} };
  if (body !== undefined) {
    options.headers["content-type"] = "application/json";
    options.body = JSON.stringify(body);
  }
  const response = await fetch(path, options);
  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }
  return { ok: response.ok, status: response.status, data };
}

export const fetchSession = () => request("/api/session");

export const logIn = (password) => request("/api/session", { method: "POST", body: { password } });

export const logOut = () => request("/api/session", { method: "DELETE" });

export const fetchServerEntries = () => request("/api/entries");

export const createEntry = (entry) => request("/api/entries", { method: "POST", body: entry });

export const updateEntry = (slug, entry) =>
  request(`/api/entries/${encodeURIComponent(slug)}`, { method: "PUT", body: entry });

export const deleteEntry = (slug) =>
  request(`/api/entries/${encodeURIComponent(slug)}`, { method: "DELETE" });
