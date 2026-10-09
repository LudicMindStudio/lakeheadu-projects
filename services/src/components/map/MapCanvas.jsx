// The map surface. MapLibre GL over the vendored warm-palette tile set, with
// one pin per listing, quiet town and lake labels, the hover preview, and the
// camera moves that open an entry as a split of the same window.

import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import * as maplibregl from "maplibre-gl";
import maplibreWorkerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?url";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  MAP_CONFIG,
  TILE_TEMPLATE,
  TOWN_LABEL_EAST_OF,
  TOWN_LABEL_OFFSETS,
  WATER_LABELS,
} from "../../data/mapConfig.js";
import { TOWNS } from "../../data/towns.js";
import { STATUS_LABELS } from "../../data/filters.js";
import { fanIndices, fanOffset, fanScale } from "../../lib/mapPins.js";
import { raiseHandsSvg } from "../raiseHandsMarkup.js";

// The map worker ships with the map library. The bundler emits it as an
// asset and MapLibre is pointed at it here.
maplibregl.setWorkerUrl(maplibreWorkerUrl);

const ENTRY_CARD_OFFSET_X = 280; // px: centers the pin in the open area left of the card
const MOBILE_BREAKPOINT = 900;
const HOVER_INTENT_MS = 80;

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function boundsRect(map) {
  const bounds = map.getBounds();
  return {
    west: bounds.getWest(),
    south: bounds.getSouth(),
    east: bounds.getEast(),
    north: bounds.getNorth(),
  };
}

function rectsClose(a, b) {
  if (!a || !b) {
    return false;
  }
  const tolerance = 0.035;
  return (
    Math.abs(a.west - b.west) < tolerance &&
    Math.abs(a.south - b.south) < tolerance &&
    Math.abs(a.east - b.east) < tolerance &&
    Math.abs(a.north - b.north) < tolerance
  );
}

export default function MapCanvas({
  entries = [],
  matchedSlugs = null,
  hoveredSlug = null,
  selectedSlug = null,
  activeCategory = null,
  focusEntry = null,
  receded = false,
  areaBounds = null,
  preRoll = false,
  resetSignal = 0,
  onAreaSearch,
  onFirstInteraction,
  onHoverChange,
  onOpenEntry,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef(new Map());
  const labelsRef = useRef([]);
  const cameraRef = useRef(null);
  const frameBoundsRef = useRef(null);
  const firstInteractionRef = useRef(false);
  const flownOnceRef = useRef(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [drifted, setDrifted] = useState(false);

  // Latest props for handlers the map owns (they outlive any single render).
  const latest = {
    matchedSlugs,
    hoveredSlug,
    selectedSlug,
    activeCategory,
    focusEntry,
    receded,
    areaBounds,
    preRoll,
    onAreaSearch,
    onFirstInteraction,
    onHoverChange,
    onOpenEntry,
  };
  const propsRef = useRef(latest);
  useEffect(() => {
    propsRef.current = latest;
  });

  const syncPinClasses = (state) => {
    const matchedSet = state.matchedSlugs ? new Set(state.matchedSlugs) : null;
    for (const [slug, rec] of markersRef.current) {
      const el = rec.el;
      const isMatched = !matchedSet || matchedSet.has(slug);
      el.classList.toggle("is-ghost", !isMatched);
      el.classList.toggle("is-active", slug === state.hoveredSlug);
      el.classList.toggle("is-selected", slug === state.selectedSlug);
      const isCat =
        isMatched &&
        state.activeCategory !== null &&
        rec.entry.concerns.includes(state.activeCategory);
      el.classList.toggle("is-cat", isCat);
      if (isCat) {
        el.dataset.cat = state.activeCategory;
      } else {
        delete el.dataset.cat;
      }
      el.tabIndex = isMatched ? 0 : -1;
      el.setAttribute("aria-hidden", isMatched ? "false" : "true");
    }
  };

  const syncFanOffsets = () => {
    const map = mapRef.current;
    if (!map) {
      return;
    }
    const scale = fanScale(map.getZoom());
    for (const rec of markersRef.current.values()) {
      const [dx, dy] = fanOffset(rec.fanIndex);
      rec.marker.setOffset([dx * scale, dy * scale]);
    }
  };

  const createPin = (entry, fanIndex, order) => {
    const map = mapRef.current;
    const el = document.createElement("div");
    el.className = "pin";
    el.dataset.slug = entry.slug;
    el.tabIndex = 0;
    el.setAttribute("role", "button");
    el.setAttribute("aria-label", `${entry.program}, ${entry.org}, ${entry.region}`);

    const body = document.createElement("span");
    body.className = "pin-body";
    body.style.animationDelay = `${Math.min(order, 14) * 45}ms`;

    const preview = document.createElement("span");
    preview.className = "pin-preview";
    preview.setAttribute("aria-hidden", "true");

    const title = document.createElement("span");
    title.className = "pin-preview-title";
    if (entry.status && STATUS_LABELS[entry.status]) {
      const bubble = document.createElement("span");
      bubble.className = `status-bubble status-${entry.status}`;
      bubble.title = STATUS_LABELS[entry.status];
      title.append(bubble);
    }
    const program = document.createElement("span");
    program.className = "pin-preview-program";
    program.textContent = entry.program;
    title.append(program);

    const org = document.createElement("span");
    org.className = "pin-preview-org";
    org.textContent = `${entry.org} · ${entry.region}`;

    preview.append(title, org);

    const step = document.createElement("span");
    step.className = "pin-preview-step";
    step.title = entry.firstStep;
    const stepIcon = document.createElement("span");
    stepIcon.className = "pin-preview-step-icon";
    stepIcon.innerHTML = raiseHandsSvg(15);
    step.append(stepIcon, document.createTextNode(entry.firstStepShort || entry.firstStep));
    preview.append(step);

    const ring = document.createElement("span");
    ring.className = "pin-ring";
    const dot = document.createElement("span");
    dot.className = "pin-dot";
    body.append(preview, ring, dot);
    el.append(body);

    let hoverTimer = null;
    el.addEventListener("mouseenter", () => {
      hoverTimer = window.setTimeout(() => {
        el.classList.add("is-hot");
        propsRef.current.onHoverChange?.(entry.slug);
      }, HOVER_INTENT_MS);
    });
    el.addEventListener("mouseleave", () => {
      if (hoverTimer) {
        window.clearTimeout(hoverTimer);
      }
      el.classList.remove("is-hot");
      propsRef.current.onHoverChange?.(null);
    });
    el.addEventListener("focus", () => {
      el.classList.add("is-hot");
      propsRef.current.onHoverChange?.(entry.slug);
    });
    el.addEventListener("blur", () => {
      el.classList.remove("is-hot");
      propsRef.current.onHoverChange?.(null);
    });
    el.addEventListener("click", (event) => {
      event.stopPropagation();
      if (!el.classList.contains("is-ghost")) {
        propsRef.current.onOpenEntry?.(entry);
      }
    });
    el.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        if (!el.classList.contains("is-ghost")) {
          propsRef.current.onOpenEntry?.(entry);
        }
      }
    });

    const marker = new maplibregl.Marker({ element: el, anchor: "center" })
      .setLngLat([entry.lng, entry.lat])
      .addTo(map);

    return { marker, el, entry, fanIndex };
  };

  // Create the map once. The canvas paints the vendored region immediately.
  useEffect(() => {
    if (mapRef.current || !containerRef.current) {
      return undefined;
    }
    let map;
    try {
      map = new maplibregl.Map({
        container: containerRef.current,
        style: {
          version: 8,
          sources: {
            base: {
              type: "raster",
              tiles: [TILE_TEMPLATE],
              tileSize: 256,
              minzoom: 6,
              maxzoom: 11,
            },
          },
          layers: [{ id: "base", type: "raster", source: "base" }],
        },
        center: MAP_CONFIG.center,
        zoom: MAP_CONFIG.zoom,
        minZoom: MAP_CONFIG.minZoom,
        maxZoom: MAP_CONFIG.maxZoom,
        attributionControl: false,
        dragRotate: false,
        pitchWithRotate: false,
        touchPitch: false,
        fadeDuration: 0,
      });
    } catch {
      setFailed(true);
      return undefined;
    }
    mapRef.current = map;
    map.touchZoomRotate.disableRotation();

    // Tile and style errors are collected, never logged.
    map.on("error", () => {});

    // The intro recedes on the first real interaction with the map.
    map.on("movestart", (event) => {
      if (event.originalEvent && !firstInteractionRef.current) {
        firstInteractionRef.current = true;
        propsRef.current.onFirstInteraction?.();
      }
    });

    // "Search this area" appears once the view drifts from the framed region.
    map.on("moveend", () => {
      if (!mapRef.current) {
        return;
      }
      const baseline = propsRef.current.areaBounds ?? frameBoundsRef.current;
      setDrifted(Boolean(baseline) && !rectsClose(boundsRect(mapRef.current), baseline));
    });

    map.on("zoom", () => syncFanOffsets());

    map.on("load", () => {
      frameBoundsRef.current = boundsRect(map);
      setReady(true);
    });

    const markers = markersRef.current;
    return () => {
      for (const rec of markers.values()) {
        rec.marker.remove();
      }
      markers.clear();
      labelsRef.current = [];
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // One marker per listing, keeping its spot on the town fan.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || failed) {
      return;
    }
    const wanted = new Set(entries.map((entry) => entry.slug));
    for (const [slug, rec] of [...markersRef.current]) {
      if (!wanted.has(slug)) {
        rec.marker.remove();
        markersRef.current.delete(slug);
      }
    }
    const indices = fanIndices(entries);
    entries.forEach((entry, order) => {
      if (!markersRef.current.has(entry.slug)) {
        markersRef.current.set(entry.slug, createPin(entry, indices.get(entry.slug) ?? 0, order));
      }
    });
    syncFanOffsets();
    syncPinClasses(propsRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, failed, entries]);

  // Quiet labels: town pills and the major lakes.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || failed || labelsRef.current.length > 0) {
      return;
    }
    for (const town of TOWNS) {
      const el = document.createElement("div");
      el.className = "map-label map-label-town";
      el.textContent = town.name;
      const east = town.lon > TOWN_LABEL_EAST_OF;
      const offset = TOWN_LABEL_OFFSETS[town.name] ?? (east ? [-9, 1] : [9, 1]);
      labelsRef.current.push(
        new maplibregl.Marker({ element: el, anchor: east ? "right" : "left", offset })
          .setLngLat([town.lon, town.lat])
          .addTo(map),
      );
    }
    for (const water of WATER_LABELS) {
      const el = document.createElement("div");
      el.className = "map-label map-label-water";
      el.textContent = water.name;
      labelsRef.current.push(
        new maplibregl.Marker({ element: el, anchor: "center" })
          .setLngLat([water.lon, water.lat])
          .addTo(map),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, failed]);

  // Pin states follow the browse state.
  useEffect(() => {
    syncPinClasses({ matchedSlugs, hoveredSlug, selectedSlug, activeCategory });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchedSlugs, hoveredSlug, selectedSlug, activeCategory, ready]);

  // Opening an entry flies the camera so the pin lands in the open area,
  // left of where the card rests. Closing eases back to the browse camera.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || failed) {
      return undefined;
    }
    if (focusEntry) {
      if (cameraRef.current === null) {
        cameraRef.current = { center: map.getCenter().toArray(), zoom: map.getZoom() };
      }
      const delay = propsRef.current.preRoll && !flownOnceRef.current ? 300 : 0;
      const timer = window.setTimeout(() => {
        const live = mapRef.current;
        if (!live) {
          return;
        }
        flownOnceRef.current = true;
        const { clientWidth: width, clientHeight: height } = live.getContainer();
        const mobile = width < MOBILE_BREAKPOINT || height < 560;
        const offset = mobile ? [0, -Math.round(height * 0.32)] : [-ENTRY_CARD_OFFSET_X, 0];
        const target = {
          center: [focusEntry.lng, focusEntry.lat],
          zoom: MAP_CONFIG.townZoom,
          offset,
        };
        if (prefersReducedMotion()) {
          live.easeTo({ ...target, duration: 0 });
        } else {
          live.flyTo({ ...target, duration: 950, curve: 1.4 });
        }
      }, delay);
      return () => window.clearTimeout(timer);
    }
    if (cameraRef.current) {
      const camera = cameraRef.current;
      cameraRef.current = null;
      if (prefersReducedMotion()) {
        map.easeTo({ center: camera.center, zoom: camera.zoom, duration: 0 });
      } else {
        map.easeTo({ center: camera.center, zoom: camera.zoom, duration: 450 });
      }
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusEntry, ready, failed]);

  // Brand reset: fly back to the framed region.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || failed || resetSignal === 0) {
      return;
    }
    cameraRef.current = null;
    firstInteractionRef.current = false;
    if (prefersReducedMotion()) {
      map.easeTo({ center: MAP_CONFIG.center, zoom: MAP_CONFIG.zoom, duration: 0 });
    } else {
      map.flyTo({ center: MAP_CONFIG.center, zoom: MAP_CONFIG.zoom, duration: 700, curve: 1.3 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetSignal, ready, failed]);

  // The map never locks: zoom and pan work while an entry is open.

  const zoomBy = (delta) => {
    const map = mapRef.current;
    if (!map) {
      return;
    }
    propsRef.current.onFirstInteraction?.();
    map.easeTo({ zoom: map.getZoom() + delta, duration: 250 });
  };

  const handleAreaSearch = () => {
    const map = mapRef.current;
    if (!map) {
      return;
    }
    propsRef.current.onAreaSearch?.(boundsRect(map));
  };

  const showPill = ready && !failed && receded && !focusEntry && drifted;

  return (
    <div className="map-stage">
      <div className="map-canvas" ref={containerRef} />
      {failed && <div className="map-fallback" />}
      {!failed && (
        <>
          <div className="map-zoom">
            <button type="button" aria-label="Zoom in" onClick={() => zoomBy(1)}>
              +
            </button>
            <button type="button" aria-label="Zoom out" onClick={() => zoomBy(-1)}>
              −
            </button>
          </div>
          <div className="map-manage">
            <Link to="/admin">Manage services</Link>
          </div>
          {showPill && (
            <button type="button" className="map-area-pill" onClick={handleAreaSearch}>
              Search this area
            </button>
          )}
        </>
      )}
    </div>
  );
}
