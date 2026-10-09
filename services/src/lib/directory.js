import { FILTER_GROUPS } from "../data/filters.js";
import { findTown } from "../data/towns.js";

// Search words: lowercase, punctuation stripped, hyphen kept inside words.
export function tokenize(query) {
  return query
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.replace(/[^\p{L}\p{N}-]+/gu, ""))
    .filter(Boolean);
}

// Everything a plain-word search looks at for one entry.
export function searchText(entry) {
  const parts = [
    entry.org,
    entry.program,
    entry.description,
    entry.region,
    ...entry.nature,
    ...entry.concerns,
    ...entry.ages,
    ...entry.considerations,
    entry.referral,
    entry.cost === "free" ? "free" : "has a fee",
  ];
  return parts.join(" ").toLowerCase();
}

// Every word in the query must appear somewhere in the entry.
export function searchEntries(entries, query) {
  const words = tokenize(query);
  if (words.length === 0) {
    return [...entries];
  }
  return entries.filter((entry) => {
    const text = searchText(entry);
    return words.every((word) => text.includes(word));
  });
}

// OR inside a group, AND across groups. An untouched group is ignored.
export function filterEntries(entries, filters) {
  return entries.filter((entry) =>
    FILTER_GROUPS.every((group) => {
      const selected = filters[group.id] ?? [];
      if (selected.length === 0) {
        return true;
      }
      const values = Array.isArray(entry[group.id]) ? entry[group.id] : [entry[group.id]];
      return selected.some((value) => values.includes(value));
    }),
  );
}

// Straight-line distance in kilometres between two town points.
export function distanceKm(from, to) {
  if (!from || !to) {
    return null;
  }
  const radians = (degrees) => (degrees * Math.PI) / 180;
  const dLat = radians(to.lat - from.lat);
  const dLon = radians(to.lon - from.lon);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(radians(from.lat)) * Math.cos(radians(to.lat)) * Math.sin(dLon / 2) ** 2;
  return Math.round(2 * 6371 * Math.asin(Math.sqrt(a)));
}

export function distanceFromTown(entry, townName) {
  return distanceKm(findTown(townName), findTown(entry.region));
}

const byProgram = (a, b) => a.program.localeCompare(b.program, "en", { sensitivity: "base" });

export function sortEntries(entries, { sort = "relevance", town = "", query = "" } = {}) {
  const list = [...entries];

  if (sort === "closest") {
    const origin = findTown(town);
    if (!origin) {
      return list.sort(byProgram);
    }
    const distanceOf = (entry) => {
      const km = distanceKm(origin, findTown(entry.region));
      return km === null ? Number.POSITIVE_INFINITY : km;
    };
    return list.sort((a, b) => {
      const da = distanceOf(a);
      const db = distanceOf(b);
      if (da !== db) {
        return da - db;
      }
      return byProgram(a, b);
    });
  }

  if (sort === "cost") {
    return list.sort((a, b) => {
      const ca = a.cost === "free" ? 0 : 1;
      const cb = b.cost === "free" ? 0 : 1;
      if (ca !== cb) {
        return ca - cb;
      }
      return byProgram(a, b);
    });
  }

  // Relevance: name hits rank above description hits. Ties break alphabetically.
  const words = tokenize(query);
  if (words.length === 0) {
    return list.sort(byProgram);
  }
  const isNameHit = (entry) => {
    const name = `${entry.org} ${entry.program}`.toLowerCase();
    return words.some((word) => name.includes(word));
  };
  return list.sort((a, b) => {
    const ha = isNameHit(a) ? 0 : 1;
    const hb = isNameHit(b) ? 0 : 1;
    if (ha !== hb) {
      return ha - hb;
    }
    return byProgram(a, b);
  });
}

export function selectEntries(
  entries,
  { query = "", filters = {}, sort = "relevance", town = "" } = {},
) {
  const searched = searchEntries(entries, query);
  const filtered = filterEntries(searched, filters);
  return sortEntries(filtered, { sort, town, query });
}
