// The map experience. One persistent map under the landing intro, the
// browsing rail, and an entry opened as a split of the window.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useMatch, useNavigate, useSearchParams } from "react-router-dom";
import EntrySplit from "../components/EntrySplit.jsx";
import LandingIntro from "../components/LandingIntro.jsx";
import MapCanvas from "../components/map/MapCanvas.jsx";
import ResultsRail from "../components/ResultsRail.jsx";
import { useEntries } from "../data/entrySource.js";
import { FILTER_GROUPS, SORTS } from "../data/filters.js";
import { TOWNS } from "../data/towns.js";
import { formatArea, parseArea, selectEntries } from "../lib/directory.js";

const TOWN_NAMES = new Set(TOWNS.map((town) => town.name));
const SORT_VALUES = new Set(SORTS.map((option) => option.value));
const LEAVE_MS = 280;

function parseList(value, options) {
  if (!value) {
    return [];
  }
  const known = new Set(options.map((option) => option.value));
  return value.split(",").filter((item) => known.has(item));
}

export default function MapPage() {
  const entries = useEntries();
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const entryMatch = useMatch("/entry/:slug");

  const [arrivedAtEntry] = useState(() => entryMatch !== null);
  const [hoveredSlug, setHoveredSlug] = useState(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [railFocus, setRailFocus] = useState(false);
  const [phase, setPhase] = useState(() =>
    params.toString() !== "" || arrivedAtEntry ? "browse" : "intro",
  );
  const phaseRef = useRef(phase);
  const leaveTimer = useRef(null);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => () => window.clearTimeout(leaveTimer.current), []);

  // The intro recedes on the first real interaction and does not come back
  // in the same visit. Reloading restores it.
  const recede = useCallback((focusSearch = false) => {
    if (phaseRef.current !== "intro") {
      return;
    }
    if (focusSearch) {
      setRailFocus(true);
    }
    phaseRef.current = "leaving";
    setPhase("leaving");
    window.clearTimeout(leaveTimer.current);
    leaveTimer.current = window.setTimeout(() => {
      phaseRef.current = "browse";
      setPhase("browse");
      setRailFocus(false);
    }, LEAVE_MS);
  }, []);

  const browse = useMemo(() => {
    const query = params.get("q") ?? "";
    const sortParam = params.get("sort") ?? "relevance";
    const sort = SORT_VALUES.has(sortParam) ? sortParam : "relevance";
    const townParam = params.get("town") ?? "";
    const town = TOWN_NAMES.has(townParam) ? townParam : "";
    const filters = Object.fromEntries(
      FILTER_GROUPS.map((group) => [group.id, parseList(params.get(group.id), group.options)]),
    );
    const area = parseArea(params.get("area"));
    return { query, sort, town, filters, area };
  }, [params]);

  const results = useMemo(() => (entries ? selectEntries(entries, browse) : []), [entries, browse]);
  const matchedSlugs = useMemo(
    () => (entries && results.length === entries.length ? null : results.map((item) => item.slug)),
    [entries, results],
  );

  const slug = entryMatch?.params?.slug ?? null;
  const entry = useMemo(
    () => (entries && slug ? (entries.find((item) => item.slug === slug) ?? null) : null),
    [entries, slug],
  );

  const activeCategory = browse.filters.concerns.length === 1 ? browse.filters.concerns[0] : null;

  const updateParams = useCallback(
    (changes) => {
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
    },
    [setParams],
  );

  const handleSearchChange = useCallback(
    (value, { fromIntro = false } = {}) => {
      updateParams({ q: value });
      if (fromIntro) {
        recede(true);
      }
    },
    [updateParams, recede],
  );

  const handleCategory = useCallback(
    (value) => {
      updateParams({ concerns: value });
      recede();
    },
    [updateParams, recede],
  );

  const toggleFilter = useCallback(
    (groupId, value) => {
      const current = browse.filters[groupId] ?? [];
      const next = current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value];
      updateParams({ [groupId]: next.join(",") });
    },
    [browse.filters, updateParams],
  );

  const clearFilters = useCallback(() => {
    updateParams(Object.fromEntries(FILTER_GROUPS.map((group) => [group.id, null])));
  }, [updateParams]);

  const clearAll = useCallback(() => {
    updateParams({
      q: null,
      area: null,
      ...Object.fromEntries(FILTER_GROUPS.map((group) => [group.id, null])),
    });
  }, [updateParams]);

  const handleSortChange = useCallback(
    (value) => {
      updateParams({ sort: value === "relevance" ? null : value });
    },
    [updateParams],
  );

  const handleTownChange = useCallback(
    (value) => {
      updateParams({ town: value });
    },
    [updateParams],
  );

  const handleAreaSearch = useCallback(
    (bounds) => {
      updateParams({ area: formatArea(bounds) });
      recede();
    },
    [updateParams, recede],
  );

  const clearArea = useCallback(() => {
    updateParams({ area: null });
  }, [updateParams]);

  const openEntry = useCallback(
    (item) => {
      recede();
      navigate(`/entry/${item.slug}`, {
        state: { from: `${location.pathname}${location.search}` },
      });
    },
    [navigate, location, recede],
  );

  const closeEntry = useCallback(() => {
    const from = location.state?.from;
    if (typeof from === "string" && from.startsWith("/")) {
      navigate(from);
    } else {
      navigate("/");
    }
  }, [navigate, location]);

  const introProps = {
    entries: entries ?? [],
    query: browse.query,
    onSearchChange: (value) => handleSearchChange(value, { fromIntro: true }),
    onCategory: handleCategory,
    onAllServices: () => recede(),
  };

  return (
    <div className="map-shell">
      <MapCanvas
        entries={entries ?? []}
        matchedSlugs={matchedSlugs}
        hoveredSlug={hoveredSlug}
        selectedSlug={slug}
        activeCategory={activeCategory}
        focusEntry={entry}
        receded={phase !== "intro"}
        areaBounds={browse.area}
        preRoll={arrivedAtEntry}
        onAreaSearch={handleAreaSearch}
        onFirstInteraction={recede}
        onHoverChange={setHoveredSlug}
        onOpenEntry={openEntry}
      />

      <header className="map-brand">
        <Link className="map-brand-link" to="/">
          Services
        </Link>
      </header>

      <main id="main" className="map-ui" tabIndex={-1}>
        {slug && <div className="map-scrim" aria-hidden="true" />}
        {slug ? (
          entry ? (
            <EntrySplit key={entry.slug} entry={entry} onClose={closeEntry} />
          ) : entries ? (
            <div
              className="entry-card entry-card-missing"
              role="dialog"
              aria-label="Service not found"
            >
              <div className="ec-scroll">
                <h1 className="ec-program">Service not found</h1>
                <p className="muted">This service listing does not exist, or may have moved.</p>
                <p>
                  <button type="button" className="btn-quiet" onClick={closeEntry}>
                    Back to the map
                  </button>
                </p>
              </div>
            </div>
          ) : null
        ) : phase === "intro" ? (
          entries ? (
            <LandingIntro {...introProps} leaving={false} />
          ) : null
        ) : (
          <>
            {phase === "leaving" && entries && <LandingIntro {...introProps} leaving />}
            {entries && (
              <ResultsRail
                total={entries.length}
                results={results}
                query={browse.query}
                sort={browse.sort}
                town={browse.town}
                filters={browse.filters}
                areaActive={Boolean(browse.area)}
                autoFocusSearch={railFocus}
                hoveredSlug={hoveredSlug}
                onHoverRow={setHoveredSlug}
                onSearchChange={handleSearchChange}
                onSortChange={handleSortChange}
                onTownChange={handleTownChange}
                onToggleFilter={toggleFilter}
                onClearFilters={clearFilters}
                onClearArea={clearArea}
                onClearAll={clearAll}
                panelOpen={panelOpen}
                onTogglePanel={() => setPanelOpen((open) => !open)}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}
