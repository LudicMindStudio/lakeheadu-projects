import { Link, Route, Routes, useLocation, useParams } from "react-router-dom";
import { domainByKey, domains, partNumberFor } from "./content.js";
import AnswersProvider from "./state/AnswersProvider.jsx";
import WheelProvider from "./state/WheelProvider.jsx";
import { useWheel } from "./state/wheel-context.js";
import WheelStage from "./components/WheelStage.jsx";
import SubjectBanner from "./components/SubjectBanner.jsx";
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

// The shell: one wheel for the whole app, the route content, and the banner.
function Shell() {
  const location = useLocation();
  const { stage, leaving } = useWheel();

  return (
    <div className="app" data-field={fieldKeyFor(location.pathname)} data-stage={stage}>
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
        <SubjectBanner />
        <div
          className={leaving ? "page-frame page-frame--leaving" : "page-frame"}
          key={location.pathname}
        >
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/evaluate" element={<StepPage domain={domains[0]} />} />
            <Route path="/evaluate/guidance" element={<GuidancePage />} />
            <Route path="/evaluate/:domainKey" element={<DomainStepRoute />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </div>
      </main>
      <WheelStage />
    </div>
  );
}

export default function App() {
  return (
    <AnswersProvider>
      <WheelProvider>
        <Shell />
      </WheelProvider>
    </AnswersProvider>
  );
}
