import { Route, Routes } from "react-router-dom";
import LandingPage from "./pages/LandingPage.jsx";
import BrowsePage from "./pages/BrowsePage.jsx";
import EntryPage from "./pages/EntryPage.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";

export default function App() {
  return (
    <div className="app">
      <header className="app-header">
        <span className="app-title">Resources</span>
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
