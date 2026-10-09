import { Link, Route, Routes, useParams } from "react-router-dom";
import { domainByKey, domains, meta } from "./content.js";
import AnswersProvider from "./state/AnswersProvider.jsx";
import LandingPage from "./pages/LandingPage.jsx";
import StepPage from "./pages/StepPage.jsx";
import GuidancePage from "./pages/GuidancePage.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";

function DomainStepRoute() {
  const { domainKey } = useParams();
  const domain = domainByKey(domainKey);
  if (!domain) return <NotFoundPage />;
  return <StepPage domain={domain} />;
}

export default function App() {
  return (
    <AnswersProvider>
      <div className="app">
        <header className="app-header">
          <div className="shell">
            <span className="app-title">
              <Link to="/">Technology Decision Framework</Link>
            </span>
          </div>
        </header>
        <main className="app-main">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/evaluate" element={<StepPage domain={domains[0]} />} />
            <Route path="/evaluate/guidance" element={<GuidancePage />} />
            <Route path="/evaluate/:domainKey" element={<DomainStepRoute />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
        {meta.sample ? (
          <footer className="app-footer">
            <div className="shell">
              <p className="sample-line">Sample content: questions and guidance are drafts.</p>
            </div>
          </footer>
        ) : null}
      </div>
    </AnswersProvider>
  );
}
