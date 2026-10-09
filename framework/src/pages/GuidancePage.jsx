import { Link, useNavigate } from "react-router-dom";
import {
  chosenOption,
  currentTypeSlug,
  domains,
  hasAnyAnswers,
  notesFor,
  pickerQuestion,
} from "../content.js";
import { useAnswers } from "../state/answers-context.js";
import Prose from "../components/Prose.jsx";

export default function GuidancePage() {
  const { answers, clearAnswers } = useAnswers();
  const navigate = useNavigate();

  if (!hasAnyAnswers(answers)) {
    return (
      <article className="summary">
        <h1>Your guidance</h1>
        <p className="lead">
          Nothing here yet — work through the steps and your guidance will gather here.
        </p>
        <p className="cta">
          <Link className="button" to="/evaluate">
            Start the evaluation
          </Link>
        </p>
      </article>
    );
  }

  const typeSlug = currentTypeSlug(answers);
  const type = chosenOption(pickerQuestion, answers);
  const guidedDomains = domains.filter((domain) => domain.guidance);

  const startOver = () => {
    clearAnswers();
    navigate("/evaluate");
  };

  return (
    <article className="summary">
      <h1>Your guidance</h1>
      <p className="lead">Everything the walkthrough surfaced, in one place.</p>
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
        const notes = notesFor(domain, answers, typeSlug);
        return (
          <section key={domain.key} className="summary-part">
            <h2>{domain.name}</h2>
            <Prose text={domain.guidance} />
            {notes.length > 0 ? (
              <>
                <h3 className="summary-notes-title">Based on your answers</h3>
                <ul className="summary-notes">
                  {notes.map((note) => (
                    <li key={note.id}>{note.text}</li>
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
  );
}
