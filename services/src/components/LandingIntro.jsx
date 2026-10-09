// The landing state: the promise, a large search, and the counted category
// row over the live map. It recedes on the first real interaction.

import { FILTER_GROUPS } from "../data/filters.js";
import { TILE_ATTRIBUTION } from "../data/mapConfig.js";

const CONCERNS = FILTER_GROUPS.find((group) => group.id === "concerns");

export default function LandingIntro({
  entries,
  query,
  leaving,
  onSearchChange,
  onCategory,
  onAllServices,
}) {
  const counts = new Map(CONCERNS.options.map((option) => [option.value, 0]));
  for (const entry of entries) {
    for (const value of entry.concerns) {
      if (counts.has(value)) {
        counts.set(value, counts.get(value) + 1);
      }
    }
  }

  return (
    <section className={`intro${leaving ? " is-leaving" : ""}`} aria-label="Find services">
      <p className="intro-kicker">Services · Northwestern Ontario</p>
      <h1 className="intro-title">
        Find services across Northwestern Ontario, and the first step to get started.
      </h1>
      <p className="intro-lede">
        Browse the map for what fits — what each service offers, what it costs, and how to start.
      </p>
      <div className="intro-search-wrap">
        <label className="sr-only" htmlFor="intro-search">
          Search services
        </label>
        <input
          id="intro-search"
          className="intro-search"
          type="search"
          placeholder="Search by name, town, or what you need"
          value={query}
          autoComplete="off"
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </div>
      <div className="intro-cats-row" role="group" aria-labelledby="intro-cats-label">
        <span className="intro-cats-label" id="intro-cats-label">
          I want help with:
        </span>
        {CONCERNS.options.map((option) => (
          <button
            key={option.value}
            type="button"
            className="cat-chip"
            data-cat={option.value}
            aria-label={`${option.label}, ${counts.get(option.value) ?? 0} services`}
            onClick={() => onCategory(option.value)}
          >
            <span className="cat-dot" aria-hidden="true" />
            <span>{option.label}</span>
            <span className="cat-count">{counts.get(option.value) ?? 0}</span>
          </button>
        ))}
        <button type="button" className="intro-all" onClick={onAllServices}>
          All services
        </button>
      </div>
      <p className="intro-fine">Map {TILE_ATTRIBUTION}.</p>
    </section>
  );
}
