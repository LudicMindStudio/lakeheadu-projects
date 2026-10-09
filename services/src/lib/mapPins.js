// Pin layout helpers for the map. Same-town pins spread on a small
// deterministic fan so they never stack, and the fan eases out as the map
// zooms past town scale where the stored coordinates separate them.

const FAN_ANGLE = 2.399963; // golden angle
const FAN_RADIUS = 13; // px

// Index of each entry within its town group (entries keep their data order,
// so a pin keeps its spot on the fan across filter changes).
export function fanIndices(entries) {
  const counts = new Map();
  const indices = new Map();
  for (const entry of entries) {
    const i = counts.get(entry.region) ?? 0;
    indices.set(entry.slug, i);
    counts.set(entry.region, i + 1);
  }
  return indices;
}

// Pixel offset for fan slot i, in the map's screen space.
export function fanOffset(index) {
  if (!index) {
    return [0, 0];
  }
  const radius = FAN_RADIUS * Math.sqrt(index);
  return [Math.cos(index * FAN_ANGLE) * radius, Math.sin(index * FAN_ANGLE) * radius];
}

// Fan strength by zoom: full through region scale, none past town scale.
export function fanScale(zoom) {
  if (zoom <= 8.4) {
    return 1;
  }
  if (zoom >= 10.2) {
    return 0;
  }
  return (10.2 - zoom) / 1.8;
}
