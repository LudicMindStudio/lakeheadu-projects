// Address-safe slugs. Shared by the editor form and the server, which both
// keep one slug per entry so the URL never moves.

export function slugify(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
