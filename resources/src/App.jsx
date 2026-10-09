import { useEffect } from "react";
import { Link, Route, Routes, useLocation } from "react-router-dom";
import EntriesProvider from "./lib/EntriesProvider.jsx";
import GridPage from "./pages/GridPage.jsx";
import EntryPage from "./pages/EntryPage.jsx";
import AdminPage from "./pages/AdminPage.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";

export default function App() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <EntriesProvider>
      <div className="app">
        <header className="app-header">
          <Link className="app-title" to="/">
            Resources &amp; tools
          </Link>
          <span className="sample-pill">Sample content</span>
        </header>
        <main className="app-main" key={pathname}>
          <Routes>
            <Route path="/" element={<GridPage />} />
            <Route path="/browse" element={<GridPage />} />
            <Route path="/entry/:id" element={<EntryPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
        <footer className="app-footer">
          <Link className="app-footer-link" to="/admin">
            Manage resources
          </Link>
        </footer>
      </div>
    </EntriesProvider>
  );
}
