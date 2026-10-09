import { currentTypeSlug, notesFor } from "../content.js";
import { useAnswers } from "../state/answers-context.js";
import Prose from "./Prose.jsx";

// The part's closing guidance. `settled` is true when every visible question
// in the part is answered. The guidance shows either way.
export default function GuidancePanel({ domain, settled = false }) {
  const { answers } = useAnswers();
  const notes = notesFor(domain, answers, currentTypeSlug(answers));

  return (
    <section
      className={settled ? "guidance guidance--settled" : "guidance"}
      aria-labelledby={`guidance-${domain.key}`}
    >
      <h2 id={`guidance-${domain.key}`}>Guidance</h2>
      <Prose text={domain.guidance} />
      {notes.length > 0 ? (
        <>
          <h3 className="guidance-notes-title">Based on your answers</h3>
          <ul className="guidance-notes">
            {notes.map((note) => (
              <li key={note.id}>{note.text}</li>
            ))}
          </ul>
        </>
      ) : null}
    </section>
  );
}
