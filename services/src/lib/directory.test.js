import { describe, expect, it } from "vitest";
import { ENTRIES } from "../data/entries.js";
import { emptyFilters } from "../data/filters.js";
import { findTown } from "../data/towns.js";
import {
  boundsOf,
  distanceKm,
  filterEntries,
  formatArea,
  inBounds,
  parseArea,
  searchEntries,
  selectEntries,
  sortEntries,
} from "./directory.js";

const slugs = (entries) => entries.map((entry) => entry.slug).sort();

describe("searchEntries", () => {
  it("matches town names case-insensitively", () => {
    expect(slugs(searchEntries(ENTRIES, "KENORA"))).toEqual(["full-circle-womens-counselling"]);
  });

  it("matches words inside descriptions and field values", () => {
    expect(slugs(searchEntries(ENTRIES, "text"))).toContain("northnet-textcare");
  });

  it("indexes the cost wording, so 'free' finds free services", () => {
    const results = searchEntries(ENTRIES, "free");
    expect(results.length).toBe(10);
    expect(results.every((entry) => entry.cost === "free")).toBe(true);
  });

  it("requires every word to appear somewhere in the entry", () => {
    expect(searchEntries(ENTRIES, "zzzz")).toEqual([]);
    expect(slugs(searchEntries(ENTRIES, "text counsellor"))).toEqual(["northnet-textcare"]);
  });

  it("strips punctuation off query words", () => {
    expect(slugs(searchEntries(ENTRIES, "counselling, kenora?"))).toEqual([
      "full-circle-womens-counselling",
    ]);
  });
});

describe("filterEntries", () => {
  it("filters by cost", () => {
    const free = filterEntries(ENTRIES, { ...emptyFilters(), cost: ["free"] });
    expect(free.length).toBe(10);
    expect(free.every((entry) => entry.cost === "free")).toBe(true);

    const fee = filterEntries(ENTRIES, { ...emptyFilters(), cost: ["not-free"] });
    expect(slugs(fee)).toEqual([
      "clearwater-video-counselling",
      "northlight-affirming-counselling",
    ]);
  });

  it("combines options with OR inside a group", () => {
    const results = filterEntries(ENTRIES, { ...emptyFilters(), nature: ["phone", "mhealth-app"] });
    expect(slugs(results)).toEqual(["kestrel-app", "northwest-peer-support-line"]);
  });

  it("combines groups with AND", () => {
    const results = filterEntries(ENTRIES, {
      ...emptyFilters(),
      cost: ["free"],
      nature: ["phone"],
    });
    expect(slugs(results)).toEqual(["northwest-peer-support-line"]);
  });

  it("treats an untouched group as no constraint", () => {
    expect(filterEntries(ENTRIES, emptyFilters()).length).toBe(ENTRIES.length);
    expect(filterEntries(ENTRIES, {}).length).toBe(ENTRIES.length);
  });

  it("matches considerations, ages, and referral", () => {
    expect(
      slugs(filterEntries(ENTRIES, { ...emptyFilters(), considerations: ["indigenous"] })),
    ).toEqual(["boreal-path-community-wellbeing"]);
    expect(
      slugs(filterEntries(ENTRIES, { ...emptyFilters(), considerations: ["lgbtq-plus"] })),
    ).toEqual(["northlight-affirming-counselling"]);
    expect(slugs(filterEntries(ENTRIES, { ...emptyFilters(), ages: ["under-18"] }))).toEqual([
      "fireside-teen-talk",
      "lakewood-student-wellbeing",
    ]);
    expect(slugs(filterEntries(ENTRIES, { ...emptyFilters(), referral: ["required"] }))).toEqual([
      "cedar-ridge-adult-mental-health",
      "lakewood-student-wellbeing",
    ]);
    expect(slugs(filterEntries(ENTRIES, { ...emptyFilters(), concerns: ["sleep"] }))).toEqual([
      "clearwater-video-counselling",
      "kestrel-app",
    ]);
  });
});

describe("map area", () => {
  it("round-trips area bounds through the URL format", () => {
    const bounds = { west: -90.125, south: 48.5, east: -89.25, north: 49.75 };
    expect(parseArea(formatArea(bounds))).toEqual(bounds);
  });

  it("rejects unreadable area values", () => {
    expect(parseArea("")).toBeNull();
    expect(parseArea("1,2,3")).toBeNull();
    expect(parseArea("a,b,c,d")).toBeNull();
    expect(parseArea("0,2,0,4")).toBeNull();
    expect(parseArea("0,5,4,2")).toBeNull();
  });

  it("filters entries to the bounds", () => {
    const kenora = { west: -94.6, south: 49.6, east: -94.3, north: 49.9 };
    expect(slugs(selectEntries(ENTRIES, { area: kenora }))).toEqual([
      "full-circle-womens-counselling",
    ]);
  });

  it("composes with search and filters", () => {
    const thunderBay = { west: -89.5, south: 48.2, east: -89, north: 48.6 };
    const results = selectEntries(ENTRIES, {
      area: thunderBay,
      filters: { ...emptyFilters(), cost: ["free"] },
    });
    expect(results).toHaveLength(3);
    for (const entry of results) {
      expect(entry.region).toBe("Thunder Bay");
    }
  });

  it("computes the bounds of a set of entries", () => {
    const bounds = boundsOf(ENTRIES);
    expect(bounds.west).toBeCloseTo(-94.482, 3);
    expect(bounds.east).toBeCloseTo(-86.372, 3);
    expect(bounds.south).toBeCloseTo(48.375, 3);
    expect(bounds.north).toBeCloseTo(51.058, 3);
  });

  it("checks coordinates directly", () => {
    const entry = ENTRIES[0];
    expect(
      inBounds(entry, {
        west: entry.lng - 1,
        south: entry.lat - 1,
        east: entry.lng + 1,
        north: entry.lat + 1,
      }),
    ).toBe(true);
    expect(
      inBounds(entry, {
        west: entry.lng + 1,
        south: entry.lat + 1,
        east: entry.lng + 2,
        north: entry.lat + 2,
      }),
    ).toBe(false);
  });
});

describe("sortEntries", () => {
  it("sorts alphabetically by program when there is no query", () => {
    const sorted = sortEntries(ENTRIES, { sort: "relevance" });
    expect(sorted[0].program).toBe("Adult Mental Health Program");
  });

  it("ranks name matches above description matches", () => {
    const matched = searchEntries(ENTRIES, "counselling");
    const sorted = sortEntries(matched, { sort: "relevance", query: "counselling" });
    const isNameHit = (entry) => /counselling/i.test(`${entry.org} ${entry.program}`);
    const nameHits = sorted.map(isNameHit);
    const lastNamed = nameHits.lastIndexOf(true);
    const firstUnnamed = nameHits.indexOf(false);
    expect(lastNamed).toBeGreaterThanOrEqual(0);
    expect(firstUnnamed).toBeGreaterThan(lastNamed);
  });

  it("sorts cost with free entries first", () => {
    const sorted = sortEntries(ENTRIES, { sort: "cost" });
    expect(sorted[0].program).toBe("Adult Mental Health Program");
    const freeFlags = sorted.map((entry) => entry.cost === "free");
    const lastFree = freeFlags.lastIndexOf(true);
    const firstFee = freeFlags.indexOf(false);
    expect(lastFree).toBeLessThan(firstFee);
  });

  it("sorts closest first from a chosen town", () => {
    const sorted = sortEntries(ENTRIES, { sort: "closest", town: "Kenora" });
    expect(sorted[0].slug).toBe("full-circle-womens-counselling");
    const origin = findTown("Kenora");
    let previous = -1;
    for (const entry of sorted) {
      const distance = distanceKm(origin, findTown(entry.region));
      expect(distance).toBeGreaterThanOrEqual(previous);
      previous = distance;
    }
  });

  it("falls back to alphabetical when no valid town is chosen", () => {
    expect(sortEntries(ENTRIES, { sort: "closest", town: "" })[0].program).toBe(
      "Adult Mental Health Program",
    );
    expect(sortEntries(ENTRIES, { sort: "closest", town: "Nowhere" })[0].program).toBe(
      "Adult Mental Health Program",
    );
  });
});

describe("distanceKm", () => {
  it("returns zero for the same town", () => {
    const kenora = findTown("Kenora");
    expect(distanceKm(kenora, kenora)).toBe(0);
  });

  it("estimates Kenora to Thunder Bay in a sensible band", () => {
    const km = distanceKm(findTown("Kenora"), findTown("Thunder Bay"));
    expect(km).toBeGreaterThan(350);
    expect(km).toBeLessThan(470);
  });
});

describe("selectEntries", () => {
  it("applies search, filters, and sort together", () => {
    const results = selectEntries(ENTRIES, {
      query: "counselling",
      filters: { ...emptyFilters(), referral: ["self"] },
      sort: "cost",
    });
    expect(results.length).toBeGreaterThan(0);
    for (const entry of results) {
      expect(entry.referral).toBe("self");
      expect(
        `${entry.org} ${entry.program} ${entry.description} ${entry.region}`.toLowerCase(),
      ).toContain("counselling");
    }
    const freeFlags = results.map((entry) => entry.cost === "free");
    const lastFree = freeFlags.lastIndexOf(true);
    const firstFee = freeFlags.indexOf(false);
    if (firstFee !== -1) {
      expect(lastFree).toBeLessThan(firstFee);
    }
  });
});
