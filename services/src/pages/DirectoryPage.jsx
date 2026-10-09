import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import EntryRow from "../components/EntryRow.jsx";
import FilterPanel from "../components/FilterPanel.jsx";
import { ENTRIES } from "../data/entries.js";
import { FILTER_GROUPS, SORTS, optionLabel } from "../data/filters.js";
import { TOWNS } from "../data/towns.js";
import { distanceFromTown, selectEntries } from "../lib/directory.js";

const TOWN_NAMES = new Set(TOWNS.map((town) => town.name));
const SORT_VALUES = new Set(SORTS.map((option) => option.value));

function parseList(value, options) {
  if (!value) {
    return [];
  }
  const known = new Set(options.map((option) => option.value));
  return value.split(",").filter((item) => known.has(item));
}

export default function DirectoryPage() {
  const [params, setParams] = useSearchParams();
  const [panelOpen, setPanelOpen] = useState(false);

  const query = params.get("q") ?? "";
  const sortParam = params.get("sort") ?? "relevance";
  const sort = SORT_VALUES.has(sortParam) ? sortParam : "relevance";
  const townParam = params.get("town") ?? "";
  const town = TOWN_NAMES.has(townParam) ? townParam : "";

  const filters = Object.fromEntries(
    FILTER_GROUPS.map((group) => [group.id, parseList(params.get(group.id), group.options)]),
  );

  const updateParams = (changes) => {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        for (const [key, value] of Object.entries(changes)) {
          if (value === null || value === "") {
            next.delete(key);
          } else {
            next.set(key, value);
          }
        }
        return next;
      },
      { replace: true },
    );
  };

  const toggleFilter = (groupId, value) => {
    const current = filters[groupId];
    const next = current.includes(value)
      ? current.filter((item) => item !== value)
      : [...current, value];
    updateParams({ [groupId]: next.join(",") });
  };

  const clearFilters = () => {
    updateParams(Object.fromEntries(FILTER_GROUPS.map((group) => [group.id, null])));
  };

  const clearAll = () => {
    updateParams({
      q: null,
      ...Object.fromEntries(FILTER_GROUPS.map((group) => [group.id, null])),
    });
  };

  const results = selectEntries(ENTRIES, { query, filters, sort, town });
  const activeCount = FILTER_GROUPS.reduce((sum, group) => sum + filters[group.id].length, 0);
  const narrowed = query.trim() !== "" || activeCount > 0;
  const countText = narrowed
    ? `${results.length} of ${ENTRIES.length} services`
    : `${results.length} ${results.length === 1 ? "service" : "services"}`;

  const chips = FILTER_GROUPS.flatMap((group) =>
    filters[group.id].map((value) => ({
      groupId: group.id,
      value,
      label: optionLabel(group.id, value),
    })),
  );

  const showTown = sort === "closest";
  const rows = results.map((entry) => ({
    entry,
    distance: showTown && town ? distanceFromTown(entry, town) : null,
  }));

  return (
    <>
      <div className="page-head">
        <h1>Find services</h1>
        <p className="lede">
          Search by name, town, or what you need. Use filters to narrow by cost, way to get help,
          age, and more.
        </p>
      </div>

      <div className="search-field">
        <label className="sr-only" htmlFor="directory-search">
          Search services
        </label>
        <input
          id="directory-search"
          type="search"
          value={query}
          onChange={(event) => updateParams({ q: event.target.value })}
          placeholder="Search by name, town, or what you need"
        />
      </div>

      <div className="controls-row">
        <p className="result-count">{countText}</p>
        <div className="controls">
          <label className="control">
            Sort by
            <select
              value={sort}
              onChange={(event) =>
                updateParams({
                  sort: event.target.value === "relevance" ? null : event.target.value,
                })
              }
            >
              {SORTS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          {showTown && (
            <label className="control">
              Closest to
              <select value={town} onChange={(event) => updateParams({ town: event.target.value })}>
                <option value="">Choose a town</option>
                {TOWNS.map((option) => (
                  <option key={option.name} value={option.name}>
                    {option.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <button
            type="button"
            className="btn-quiet"
            aria-expanded={panelOpen}
            aria-controls="filter-panel"
            onClick={() => setPanelOpen((open) => !open)}
          >
            {activeCount > 0 ? `Filters (${activeCount})` : "Filters"}
          </button>
        </div>
      </div>

      {showTown && !town && <p className="hint">Choose a town to sort by distance.</p>}

      {chips.length > 0 && (
        <div className="chips">
          {chips.map((chip) => (
            <button
              key={`${chip.groupId}:${chip.value}`}
              type="button"
              className="chip"
              aria-label={`Remove filter: ${chip.label}`}
              onClick={() => toggleFilter(chip.groupId, chip.value)}
            >
              <span>{chip.label}</span>
              <span aria-hidden="true">×</span>
            </button>
          ))}
          <button type="button" className="chip-clear" onClick={clearFilters}>
            Clear all filters
          </button>
        </div>
      )}

      {panelOpen && <FilterPanel id="filter-panel" filters={filters} onToggle={toggleFilter} />}

      {results.length === 0 ? (
        <div className="empty">
          <p>No services match your search.</p>
          <button type="button" className="btn-quiet" onClick={clearAll}>
            Clear search and filters
          </button>
        </div>
      ) : (
        <ul className="results">
          {rows.map(({ entry, distance }) => (
            <EntryRow key={entry.slug} entry={entry} distance={distance} />
          ))}
        </ul>
      )}
    </>
  );
}
