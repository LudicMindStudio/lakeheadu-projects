import { Link, Route, Routes, useLocation, useParams } from "react-router-dom";
import { domainByKey, domains, meta, partNumberFor } from "./content.js";
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

// Which color world the page sits in: the hub (all three washes), one part's
// wash, or the finished map.
function fieldKeyFor(pathname) {
  if (pathname === "/") return "hub";
  if (pathname === "/evaluate/guidance") return "map";
  const match = pathname.replace(/\/+$/, "").match(/^\/evaluate\/?([^/]*)$/);
  if (match) {
    const domain = match[1] ? domainByKey(match[1]) : domains[0];
    if (domain) return `p${partNumberFor(domain)}`;
  }
  return "hub";
}

export default function App() {
  const location = useLocation();
  return (
    <AnswersProvider>
      <div className="app" data-field={fieldKeyFor(location.pathname)}>
        <div className="field" aria-hidden="true">
          <div className="field-layer field-layer--1" />
          <div className="field-layer field-layer--2" />
          <div className="field-layer field-layer--3" />
        </div>
        <header className="app-header">
          <div className="shell">
            <span className="app-title">
              <Link to="/">Technology Decision Framework</Link>
            </span>
          </div>
        </header>
        <main className="app-main">
          <div className="page-frame" key={location.pathname}>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/evaluate" element={<StepPage domain={domains[0]} />} />
              <Route path="/evaluate/guidance" element={<GuidancePage />} />
              <Route path="/evaluate/:domainKey" element={<DomainStepRoute />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </div>
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
