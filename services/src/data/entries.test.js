import { describe, expect, it } from "vitest";
import { ENTRIES } from "./entries.js";
import { FILTER_GROUPS } from "./filters.js";
import { findTown } from "./towns.js";

const FIELD_ACCESSORS = {
  cost: (entry) => [entry.cost],
  nature: (entry) => entry.nature,
  referral: (entry) => [entry.referral],
  considerations: (entry) => entry.considerations,
  ages: (entry) => entry.ages,
  concerns: (entry) => entry.concerns,
};

describe("sample entries", () => {
  it("use unique slugs", () => {
    const slugs = new Set(ENTRIES.map((entry) => entry.slug));
    expect(ENTRIES.length).toBeGreaterThanOrEqual(12);
    expect(slugs.size).toBe(ENTRIES.length);
  });

  it("carry every required field", () => {
    const required = [
      "slug",
      "org",
      "program",
      "description",
      "contact",
      "region",
      "firstStep",
      "availability",
      "lastVerified",
    ];
    for (const entry of ENTRIES) {
      for (const field of required) {
        expect(entry[field], `${entry.slug}: ${field}`).toBeTruthy();
      }
      expect(["free", "not-free"], entry.slug).toContain(entry.cost);
      expect(["self", "required"], entry.slug).toContain(entry.referral);
      expect(entry.nature.length, entry.slug).toBeGreaterThan(0);
      expect(entry.ages.length, entry.slug).toBeGreaterThan(0);
      expect(entry.concerns.length, entry.slug).toBeGreaterThan(0);
    }
  });

  it("name a town that carries coordinates", () => {
    for (const entry of ENTRIES) {
      expect(findTown(entry.region), entry.slug).toBeTruthy();
    }
  });

  it("keep firstStep to one sentence", () => {
    for (const entry of ENTRIES) {
      const step = entry.firstStep.trim();
      expect(step.endsWith("."), entry.slug).toBe(true);
      expect(step.slice(0, -1), entry.slug).not.toContain(".");
    }
  });

  it("never implies opening hours", () => {
    for (const entry of ENTRIES) {
      const text = [entry.description, entry.firstStep, entry.availability, entry.contact].join(
        " ",
      );
      expect(text, entry.slug).not.toMatch(/\b\d{1,2}\s*(a\.?m\.?|p\.?m\.?)\b/i);
    }
  });

  it("use the reserved-for-fiction 807-555-01xx numbers only", () => {
    const phones = ENTRIES.flatMap(
      (entry) => `${entry.contact} ${entry.firstStep}`.match(/807-555-\d{4}/g) ?? [],
    );
    expect(phones.length).toBeGreaterThan(0);
    for (const phone of phones) {
      expect(phone).toMatch(/^807-555-01\d{2}$/);
    }
  });
});

// The coverage check: every filter value appears on at least one entry.
for (const group of FILTER_GROUPS) {
  describe(`coverage: ${group.id}`, () => {
    for (const option of group.options) {
      it(`covers ${option.value}`, () => {
        const accessor = FIELD_ACCESSORS[group.id];
        const covered = ENTRIES.some((entry) => accessor(entry).includes(option.value));
        expect(covered).toBe(true);
      });
    }
  });
}
