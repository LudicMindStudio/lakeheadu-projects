// Small client for the management server. Callers treat a thrown request as
// "the server is not running" and fall back to bundled data.

async function request(path, options = {}) {
  const response = await fetch(path, {
    credentials: "same-origin",
    headers: {
      accept: "application/json",
      ...(options.body ? { "content-type": "application/json" } : {}),
    },
    ...options,
  });
  const type = response.headers?.get?.("content-type") ?? "";
  const data = type.includes("json") ? await response.json() : null;
  if (!response.ok) {
    const error = new Error((data && data.error) || `Request failed (${response.status})`);
    error.status = response.status;
    throw error;
  }
  return data;
}

export const api = {
  status: () => request("/api/auth/status"),
  login: (password) =>
    request("/api/auth/login", { method: "POST", body: JSON.stringify({ password }) }),
  logout: () => request("/api/auth/logout", { method: "POST" }),
  entries: () => request("/api/entries"),
  create: (entry) => request("/api/entries", { method: "POST", body: JSON.stringify(entry) }),
  update: (id, entry) =>
    request(`/api/entries/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify(entry),
    }),
  remove: (id) => request(`/api/entries/${encodeURIComponent(id)}`, { method: "DELETE" }),
};
