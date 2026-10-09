import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import EntryCard from "../components/EntryCard.jsx";
import FilterPanel from "../components/FilterPanel.jsx";
import { AGE_GROUPS, COLLECTIONS, ENTRIES, FORMATS } from "../lib/entries.js";
import {
  activeFilterEntries,
  countForOption,
  describeCount,
  effectiveSort,
  filterEntries,
  parseFilters,
  parseQuery,
  parseSort,
  searchTerms,
  sortEntries,
} from "../lib/browse.js";

export default function BrowsePage() {
  const [params, setParams] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    document.title = "Browse · Resources & tools";
  }, []);

  const query = parseQuery(params);
  const terms = searchTerms(query);
  const { kind, who, apps } = parseFilters(params);
  const sortParam = parseSort(params, query);
  const sort = effectiveSort(sortParam, terms);

  const state = { terms, kind, who, apps };
  const results = sortEntries(filterEntries(ENTRIES, state), sort, terms);

  const counts = {
    kind: Object.fromEntries(
      FORMATS.map((format) => [format.key, countForOption(ENTRIES, state, "kind", format.key)]),
    ),
    who: Object.fromEntries(
      AGE_GROUPS.map((group) => [group.key, countForOption(ENTRIES, state, "who", group.key)]),
    ),
    apps: Object.fromEntries(
      COLLECTIONS.map((collection) => [
        collection.key,
        countForOption(ENTRIES, state, "apps", collection.key),
      ]),
    ),
  };

  const chips = activeFilterEntries({ kind, who, apps });
  const activeCount = chips.length;
  const narrowed = terms.length > 0 || activeCount > 0;

  const update = (mutate) =>
    setParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        mutate(next);
        return next;
      },
      { replace: true },
    );

  const onQueryChange = (value) =>
    update((next) => {
      if (value === "") {
        next.delete("q");
        // Clearing the query also ends an explicit sort choice.
        next.delete("sort");
      } else {
        next.set("q", value);
      }
    });

  const onSortChange = (value) => update((next) => next.set("sort", value));

  const onToggleFilter = (group, key) =>
    update((next) => {
      const values = next.getAll(group);
      next.delete(group);
      const nextValues = values.includes(key)
        ? values.filter((value) => value !== key)
        : [...values, key];
      for (const value of nextValues) next.append(group, value);
    });

  const clearFilters = () =>
    update((next) => {
      next.delete("kind");
      next.delete("who");
      next.delete("apps");
    });

  const browseSearch = params.toString() ? `?${params.toString()}` : "";

  return (
    <>
      <h1>What would you like to find?</h1>

      <div className="search-row">
        <label className="visually-hidden" htmlFor="search-input">
          Search resources
        </label>
        <input
          id="search-input"
          className="search-input"
          type="search"
          value={query}
          placeholder="Search by title, topic, or source"
          autoComplete="off"
          onChange={(event) => onQueryChange(event.target.value)}
        />
      </div>

      <div className="results-bar">
        <p className="results-count" role="status">
          {describeCount(results.length, ENTRIES.length, narrowed)}
        </p>
        <div className="results-controls">
          <button
            type="button"
            className="filters-toggle"
            aria-expanded={filtersOpen}
            aria-controls="filters-panel"
            onClick={() => setFiltersOpen((open) => !open)}
          >
            {activeCount > 0 ? `Filters (${activeCount})` : "Filters"}
          </button>
          <label className="sort-control">
            <span>Sort</span>
            <select value={sort} onChange={(event) => onSortChange(event.target.value)}>
              <option value="newest">Newest first</option>
              <option value="relevance" disabled={terms.length === 0}>
                Best match
              </option>
            </select>
          </label>
        </div>
      </div>

      {chips.length > 0 && (
        <ul className="chips">
          {chips.map((chip) => (
            <li className="chip" key={`${chip.group}-${chip.key}`}>
              <span>{chip.label}</span>
              <button
                type="button"
                aria-label={`Remove filter: ${chip.label}`}
                onClick={() => onToggleFilter(chip.group, chip.key)}
              >
                ×
              </button>
            </li>
          ))}
          <li className="chips-clear">
            <button type="button" className="link-button" onClick={clearFilters}>
              Clear all
            </button>
          </li>
        </ul>
      )}

      <FilterPanel
        open={filtersOpen}
        counts={counts}
        selected={{ kind, who, apps }}
        onToggle={onToggleFilter}
        onClose={() => setFiltersOpen(false)}
      />

      {results.length > 0 ? (
        <ul className="entry-list">
          {results.map((entry) => (
            <EntryCard key={entry.id} entry={entry} terms={terms} browseSearch={browseSearch} />
          ))}
        </ul>
      ) : (
        <div className="empty-state">
          <p className="empty-title">No matches yet.</p>
          <p className="empty-text">
            Nothing fits all of those together — try removing a filter, or search for something
            else.
          </p>
          <div className="empty-actions">
            {terms.length > 0 && (
              <button type="button" className="button-secondary" onClick={() => onQueryChange("")}>
                Clear search
              </button>
            )}
            {activeCount > 0 && (
              <button type="button" className="button-secondary" onClick={clearFilters}>
                Clear all filters
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
