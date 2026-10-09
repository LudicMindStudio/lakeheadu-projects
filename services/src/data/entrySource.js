// Where the entries come from. Served with the app's server, the public site
// reads the live store. Hosted statically it falls back to the bundled
// sample dataset.

import { createContext, useContext } from "react";
import { ENTRIES } from "./entries.js";

export const EntriesContext = createContext(null);

export function useEntries() {
  return useContext(EntriesContext);
}

export async function loadEntries() {
  if (typeof fetch !== "function") {
    return ENTRIES;
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2000);
  try {
    const response = await fetch("/api/entries", { signal: controller.signal });
    if (!response.ok) {
      return ENTRIES;
    }
    const data = await response.json();
    return Array.isArray(data?.entries) ? data.entries : ENTRIES;
  } catch {
    return ENTRIES;
  } finally {
    clearTimeout(timer);
  }
}
