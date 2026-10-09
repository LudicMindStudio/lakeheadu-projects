import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { EntriesContext, loadEntries } from "./data/entrySource.js";
import AdminPage from "./pages/AdminPage.jsx";
import MapPage from "./pages/MapPage.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";

export default function App() {
  const [entries, setEntries] = useState(null);

  // Served with the app's server the entries come from the live store.
  // Hosted statically they fall back to the bundled sample dataset.
  useEffect(() => {
    let active = true;
    loadEntries().then((list) => {
      if (active) {
        setEntries(list);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <EntriesContext.Provider value={entries}>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Routes>
        <Route path="/" element={<MapPage />} />
        <Route path="/entry/:slug" element={<MapPage />} />
        <Route path="/directory" element={<Navigate to="/" replace />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </EntriesContext.Provider>
  );
}
