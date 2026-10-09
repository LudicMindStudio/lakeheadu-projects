import { chosenOption } from "../content.js";
import { useAnswers } from "../state/answers-context.js";
import Prose from "./Prose.jsx";

export default function QuestionBlock({ question }) {
  const { answers, setAnswer } = useAnswers();
  const selected = chosenOption(question, answers);

  return (
    <fieldset className="question">
      <legend>{question.text}</legend>
      <div className="options">
        {question.options.map((option) => {
          const isSelected = selected !== null && selected.label === option.label;
          return (
            <label key={option.label} className={isSelected ? "option is-selected" : "option"}>
              <input
                type="radio"
                name={question.id}
                value={option.label}
                checked={isSelected}
                onChange={() => setAnswer(question.id, option.label)}
              />
              <span className="option-label">{option.label}</span>
            </label>
          );
        })}
      </div>
      {selected?.note ? (
        <div className="note-reveal">
          <div className="note-reveal-inner">
            <Prose text={selected.note} className="note" />
          </div>
        </div>
      ) : null}
    </fieldset>
  );
}
