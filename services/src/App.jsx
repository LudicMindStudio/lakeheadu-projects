import { Route, Routes } from "react-router-dom";
import LandingPage from "./pages/LandingPage.jsx";
import DirectoryPage from "./pages/DirectoryPage.jsx";
import EntryPage from "./pages/EntryPage.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";

export default function App() {
  return (
    <div className="app">
      <header className="app-header">
        <span className="app-title">Services</span>
      </header>
      <main className="app-main">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/directory" element={<DirectoryPage />} />
          <Route path="/entry/:slug" element={<EntryPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
    </div>
  );
}
