import { describe, expect, test } from "vitest";
import { ENTRIES } from "./entries.js";
import {
  activeFilterEntries,
  countForOption,
  describeCount,
  effectiveSort,
  entryMatches,
  filterEntries,
  highlightParts,
  matchScore,
  matchesWho,
  parseFilters,
  parseSort,
  searchTerms,
  sortEntries,
  sortNewest,
  sortRelevance,
} from "./browse.js";

const set = (...values) => new Set(values);

const make = (overrides = {}) => ({
  id: "x",
  title: "",
  format: "video",
  collection: null,
  source: "",
  url: null,
  description: "",
  age_groups: ["all-ages"],
  tags: [],
  published_date: null,
  added_date: "2025-01-01",
  ...overrides,
});

const emptyFilters = { terms: [], kind: set(), who: set(), apps: set() };

describe("search matching", () => {
  test("matches whole words only", () => {
    expect(entryMatches(make({ title: "Happiness at work" }), ["app"])).toBe(false);
    expect(entryMatches(make({ title: "Choosing an app" }), ["app"])).toBe(true);
  });

  test("treats simple plurals both ways", () => {
    expect(entryMatches(make({ title: "Talking Apps" }), ["app"])).toBe(true);
    expect(entryMatches(make({ title: "One App" }), ["apps"])).toBe(true);
    expect(entryMatches(make({ title: "Apples" }), ["app"])).toBe(false);
  });

  test("requires every term, across title, tags, description, and source", () => {
    const entry = make({ title: "Sleep Guide", tags: ["mood"], source: "Open Lens" });
    expect(entryMatches(entry, ["sleep", "mood"])).toBe(true);
    expect(entryMatches(entry, ["sleep", "lens"])).toBe(true);
    expect(entryMatches(entry, ["sleep", "podcast"])).toBe(false);
  });

  test("scores title over tags over description over source", () => {
    expect(matchScore(make({ title: "sleep" }), ["sleep"])).toBe(3);
    expect(matchScore(make({ tags: ["sleep"] }), ["sleep"])).toBe(2);
    expect(matchScore(make({ description: "sleep" }), ["sleep"])).toBe(1);
    expect(matchScore(make({ source: "sleep weekly" }), ["sleep"])).toBe(1);
    expect(
      matchScore(make({ title: "sleep", tags: ["sleep"], description: "sleep", source: "sleep" }), [
        "sleep",
      ]),
    ).toBe(7);
  });
});

describe("filters", () => {
  test("age reads inclusively with All ages", () => {
    expect(matchesWho(make({ age_groups: ["all-ages"] }), set("under-18"))).toBe(true);
    expect(matchesWho(make({ age_groups: ["all-ages"] }), set("65-plus"))).toBe(true);
    expect(matchesWho(make({ age_groups: ["under-18"] }), set("65-plus"))).toBe(false);
    expect(matchesWho(make({ age_groups: ["under-18"] }), set("all-ages"))).toBe(false);
    expect(matchesWho(make({ age_groups: ["18-65"] }), set())).toBe(true);
  });

  test("kinds combine within the group and narrow across groups", () => {
    const videosAndPodcasts = filterEntries(ENTRIES, {
      ...emptyFilters,
      kind: set("video", "podcast"),
    });
    expect(videosAndPodcasts.map((entry) => entry.format).sort()).toEqual(["podcast", "video"]);

    const contradiction = filterEntries(ENTRIES, {
      ...emptyFilters,
      kind: set("video"),
      apps: set("our-library"),
    });
    expect(contradiction).toEqual([]);
  });

  test("the app group filters by collection", () => {
    const ours = filterEntries(ENTRIES, { ...emptyFilters, apps: set("our-library") });
    expect(ours.map((entry) => entry.id)).toEqual(["harbourlight-app"]);
  });
});

describe("sorting", () => {
  test("newest first falls back to the added date and drops undated entries last", () => {
    const list = [
      make({ id: "old", added_date: "2020-01-01" }),
      make({ id: "undated", added_date: "" }),
      make({ id: "new", added_date: "2025-01-01" }),
    ];
    expect(sortNewest(list).map((entry) => entry.id)).toEqual(["new", "old", "undated"]);
    expect(sortNewest(list)).not.toBe(list);
  });

  test("relevance orders by score and breaks ties by recency", () => {
    const list = [
      make({ id: "tie-old", title: "sleep", added_date: "2020-01-01" }),
      make({ id: "tie-new", title: "sleep", added_date: "2025-01-01" }),
      make({ id: "weak", description: "sleep", added_date: "2026-01-01" }),
    ];
    expect(sortRelevance(list, ["sleep"]).map((entry) => entry.id)).toEqual([
      "tie-new",
      "tie-old",
      "weak",
    ]);
  });

  test("sortEntries uses best match only when there are terms", () => {
    const list = [
      make({ id: "newer", added_date: "2025-01-01", description: "sleep talk" }),
      make({ id: "older", added_date: "2020-01-01", title: "sleep" }),
    ];
    expect(sortEntries(list, "relevance", ["sleep"]).map((entry) => entry.id)).toEqual([
      "older",
      "newer",
    ]);
    expect(sortEntries(list, "newest", ["sleep"]).map((entry) => entry.id)).toEqual([
      "newer",
      "older",
    ]);
  });
});

describe("facet counts", () => {
  test("counts respond to the query and other groups", () => {
    expect(countForOption(ENTRIES, emptyFilters, "kind", "video")).toBe(1);

    const sleep = { ...emptyFilters, terms: searchTerms("sleep") };
    expect(countForOption(ENTRIES, sleep, "kind", "video")).toBe(0);
    expect(countForOption(ENTRIES, sleep, "kind", "tool")).toBe(1);
    expect(countForOption(ENTRIES, sleep, "who", "under-18")).toBe(2);
  });
});

describe("URL state", () => {
  test("parses filters, dropping unknown values", () => {
    const { kind, who, apps } = parseFilters(
      new URLSearchParams("kind=video&kind=bogus&who=under-18&apps=mindapps&kind=library"),
    );
    expect([...kind].sort()).toEqual(["library", "video"]);
    expect([...who]).toEqual(["under-18"]);
    expect([...apps]).toEqual(["mindapps"]);
  });

  test("best match is dropped without a query", () => {
    expect(parseSort(new URLSearchParams("sort=relevance&q=sleep"), "sleep")).toBe("relevance");
    expect(parseSort(new URLSearchParams("sort=relevance"), "")).toBeNull();
    expect(parseSort(new URLSearchParams("sort=newest"), "")).toBe("newest");
    expect(effectiveSort(null, [])).toBe("newest");
    expect(effectiveSort(null, ["sleep"])).toBe("relevance");
    expect(effectiveSort("newest", ["sleep"])).toBe("newest");
  });

  test("chips read in vocabulary order with labels", () => {
    const chips = activeFilterEntries({
      kind: set("video"),
      who: set("all-ages"),
      apps: set("mindapps"),
    });
    expect(chips).toEqual([
      { group: "kind", key: "video", label: "Videos" },
      { group: "who", key: "all-ages", label: "All ages" },
      { group: "apps", key: "mindapps", label: "MindApps.org" },
    ]);
  });

  test("describes the result count", () => {
    expect(describeCount(12, 12, false)).toBe("12 resources");
    expect(describeCount(3, 12, true)).toBe("3 of 12 resources");
    expect(describeCount(1, 12, true)).toBe("1 of 12 resources");
  });
});

describe("the full browse pipeline", () => {
  test("search plus newest sort reads newest first", () => {
    const terms = searchTerms("sleep");
    const results = sortEntries(
      filterEntries(ENTRIES, { ...emptyFilters, terms }),
      "newest",
      terms,
    );
    expect(results.map((entry) => entry.id)).toEqual(["sleep-habits-check-in", "harbourlight-app"]);
  });

  test("best match ranks title hits above description hits", () => {
    const terms = searchTerms("sleep");
    const results = sortEntries(
      filterEntries(ENTRIES, { ...emptyFilters, terms }),
      "relevance",
      terms,
    );
    expect(results.map((entry) => entry.id)).toEqual(["harbourlight-app", "sleep-habits-check-in"]);
  });
});

describe("highlighting", () => {
  test("splits text into plain and matched parts", () => {
    expect(highlightParts("Sleep Habits Check-In", ["sleep"])).toEqual([
      "",
      "Sleep",
      " Habits Check-In",
    ]);
    expect(highlightParts("no match here", ["zzz"])).toEqual(["no match here"]);
    expect(highlightParts("no match", [])).toEqual(["no match"]);
  });
});
