import { Link } from "react-router-dom";
import {
  countsFor,
  currentTypeSlug,
  domains,
  isDomainComplete,
  nextPathFor,
  partNumberFor,
  stepCount,
  stepNumberFor,
  visibleQuestions,
} from "../content.js";
import { useAnswers } from "../state/answers-context.js";
import { useWheel } from "../state/wheel-context.js";
import QuestionBlock from "../components/QuestionBlock.jsx";
import GuidancePanel from "../components/GuidancePanel.jsx";

// One part of the walkthrough. Parts are real routes, so back, refresh,
// and direct links behave.
export default function StepPage({ domain }) {
  const { answers } = useAnswers();
  const { stage, turnTo } = useWheel();
  const questions = visibleQuestions(domain, currentTypeSlug(answers));
  const complete = isDomainComplete(domain, answers);
  const count = countsFor(domain, answers);
  const index = domains.indexOf(domain);
  const isLast = index === domains.length - 1;

  // The Next control runs the wheel's turn, so the part swap arrives with the rotation.
  const onNext = (event) => {
    if (stage === "dock" && !isLast) {
      event.preventDefault();
      turnTo(index + 1);
    }
  };

  return (
    <div className="page page--step">
      <article className="sheet step" data-part={partNumberFor(domain)}>
        <div className="step-top">
          <Link to="/" className="back-link">
            ← All parts
          </Link>
          <p className="eyebrow">
            <span>
              Part {stepNumberFor(domain)} of {stepCount}
            </span>
            <span className="eyebrow-count">
              {count.answered} of {count.total} answered
            </span>
          </p>
        </div>
        <h1>{domain.name}</h1>
        {domain.intro ? <p className="lead">{domain.intro}</p> : null}
        <div className="questions">
          {questions.map((question) => (
            <QuestionBlock key={question.id} question={question} />
          ))}
        </div>
        {domain.guidance ? <GuidancePanel domain={domain} settled={complete} /> : null}
        <div className="step-actions">
          <Link className="button" to={nextPathFor(domain)} onClick={onNext}>
            {isLast ? "See your assessment" : "Next part"}
          </Link>
        </div>
      </article>
    </div>
  );
}
