import { useNavigate } from "react-router-dom";
import { firstIncompletePath, hasAnyAnswers } from "../content.js";
import { useAnswers } from "../state/answers-context.js";
import PartNav from "../components/PartNav.jsx";
import PartsList from "../components/PartsList.jsx";

export default function LandingPage() {
  const { subject, setSubject, answers, clearAll } = useAnswers();
  const navigate = useNavigate();
  const returning = hasAnyAnswers(answers);

  return (
    <article className="landing">
      <header className="landing-head">
        <h1>Evaluating a digital mental health technology?</h1>
        <p className="lead">
          A short, guided way to weigh its safety and usefulness — for yourself, or for the
          people you support.
        </p>
      </header>
      <div className="landing-wheel">
        <PartNav />
      </div>
      <p className="wheel-hint">Click a part to start — no wrong answers.</p>
      <div className="start-card">
        <label className="subject-label" htmlFor="subject-input">
          What are you evaluating?
        </label>
        <input
          id="subject-input"
          className="subject-input"
          type="text"
          value={subject}
          placeholder="An app, a chatbot, a website — name it if you like"
          autoComplete="off"
          onChange={(event) => setSubject(event.target.value)}
        />
        <p className="fine-line">Optional, and it stays on this device.</p>
        <div className="start-actions">
          <button
            type="button"
            className="button"
            onClick={() => navigate(returning ? firstIncompletePath(answers) : "/evaluate")}
          >
            {returning ? "Continue" : "Begin"}
          </button>
          {returning ? (
            <button type="button" className="link-button" onClick={clearAll}>
              Start over
            </button>
          ) : null}
        </div>
      </div>
      <PartsList answers={answers} />
      <p className="fine-line landing-fine">
        No account needed — your answers stay in your browser.
      </p>
    </article>
  );
}
