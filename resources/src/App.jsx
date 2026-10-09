import { useEffect } from "react";
import { Link, Route, Routes, useLocation } from "react-router-dom";
import LandingPage from "./pages/LandingPage.jsx";
import BrowsePage from "./pages/BrowsePage.jsx";
import EntryPage from "./pages/EntryPage.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";

export default function App() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="app">
      <header className="app-header">
        <Link className="app-title" to="/">
          Resources &amp; tools
        </Link>
        <span className="sample-pill">Sample content</span>
      </header>
      <main className="app-main">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/browse" element={<BrowsePage />} />
          <Route path="/entry/:id" element={<EntryPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
    </div>
  );
}
