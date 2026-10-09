import { Link } from "react-router-dom";
import {
  currentTypeSlug,
  nextPathFor,
  stepCount,
  stepNumberFor,
  visibleQuestions,
} from "../content.js";
import { useAnswers } from "../state/answers-context.js";
import QuestionBlock from "../components/QuestionBlock.jsx";
import GuidancePanel from "../components/GuidancePanel.jsx";

// One step of the walkthrough. Steps are real routes, so back, refresh,
// and direct links behave.
export default function StepPage({ domain }) {
  const { answers } = useAnswers();
  const questions = visibleQuestions(domain, currentTypeSlug(answers));

  return (
    <article className="step">
      <p className="step-indicator">
        Step {stepNumberFor(domain)} of {stepCount}
      </p>
      <h1>{domain.name}</h1>
      {domain.intro ? <p className="lead">{domain.intro}</p> : null}
      {questions.map((question) => (
        <QuestionBlock key={question.id} question={question} />
      ))}
      {domain.guidance ? <GuidancePanel domain={domain} /> : null}
      <div className="step-actions">
        <Link className="button" to={nextPathFor(domain)}>
          Next
        </Link>
      </div>
    </article>
  );
}
