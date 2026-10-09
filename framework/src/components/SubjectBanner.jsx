import { useAnswers } from "../state/answers-context.js";
import { useWheel } from "../state/wheel-context.js";

// The named technology, centered under the header while the walkthrough runs.
// An empty name reads "Your evaluation".
export default function SubjectBanner() {
  const { subject } = useAnswers();
  const { stage, route } = useWheel();

  const onEvaluate = route.kind === "part" || route.kind === "assessment";
  if (!onEvaluate || (stage !== "dock" && stage !== "handoff")) return null;

  const name = subject.trim();
  return (
    <div className="subject-banner">
      <p className="subject-name">{name || "Your evaluation"}</p>
    </div>
  );
}
