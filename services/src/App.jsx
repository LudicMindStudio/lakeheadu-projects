import { Link, Route, Routes } from "react-router-dom";
import LandingPage from "./pages/LandingPage.jsx";
import DirectoryPage from "./pages/DirectoryPage.jsx";
import EntryPage from "./pages/EntryPage.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";

export default function App() {
  return (
    <div className="app">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="app-header">
        <Link className="app-title" to="/">
          Services
        </Link>
      </header>
      <main className="app-main" id="main" tabIndex={-1}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/directory" element={<DirectoryPage />} />
          <Route path="/entry/:slug" element={<EntryPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <footer className="app-footer">
        <div className="app-footer-inner">Sample listings, not real services yet.</div>
      </footer>
    </div>
  );
}
