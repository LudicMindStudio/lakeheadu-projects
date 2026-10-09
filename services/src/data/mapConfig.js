// Map configuration: the framed region, zoom limits, the vendored tile set,
// and the quiet labels the map carries.

import { REGION } from "./region.js";

export const MAP_CONFIG = {
  center: [-89.7, 49.775],
  zoom: 6.49,
  minZoom: 6.45,
  maxZoom: 10.6,
  townZoom: 10,
  maxBounds: [
    [-95.9, 47.15],
    [-83.5, 52.4],
  ],
};

// Vendored light-gray raster tiles (z6-z9), committed under public/tiles/.
export const TILE_TEMPLATE = "/tiles/{z}/{x}/{y}.webp";

export const TILE_ATTRIBUTION = "© Esri, HERE, Garmin, © OpenStreetMap contributors";

// Towns east of this longitude anchor their labels to the right of the point.
export const TOWN_LABEL_EAST_OF = -87.5;

// A few town labels nudge where neighbors would crowd each other.
export const TOWN_LABEL_OFFSETS = {
  Emo: [9, -18],
};

export const WATER_LABELS = [
  { name: "Lake Superior", lat: 48.3, lon: -86.9 },
  { name: "Lake of the Woods", lat: 49.36, lon: -94.72 },
  { name: "Lake Nipigon", lat: 49.84, lon: -88.49 },
  { name: "Rainy Lake", lat: 48.75, lon: -93.0 },
];

export { REGION };
