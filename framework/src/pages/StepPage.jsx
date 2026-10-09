import { Link } from "react-router-dom";
import {
  currentTypeSlug,
  isDomainComplete,
  nextPathFor,
  partNumberFor,
  stepCount,
  stepNumberFor,
  visibleQuestions,
} from "../content.js";
import { useAnswers } from "../state/answers-context.js";
import QuestionBlock from "../components/QuestionBlock.jsx";
import GuidancePanel from "../components/GuidancePanel.jsx";
import PartNav from "../components/PartNav.jsx";
import PartsList from "../components/PartsList.jsx";

function SubjectLine({ subject, variant }) {
  if (!subject) return null;
  return (
    <p className={`subject-line subject-line--${variant}`}>
      Assessing: <Link to="/">{subject}</Link>
    </p>
  );
}

// One part of the walkthrough. Parts are real routes, so back, refresh,
// and direct links behave.
export default function StepPage({ domain }) {
  const { subject, answers } = useAnswers();
  const questions = visibleQuestions(domain, currentTypeSlug(answers));
  const complete = isDomainComplete(domain, answers);
  const isLast = stepNumberFor(domain) === stepCount;

  return (
    <div className="page page--step">
      <aside className="rail">
        <PartNav currentKey={domain.key} showBar />
        <SubjectLine subject={subject} variant="rail" />
        <PartsList answers={answers} currentKey={domain.key} />
      </aside>
      <article className="sheet step" data-part={partNumberFor(domain)}>
        <div className="step-top">
          <Link to="/" className="back-link">
            ← All parts
          </Link>
          <p className="eyebrow">
            Part {stepNumberFor(domain)} of {stepCount}
          </p>
        </div>
        <SubjectLine subject={subject} variant="inline" />
        <h1>{domain.name}</h1>
        {domain.intro ? <p className="lead">{domain.intro}</p> : null}
        <div className="questions">
          {questions.map((question) => (
            <QuestionBlock key={question.id} question={question} />
          ))}
        </div>
        {domain.guidance ? <GuidancePanel domain={domain} settled={complete} /> : null}
        <div className="step-actions">
          <Link className="button" to={nextPathFor(domain)}>
            {isLast ? "See your assessment" : "Next part"}
          </Link>
        </div>
      </article>
    </div>
  );
}
