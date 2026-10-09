import { createContext, useContext } from "react";
import { ENTRIES } from "./entries.js";

export const EntriesContext = createContext(ENTRIES);

// The entry list every surface renders from: bundled data by default,
// replaced by the management server's copy when one is running.
export function useEntries() {
  return useContext(EntriesContext);
}
