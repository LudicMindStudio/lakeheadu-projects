import { useCallback, useEffect, useState } from "react";
import { flushSync } from "react-dom";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import EntryCard from "../components/EntryCard.jsx";
import FilterPanel from "../components/FilterPanel.jsx";
import { AGE_GROUPS, COLLECTIONS, FORMATS } from "../lib/entries.js";
import { useEntries } from "../lib/useEntries.js";
import { morphWithTransition, useDocumentVisible } from "../lib/motion.js";
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
  sortNewest,
} from "../lib/browse.js";

// The grid surface. A fresh arrival at / opens the ring: a center panel boxed
// in by the eight latest cards. Typing, or the browse link, swaps it into the
// list, and clearing the search brings the ring back. Both swaps run through
// one animated morph. /browse opens the list directly.
export default function GridPage() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const entries = useEntries();
  const [params, setParams] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const visible = useDocumentVisible();

  const query = parseQuery(params);
  const terms = searchTerms(query);
  const { kind, who, apps } = parseFilters(params);
  const sortParam = parseSort(params, query);
  const sort = effectiveSort(sortParam, terms);

  const state = { terms, kind, who, apps };
  const results = sortEntries(filterEntries(entries, state), sort, terms);
  const chips = activeFilterEntries({ kind, who, apps });
  const activeCount = chips.length;
  const filtersEmpty = kind.size === 0 && who.size === 0 && apps.size === 0;
  const hasState = terms.length > 0 || !filtersEmpty || sortParam !== null;
  const narrowed = terms.length > 0 || activeCount > 0;

  const atRoot = pathname === "/";
  const ring = atRoot && !hasState;

  useEffect(() => {
    document.title = ring ? "Resources & tools" : "Browse · Resources & tools";
  }, [ring]);

  const counts = {
    kind: Object.fromEntries(
      FORMATS.map((format) => [format.key, countForOption(entries, state, "kind", format.key)]),
    ),
    who: Object.fromEntries(
      AGE_GROUPS.map((group) => [group.key, countForOption(entries, state, "who", group.key)]),
    ),
    apps: Object.fromEntries(
      COLLECTIONS.map((collection) => [
        collection.key,
        countForOption(entries, state, "apps", collection.key),
      ]),
    ),
  };

  const update = useCallback(
    (mutate) => {
      setParams(
        (previous) => {
          const next = new URLSearchParams(previous);
          mutate(next);
          return next;
        },
        { replace: true },
      );
    },
    [setParams],
  );

  // Both swaps between the ring and the list land inside a view transition,
  // so the surfaces cross with one clean wash and the search bar travels.
  const morph = useCallback((apply) => {
    morphWithTransition(() => flushSync(apply));
  }, []);

  const onQueryChange = (value) => {
    if (ring && value !== "") {
      const next = new URLSearchParams(params);
      next.set("q", value);
      morph(() => setParams(next, { replace: true }));
      return;
    }
    // Clearing the last of the search state brings the ring back.
    if (atRoot && !ring && value === "" && query !== "" && filtersEmpty) {
      morph(() =>
        update((next) => {
          next.delete("q");
          next.delete("sort");
        }),
      );
      return;
    }
    update((next) => {
      if (value === "") {
        next.delete("q");
        next.delete("sort");
      } else {
        next.set("q", value);
      }
    });
  };

  const onSortChange = (value) => update((next) => next.set("sort", value));

  const onToggleFilter = (group, key) => {
    const selected = group === "kind" ? kind : group === "who" ? who : apps;
    // Removing the last active filter empties the state, so the ring returns.
    const returnsToRing =
      atRoot &&
      !ring &&
      selected.has(key) &&
      activeCount === 1 &&
      query === "" &&
      sortParam === null;
    const apply = () =>
      update((next) => {
        const values = next.getAll(group);
        next.delete(group);
        const nextValues = values.includes(key)
          ? values.filter((value) => value !== key)
          : [...values, key];
        for (const value of nextValues) next.append(group, value);
      });
    if (returnsToRing) morph(apply);
    else apply();
  };

  const clearFilters = () => {
    const returnsToRing = atRoot && !ring && !filtersEmpty && query === "" && sortParam === null;
    const apply = () =>
      update((next) => {
        next.delete("kind");
        next.delete("who");
        next.delete("apps");
      });
    if (returnsToRing) morph(apply);
    else apply();
  };

  const onBrowseAll = (event) => {
    event.preventDefault();
    morph(() => navigate("/browse"));
  };

  const linkParams = new URLSearchParams(params);
  linkParams.delete("intro");
  const browseSearch = linkParams.toString() ? `?${linkParams.toString()}` : "";
  const ringCards = sortNewest(entries).slice(0, 8);
  const cards = ring ? ringCards : results;

  return (
    <section
      className="stage"
      data-state={ring ? "ring" : "list"}
      data-away={visible ? undefined : "true"}
    >
      <div className="masthead">
        <h1 className={ring ? "masthead-title" : "visually-hidden"}>Resources &amp; tools</h1>
        {ring && (
          <p className="masthead-promise">
            Find trusted resources and tools on digital mental health technology, in one searchable
            place.
          </p>
        )}
        <div className="searchbar">
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
            spellCheck="false"
            onChange={(event) => onQueryChange(event.target.value)}
          />
          {query !== "" && (
            <button
              type="button"
              className="search-clear"
              aria-label="Clear search"
              onClick={() => onQueryChange("")}
            >
              ×
            </button>
          )}
        </div>
        {ring && (
          <div className="masthead-notes">
            <p>Type to search, or browse the shelf around you.</p>
            <p>Filters for kind, age, and app directory appear with the results.</p>
            <p className="masthead-browse">
              <a href="/browse" onClick={onBrowseAll}>
                Browse everything
              </a>
            </p>
          </div>
        )}
      </div>

      <div className="controls">
        <p className="results-count" role="status">
          {describeCount(results.length, entries.length, narrowed)}
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
        <div className="cards">
          {cards.map((entry, index) => (
            <EntryCard
              key={entry.id}
              entry={entry}
              terms={terms}
              browseSearch={browseSearch}
              expandable={!ring}
              style={ring ? { "--drift-delay": `${index * 9}s` } : undefined}
            />
          ))}
        </div>
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
    </section>
  );
}
