// Entry data and vocabulary for the resources app.
//
// Entries are editable data: everything comes from src/data/entries.json, and
// components read it only through this module, so the sample set can be
// replaced without touching any component.

import entries from "../data/entries.json";

export const ENTRIES = entries;

export const FORMATS = [
  { key: "library", label: "Libraries", badge: "Library" },
  { key: "lesson-plan", label: "Lesson plans", badge: "Lesson plan" },
  { key: "video", label: "Videos", badge: "Video" },
  { key: "podcast", label: "Podcasts", badge: "Podcast" },
  {
    key: "organization-website",
    label: "Organizations & websites",
    badge: "Organization & website",
  },
  { key: "article-nonresearch", label: "Articles (non-research)", badge: "Article (non-research)" },
  { key: "article-research", label: "Articles (research)", badge: "Article (research)" },
  { key: "tool", label: "Tools & checklists", badge: "Tool & checklist" },
];

export const AGE_GROUPS = [
  { key: "all-ages", label: "All ages" },
  { key: "under-18", label: "Under 18" },
  { key: "18-65", label: "18–65" },
  { key: "65-plus", label: "65+" },
];

export const COLLECTIONS = [
  { key: "our-library", label: "Our library" },
  { key: "mhcc-directory", label: "MHCC mHealth directory" },
  { key: "mindapps", label: "MindApps.org" },
];

const BADGES = Object.fromEntries([
  ...FORMATS.map((format) => [format.key, format.badge]),
  ["app", "App"],
]);

export function badgeFor(format) {
  return BADGES[format] ?? format;
}

export function ageLabels(keys) {
  return AGE_GROUPS.filter((group) => keys.includes(group.key))
    .map((group) => group.label)
    .join(" · ");
}

export function collectionLabel(key) {
  return COLLECTIONS.find((collection) => collection.key === key)?.label ?? key;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function formatDate(iso) {
  if (!iso) return "";
  const [year, month] = iso.split("-");
  const index = Number(month) - 1;
  if (!year || !MONTHS[index]) return iso;
  return `${MONTHS[index]} ${year}`;
}

// The date an entry sorts and reads by: when it was published, or when it was
// added if there is no publication date.
export function recencyKey(entry) {
  return entry.published_date || entry.added_date || "";
}
