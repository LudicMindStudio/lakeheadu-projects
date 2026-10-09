// Towns across Northwestern Ontario, with approximate town-centre coordinates.
// Distances between towns are straight-line estimates, not driving distances.

export const TOWNS = [
  { name: "Atikokan", lat: 48.75, lon: -91.62 },
  { name: "Dryden", lat: 49.78, lon: -92.83 },
  { name: "Emo", lat: 48.63, lon: -93.83 },
  { name: "Fort Frances", lat: 48.61, lon: -93.4 },
  { name: "Geraldton", lat: 49.72, lon: -86.95 },
  { name: "Kenora", lat: 49.77, lon: -94.49 },
  { name: "Marathon", lat: 48.72, lon: -86.38 },
  { name: "Nipigon", lat: 49.01, lon: -88.27 },
  { name: "Red Lake", lat: 51.06, lon: -93.83 },
  { name: "Sioux Lookout", lat: 50.09, lon: -91.92 },
  { name: "Terrace Bay", lat: 48.78, lon: -87.1 },
  { name: "Thunder Bay", lat: 48.38, lon: -89.25 },
];

export function findTown(name) {
  return TOWNS.find((town) => town.name === name) ?? null;
}
