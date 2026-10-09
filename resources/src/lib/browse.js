// Browse logic: search matching, filters, sorting, facet counts, and URL state helpers.

import { AGE_GROUPS, COLLECTIONS, FORMATS } from "./entries.js";

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function boundaryPattern(source) {
  return new RegExp(`(?<![\\p{L}\\p{N}])${source}(?![\\p{L}\\p{N}])`, "iu");
}

// Simple plural handling so "app" finds "apps" and vice versa.
function termVariants(term) {
  if (term.length < 3) return [term];
  if (term.endsWith("s")) {
    const singular = term.slice(0, -1);
    return singular.length >= 3 ? [term, singular] : [term];
  }
  return [term, `${term}s`];
}

export function searchTerms(query) {
  return String(query ?? "")
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
}

function termIn(value, term) {
  if (!value) return false;
  return termVariants(term).some((variant) => boundaryPattern(escapeRegExp(variant)).test(value));
}

// All terms must match somewhere in the title, tags, description, or source.
export function entryMatches(entry, terms) {
  if (terms.length === 0) return true;
  const tags = (entry.tags ?? []).join(" ");
  return terms.every(
    (term) =>
      termIn(entry.title, term) ||
      termIn(tags, term) ||
      termIn(entry.description, term) ||
      termIn(entry.source, term),
  );
}

// Relevance weights: title ×3, tags ×2, description ×1, source ×1.
export function matchScore(entry, terms) {
  const tags = (entry.tags ?? []).join(" ");
  let score = 0;
  for (const term of terms) {
    if (termIn(entry.title, term)) score += 3;
    if (termIn(tags, term)) score += 2;
    if (termIn(entry.description, term)) score += 1;
    if (termIn(entry.source, term)) score += 1;
  }
  return score;
}

export function matchesKind(entry, kind) {
  return kind.size === 0 || kind.has(entry.format);
}

// Age reads inclusively: choosing an age also surfaces "All ages" entries.
export function matchesWho(entry, who) {
  if (who.size === 0) return true;
  return entry.age_groups.some((age) => who.has(age) || age === "all-ages");
}

export function matchesApps(entry, apps) {
  if (apps.size === 0) return true;
  return entry.format === "app" && apps.has(entry.collection);
}

export function matchesFilters(entry, { kind, who, apps }) {
  return matchesKind(entry, kind) && matchesWho(entry, who) && matchesApps(entry, apps);
}

export function filterEntries(entries, { terms, kind, who, apps }) {
  return entries.filter(
    (entry) => matchesFilters(entry, { kind, who, apps }) && entryMatches(entry, terms),
  );
}

function byRecencyDesc(a, b) {
  const keyA = a.published_date || a.added_date || "";
  const keyB = b.published_date || b.added_date || "";
  if (keyA === keyB) return 0;
  return keyA < keyB ? 1 : -1;
}

export function sortNewest(entries) {
  return [...entries].sort(byRecencyDesc);
}

export function sortRelevance(entries, terms) {
  return [...entries].sort((a, b) => {
    const diff = matchScore(b, terms) - matchScore(a, terms);
    return diff !== 0 ? diff : byRecencyDesc(a, b);
  });
}

export function sortEntries(entries, sort, terms) {
  return sort === "relevance" && terms.length > 0
    ? sortRelevance(entries, terms)
    : sortNewest(entries);
}

// The predicate for one filter option, used by countForOption.
export function optionPredicate(group, key) {
  switch (group) {
    case "kind":
      return (entry) => entry.format === key;
    case "who":
      return (entry) => entry.age_groups.some((age) => age === key || age === "all-ages");
    case "apps":
      return (entry) => entry.format === "app" && entry.collection === key;
    default:
      throw new Error(`Unknown filter group: ${group}`);
  }
}

// Live count for one filter option: how many entries that option would add
// given the query and every OTHER group's selection.
export function countForOption(entries, { terms, kind, who, apps }, group, key) {
  const matchesOthers = (entry) => {
    if (group !== "kind" && !matchesKind(entry, kind)) return false;
    if (group !== "who" && !matchesWho(entry, who)) return false;
    if (group !== "apps" && !matchesApps(entry, apps)) return false;
    return entryMatches(entry, terms);
  };
  const matchesOption = optionPredicate(group, key);
  return entries.filter((entry) => matchesOthers(entry) && matchesOption(entry)).length;
}

const VALID_KEYS = {
  kind: new Set(FORMATS.map((format) => format.key)),
  who: new Set(AGE_GROUPS.map((group) => group.key)),
  apps: new Set(COLLECTIONS.map((collection) => collection.key)),
};

export function parseQuery(params) {
  return params.get("q") ?? "";
}

export function parseFilters(params) {
  const read = (group) =>
    new Set(params.getAll(group).filter((value) => VALID_KEYS[group].has(value)));
  return { kind: read("kind"), who: read("who"), apps: read("apps") };
}

// An explicit sort choice, or null when the default applies. "Best match"
// without a query is meaningless, so it is dropped.
export function parseSort(params, query) {
  const raw = params.get("sort");
  if (raw === "newest") return "newest";
  if (raw === "relevance" && searchTerms(query).length > 0) return "relevance";
  return null;
}

export function effectiveSort(sortParam, terms) {
  return sortParam ?? (terms.length > 0 ? "relevance" : "newest");
}

export function activeFilterEntries({ kind, who, apps }) {
  const chips = [];
  for (const format of FORMATS) {
    if (kind.has(format.key)) chips.push({ group: "kind", key: format.key, label: format.label });
  }
  for (const group of AGE_GROUPS) {
    if (who.has(group.key)) chips.push({ group: "who", key: group.key, label: group.label });
  }
  for (const collection of COLLECTIONS) {
    if (apps.has(collection.key))
      chips.push({ group: "apps", key: collection.key, label: collection.label });
  }
  return chips;
}

export function describeCount(count, total, narrowed) {
  if (!narrowed) return `${total} ${total === 1 ? "resource" : "resources"}`;
  return `${count} of ${total} resources`;
}

// Split a piece of text into alternating plain and matched parts for
// highlighting. Odd indexes are matches.
export function highlightParts(text, terms) {
  if (!text || terms.length === 0) return [text];
  const variants = [...new Set(terms.flatMap(termVariants))].sort((a, b) => b.length - a.length);
  const pattern = new RegExp(
    `(?<![\\p{L}\\p{N}])(${variants.map(escapeRegExp).join("|")})(?![\\p{L}\\p{N}])`,
    "giu",
  );
  return text.split(pattern);
}
