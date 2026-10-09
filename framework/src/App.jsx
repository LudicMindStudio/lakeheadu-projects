import { Route, Routes } from "react-router-dom";
import LandingPage from "./pages/LandingPage.jsx";
import EvaluatePage from "./pages/EvaluatePage.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";

export default function App() {
  return (
    <div className="app">
      <header className="app-header">
        <span className="app-title">Framework</span>
      </header>
      <main className="app-main">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/evaluate" element={<EvaluatePage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
    </div>
  );
}
