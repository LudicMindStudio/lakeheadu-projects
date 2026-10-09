import { useEffect, useState } from "react";
import { ENTRIES } from "./entries.js";
import { EntriesContext } from "./useEntries.js";

// The bundled data renders immediately; when the management server answers,
// its copy of the data replaces it so edits show without a rebuild.
export default function EntriesProvider({ children }) {
  const [entries, setEntries] = useState(ENTRIES);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const response = await fetch("/api/entries", { headers: { accept: "application/json" } });
        const type = response.headers?.get?.("content-type") ?? "";
        if (!response.ok || !type.includes("json")) return;
        const data = await response.json();
        if (!cancelled && Array.isArray(data?.entries)) setEntries(data.entries);
      } catch {
        // No server running; the bundled data stands.
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return <EntriesContext.Provider value={entries}>{children}</EntriesContext.Provider>;
}
