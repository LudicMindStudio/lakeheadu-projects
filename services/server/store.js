// The entries store: one JSON file, written atomically on every change and
// seeded from the bundled sample dataset on first run. No database server.

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { ENTRIES } from "../src/data/entries.js";
import { FILTER_GROUPS, STATUS_LABELS } from "../src/data/filters.js";
import { REGION } from "../src/data/region.js";
import { slugify } from "../src/lib/slug.js";

const optionValues = (groupId) =>
  new Set(
    FILTER_GROUPS.find((group) => group.id === groupId).options.map((option) => option.value),
  );

const NATURE_VALUES = optionValues("nature");
const AGE_VALUES = optionValues("ages");
const CONCERN_VALUES = optionValues("concerns");
const CONSIDERATION_VALUES = optionValues("considerations");
const COST_VALUES = optionValues("cost");
const REFERRAL_VALUES = optionValues("referral");
const STATUS_VALUES = new Set(Object.keys(STATUS_LABELS));

function asString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function asList(value, allowed) {
  if (!Array.isArray(value)) {
    return [];
  }
  const kept = value.filter((item) => typeof item === "string" && allowed.has(item));
  return [...new Set(kept)];
}

// Checks a full entry as the editor sends it. Returns { entry } or { errors }.
export function validateEntry(input, { existingSlugs = new Set() } = {}) {
  const data = input && typeof input === "object" ? input : {};
  const errors = {};

  const program = asString(data.program);
  const org = asString(data.org);
  const description = asString(data.description);
  const contact = asString(data.contact);
  const region = asString(data.region);
  const firstStep = asString(data.firstStep);
  const firstStepShort = asString(data.firstStepShort);
  const availability = asString(data.availability);
  const lastVerified = asString(data.lastVerified);
  const cost = asString(data.cost);
  const referral = asString(data.referral);
  const status = asString(data.status);
  const slug = slugify(asString(data.slug) || program);

  if (!program) {
    errors.program = "Required.";
  }
  if (!org) {
    errors.org = "Required.";
  }
  if (!slug) {
    errors.slug = "A valid address is required.";
  } else if (existingSlugs.has(slug)) {
    errors.slug = "Already used by another entry.";
  }
  if (!description) {
    errors.description = "Required.";
  }
  if (!firstStep) {
    errors.firstStep = "Required. The precise first action.";
  }
  if (firstStepShort && firstStepShort.trim().split(/\s+/).length > 5) {
    errors.firstStepShort = "Keep it to five words or fewer.";
  }
  if (!contact) {
    errors.contact = "Required.";
  }
  if (!region) {
    errors.region = "Required.";
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(lastVerified)) {
    errors.lastVerified = "A date, as YYYY-MM-DD.";
  }
  if (!COST_VALUES.has(cost)) {
    errors.cost = "Choose free or has a fee.";
  }
  if (!REFERRAL_VALUES.has(referral)) {
    errors.referral = "Choose no referral needed or a referral is needed.";
  }
  if (status && !STATUS_VALUES.has(status)) {
    errors.status = "Unknown status.";
  }

  const nature = asList(data.nature, NATURE_VALUES);
  if (nature.length === 0) {
    errors.nature = "Choose at least one way to get help.";
  }
  const ages = asList(data.ages, AGE_VALUES);
  if (ages.length === 0) {
    errors.ages = "Choose at least one age range.";
  }
  const concerns = asList(data.concerns, CONCERN_VALUES);
  if (concerns.length === 0) {
    errors.concerns = "Choose at least one thing the service helps with.";
  }
  const considerations = asList(data.considerations, CONSIDERATION_VALUES);

  const lat = Number(data.lat);
  const lng = Number(data.lng);
  if (!Number.isFinite(lat) || lat < REGION.south - 2 || lat > REGION.north + 2) {
    errors.lat = "A number near the region (about 46 to 54).";
  }
  if (!Number.isFinite(lng) || lng < REGION.west - 2 || lng > REGION.east + 2) {
    errors.lng = "A number near the region (about -97 to -84).";
  }

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  const entry = {
    slug,
    org,
    program,
    description,
    cost,
    nature,
    referral,
    considerations,
    ages,
    concerns,
    contact,
    region,
    lat,
    lng,
    firstStep,
    availability,
    lastVerified,
  };
  if (firstStepShort) {
    entry.firstStepShort = firstStepShort;
  }
  if (status) {
    entry.status = status;
  }
  return { entry };
}

export function createStore({ file }) {
  let entries = null;

  function write() {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const temp = `${file}.tmp-${process.pid}-${crypto.randomBytes(4).toString("hex")}`;
    fs.writeFileSync(temp, `${JSON.stringify({ entries }, null, 2)}\n`, "utf8");
    fs.renameSync(temp, file);
  }

  function load() {
    if (entries) {
      return entries;
    }
    try {
      const data = JSON.parse(fs.readFileSync(file, "utf8"));
      entries = Array.isArray(data.entries) ? data.entries : [];
    } catch {
      entries = ENTRIES.map((entry) => ({ ...entry }));
      write();
    }
    return entries;
  }

  return {
    list: () => load().map((entry) => ({ ...entry })),
    get: (slug) => {
      const found = load().find((entry) => entry.slug === slug);
      return found ? { ...found } : null;
    },
    add: (entry) => {
      load().push({ ...entry });
      write();
      return { ...entry };
    },
    update: (slug, entry) => {
      const list = load();
      const index = list.findIndex((item) => item.slug === slug);
      if (index === -1) {
        return null;
      }
      list[index] = { ...entry, slug };
      write();
      return { ...list[index] };
    },
    remove: (slug) => {
      const list = load();
      const index = list.findIndex((item) => item.slug === slug);
      if (index === -1) {
        return false;
      }
      list.splice(index, 1);
      write();
      return true;
    },
  };
}
