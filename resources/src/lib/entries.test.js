import { describe, expect, test } from "vitest";
import {
  AGE_GROUPS,
  COLLECTIONS,
  ENTRIES,
  FORMATS,
  ageLabels,
  badgeFor,
  collectionLabel,
  formatDate,
  recencyKey,
} from "./entries.js";

describe("sample data", () => {
  test("covers every filter value at least once", () => {
    for (const format of FORMATS) {
      expect(
        ENTRIES.some((entry) => entry.format === format.key),
        format.key,
      ).toBe(true);
    }
    for (const group of AGE_GROUPS) {
      expect(
        ENTRIES.some((entry) => entry.age_groups.includes(group.key)),
        group.key,
      ).toBe(true);
    }
    for (const collection of COLLECTIONS) {
      expect(
        ENTRIES.some((entry) => entry.format === "app" && entry.collection === collection.key),
        collection.key,
      ).toBe(true);
    }
  });

  test("is marked as sample: no live links", () => {
    for (const entry of ENTRIES) {
      expect(entry.url, entry.id).toBeNull();
    }
  });

  test("every entry has the full shape", () => {
    const formats = new Set([...FORMATS.map((format) => format.key), "app"]);
    const ages = new Set(AGE_GROUPS.map((group) => group.key));
    const collections = new Set(COLLECTIONS.map((collection) => collection.key));
    const date = /^\d{4}-\d{2}-\d{2}$/;
    const ids = new Set();

    for (const entry of ENTRIES) {
      expect(entry.id).toMatch(/^[a-z0-9-]+$/);
      expect(ids.has(entry.id), entry.id).toBe(false);
      ids.add(entry.id);
      expect(formats.has(entry.format), entry.id).toBe(true);
      expect(typeof entry.title).toBe("string");
      expect(entry.title.length).toBeGreaterThan(0);
      expect(typeof entry.source).toBe("string");
      expect(entry.source.length).toBeGreaterThan(0);
      expect(typeof entry.description).toBe("string");
      expect(entry.age_groups.length).toBeGreaterThan(0);
      for (const age of entry.age_groups) expect(ages.has(age), entry.id).toBe(true);
      expect(entry.tags.length).toBeGreaterThan(0);
      expect(date.test(entry.added_date), entry.id).toBe(true);
      if (entry.published_date !== null)
        expect(date.test(entry.published_date), entry.id).toBe(true);
      expect(Array.isArray(entry.embeds), entry.id).toBe(true);
      if (entry.format === "app") {
        expect(collections.has(entry.collection), entry.id).toBe(true);
      } else {
        expect(entry.collection).toBeNull();
      }
    }

    expect(ENTRIES.length).toBeGreaterThanOrEqual(10);
  });
});

describe("sample media", () => {
  test("every entry carries a banner with local media", () => {
    for (const entry of ENTRIES) {
      expect(entry.banner, entry.id).toBeTruthy();
      expect(["image", "video"], entry.id).toContain(entry.banner.kind);
      expect(entry.banner.src.startsWith("/media/"), entry.id).toBe(true);
      if (entry.banner.alt !== undefined) {
        expect(typeof entry.banner.alt, entry.id).toBe("string");
      }
      if (entry.banner.kind === "video") {
        expect(entry.banner.poster.startsWith("/media/"), entry.id).toBe(true);
      }
    }
  });

  test("one video banner and both embed kinds appear across the entries", () => {
    expect(ENTRIES.filter((entry) => entry.banner.kind === "video")).toHaveLength(1);
    const withEmbeds = ENTRIES.filter((entry) => entry.embeds.length > 0);
    expect(withEmbeds).toHaveLength(2);
    expect(withEmbeds.filter((entry) => entry.embeds[0].kind === "video")).toHaveLength(1);
    expect(withEmbeds.filter((entry) => entry.embeds[0].kind === "pdf")).toHaveLength(1);
    for (const entry of withEmbeds) {
      for (const media of entry.embeds) {
        expect(media.url.startsWith("/media/"), entry.id).toBe(true);
        expect(media.title.length).toBeGreaterThan(0);
      }
    }
  });

  test("nothing in the sample data points at an external address", () => {
    for (const entry of ENTRIES) {
      const urls = [
        entry.url,
        entry.banner?.src,
        entry.banner?.poster,
        ...entry.embeds.map((media) => media.url),
      ];
      for (const url of urls) {
        if (url == null) continue;
        expect(url.startsWith("/"), `${entry.id}: ${url}`).toBe(true);
      }
    }
  });
});

describe("vocabulary helpers", () => {
  test("badgeFor maps formats, including apps", () => {
    expect(badgeFor("video")).toBe("Video");
    expect(badgeFor("article-research")).toBe("Article (research)");
    expect(badgeFor("app")).toBe("App");
  });

  test("ageLabels reads in vocabulary order", () => {
    expect(ageLabels(["all-ages"])).toBe("All ages");
    expect(ageLabels(["18-65", "65-plus"])).toBe("18–65 · 65+");
  });

  test("collectionLabel resolves keys", () => {
    expect(collectionLabel("willowfen-directory")).toBe("Willowfen App Directory");
  });

  test("formatDate turns ISO dates into month and year", () => {
    expect(formatDate("2025-03-10")).toBe("Mar 2025");
    expect(formatDate(null)).toBe("");
  });

  test("recencyKey prefers published, falls back to added", () => {
    expect(recencyKey({ published_date: "2025-01-01", added_date: "2025-02-01" })).toBe(
      "2025-01-01",
    );
    expect(recencyKey({ published_date: null, added_date: "2025-02-01" })).toBe("2025-02-01");
  });
});
