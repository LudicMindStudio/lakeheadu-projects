// The browsing state: the results rail floating over the map. Compact,
// comparable rows; search, sort, filters, and the active chips live here.

import { useEffect, useMemo, useRef } from "react";
import EntryRow from "./EntryRow.jsx";
import FilterPanel from "./FilterPanel.jsx";
import { FILTER_GROUPS, SORTS, optionLabel } from "../data/filters.js";
import { TOWNS } from "../data/towns.js";
import { distanceFromTown } from "../lib/directory.js";

export default function ResultsRail({
  total,
  results,
  query,
  sort,
  town,
  filters,
  areaActive,
  autoFocusSearch,
  hoveredSlug,
  onHoverRow,
  onSearchChange,
  onSortChange,
  onTownChange,
  onToggleFilter,
  onClearFilters,
  onClearArea,
  onClearAll,
  panelOpen,
  onTogglePanel,
}) {
  const searchRef = useRef(null);

  useEffect(() => {
    if (autoFocusSearch) {
      searchRef.current?.focus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeCount = FILTER_GROUPS.reduce((sum, group) => sum + filters[group.id].length, 0);
  const narrowed = query.trim() !== "" || activeCount > 0 || areaActive;
  const countText = narrowed
    ? `${results.length} of ${total} services`
    : `${results.length} ${results.length === 1 ? "service" : "services"}`;

  const chips = FILTER_GROUPS.flatMap((group) =>
    filters[group.id].map((value) => ({
      groupId: group.id,
      value,
      label: optionLabel(group.id, value),
    })),
  );

  const rows = useMemo(
    () =>
      results.map((entry) => ({
        entry,
        distance: sort === "closest" && town ? distanceFromTown(entry, town) : null,
      })),
    [results, sort, town],
  );

  return (
    <aside className="rail" aria-label="Service results">
      <div className="rail-head">
        <div className="rail-head-top">
          <p className="rail-count" aria-live="polite">
            {countText}
          </p>
          <button
            type="button"
            className="rail-filters-btn"
            aria-expanded={panelOpen}
            aria-controls="filter-panel"
            onClick={onTogglePanel}
          >
            {activeCount > 0 ? `Filters (${activeCount})` : "Filters"}
          </button>
        </div>
        <label className="sr-only" htmlFor="rail-search">
          Search services
        </label>
        <input
          ref={searchRef}
          id="rail-search"
          className="rail-search"
          type="search"
          value={query}
          placeholder="Search services"
          autoComplete="off"
          onChange={(event) => onSearchChange(event.target.value)}
        />
        <div className="rail-tools">
          <label className="rail-control">
            <span className="rail-control-label">Sort</span>
            <select value={sort} onChange={(event) => onSortChange(event.target.value)}>
              {SORTS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          {sort === "closest" && (
            <label className="rail-control">
              <span className="rail-control-label">Closest to</span>
              <select value={town} onChange={(event) => onTownChange(event.target.value)}>
                <option value="">Choose a town</option>
                {TOWNS.map((option) => (
                  <option key={option.name} value={option.name}>
                    {option.name}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
        {sort === "closest" && !town && (
          <p className="rail-hint">Choose a town to sort by distance.</p>
        )}
        {(chips.length > 0 || areaActive) && (
          <div className="rail-chips">
            {areaActive && (
              <button
                type="button"
                className="chip"
                aria-label="Remove filter: In this area"
                onClick={onClearArea}
              >
                <span>In this area</span>
                <span aria-hidden="true">×</span>
              </button>
            )}
            {chips.map((chip) => (
              <button
                key={`${chip.groupId}:${chip.value}`}
                type="button"
                className="chip"
                aria-label={`Remove filter: ${chip.label}`}
                onClick={() => onToggleFilter(chip.groupId, chip.value)}
              >
                <span>{chip.label}</span>
                <span aria-hidden="true">×</span>
              </button>
            ))}
            <button type="button" className="chip-clear" onClick={onClearFilters}>
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {panelOpen && (
        <FilterPanel
          id="filter-panel"
          filters={filters}
          onToggle={onToggleFilter}
          onClear={onClearFilters}
          onClose={onTogglePanel}
        />
      )}

      <div className="rail-list">
        {results.length === 0 ? (
          <div className="rail-empty">
            <p>No services match your search.</p>
            <button type="button" className="btn-quiet" onClick={onClearAll}>
              Clear search and filters
            </button>
          </div>
        ) : (
          <ul className="rail-rows">
            {rows.map(({ entry, distance }) => (
              <EntryRow
                key={entry.slug}
                entry={entry}
                distance={distance}
                hovered={entry.slug === hoveredSlug}
                onHover={onHoverRow}
              />
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
