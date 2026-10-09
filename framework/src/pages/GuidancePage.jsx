import { Link, useNavigate } from "react-router-dom";
import {
  chosenOption,
  countsFor,
  currentTypeSlug,
  domains,
  findingsFor,
  hasAnyAnswers,
  partNumberFor,
  pickerQuestion,
  stepNumberFor,
} from "../content.js";
import { useAnswers } from "../state/answers-context.js";
import { useWheel } from "../state/wheel-context.js";
import Prose from "../components/Prose.jsx";

export default function GuidancePage() {
  const { subject, answers, clearAll } = useAnswers();
  const { resetArrival } = useWheel();
  const navigate = useNavigate();

  if (!hasAnyAnswers(answers)) {
    return (
      <div className="page page--assessment">
        <article className="sheet summary summary--empty">
          <h1>Your assessment</h1>
          <p className="lead">Nothing here yet.</p>
          <p className="cta">
            <Link className="button" to="/evaluate">
              Start the evaluation
            </Link>
          </p>
        </article>
      </div>
    );
  }

  const typeSlug = currentTypeSlug(answers);
  const type = chosenOption(pickerQuestion, answers);
  const guidedDomains = domains.filter((domain) => domain.guidance);

  const startOver = () => {
    clearAll();
    resetArrival();
    navigate("/");
  };

  return (
    <div className="page page--assessment">
      <article className="sheet summary">
        <header className="assessment-head">
          <h1>{subject ? `Your assessment of ${subject}` : "Your assessment"}</h1>
        </header>
        <section className="summary-part">
          <h2>What was evaluated</h2>
          {type ? (
            <p className="summary-type">
              <strong>{type.label}.</strong>
              {type.note ? ` ${type.note}` : null}
            </p>
          ) : (
            <p className="summary-type">No technology chosen yet.</p>
          )}
        </section>
        {guidedDomains.map((domain) => {
          const count = countsFor(domain, answers);
          const findings = findingsFor(domain, answers, typeSlug);
          return (
            <section key={domain.key} className="summary-part" data-part={partNumberFor(domain)}>
              <div className="summary-part-head">
                <h2>
                  Part {stepNumberFor(domain)} · {domain.name}
                </h2>
                <p className="summary-part-count">
                  {count.answered} of {count.total} answered
                </p>
              </div>
              <Prose text={domain.guidance} />
              {findings.length > 0 ? (
                <>
                  <h3 className="summary-notes-title">Based on your answers</h3>
                  <ul className="findings">
                    {findings.map((finding) => (
                      <li key={finding.id}>
                        <p className="finding-question">{finding.question}</p>
                        <p className="finding-note">{finding.note}</p>
                      </li>
                    ))}
                  </ul>
                </>
              ) : null}
            </section>
          );
        })}
        <div className="summary-actions">
          <button type="button" className="button button-quiet" onClick={startOver}>
            Start over
          </button>
        </div>
      </article>
    </div>
  );
}
