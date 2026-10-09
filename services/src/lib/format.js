const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

// "2026-09-18" -> "September 18, 2026"
export function formatDate(iso) {
  const [year, month, day] = iso.split("-").map(Number);
  return `${MONTHS[month - 1]} ${day}, ${year}`;
}

export function formatDistance(km, townName) {
  if (km < 3) {
    return `In ${townName}`;
  }
  return `About ${km} km (estimated)`;
}
