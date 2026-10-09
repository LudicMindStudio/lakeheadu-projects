import { useEffect, useRef, useState } from "react";
import { hasAnyAnswers } from "../content.js";
import { useAnswers } from "../state/answers-context.js";
import { useWheel } from "../state/wheel-context.js";

const LINE = "Is it safe and useful?";

// The card in the wheel's center: the intro line, the name field, and the
// one button. Empty names are fine, and Begin works with the field blank.
export default function StartCard() {
  const { subject, setSubject, answers, clearAll } = useAnswers();
  const { stage, reduced, begin, resetArrival, focusToken } = useWheel();
  const [typed, setTyped] = useState(0);
  const fieldRef = useRef(null);
  const focusShown = useRef(0);
  const returning = hasAnyAnswers(answers);
  const arriving = stage === "arrival";
  const shown = arriving && !reduced ? typed : LINE.length;

  // The line writes itself during the arrival. Every other state shows it whole.
  useEffect(() => {
    if (stage !== "arrival" || reduced) return undefined;
    let interval = 0;
    let count = 0;
    const start = window.setTimeout(() => {
      interval = window.setInterval(() => {
        count += 1;
        setTyped(count);
        if (count >= LINE.length) window.clearInterval(interval);
      }, 27);
    }, 1450);
    return () => {
      window.clearTimeout(start);
      window.clearInterval(interval);
    };
  }, [stage, reduced]);

  // Focus follows a settled card, unless the person steered the arrival.
  useEffect(() => {
    if (focusToken > focusShown.current && stage === "rest") {
      focusShown.current = focusToken;
      fieldRef.current?.focus();
    }
  }, [focusToken, stage]);

  const onSubmit = (event) => {
    event.preventDefault();
    begin();
  };

  const startOver = () => {
    clearAll();
    resetArrival();
  };

  return (
    <form className="wheel-card" onSubmit={onSubmit} inert={stage === "handoff" ? true : undefined}>
      <h1 className="typed-line">
        <span className="sr-only">{LINE}</span>
        <span className="typed-visual" aria-hidden="true">
          {LINE.split("")
            .slice(0, shown)
            .map((char, index) => (
              <span className="typed-char" key={index}>
                {char}
              </span>
            ))}
        </span>
      </h1>
      <div className="card-fields">
        <div className="name-row">
          <input
            id="subject-input"
            ref={fieldRef}
            className="subject-input"
            type="text"
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            placeholder="App, chatbot, site…"
            aria-label="What are you evaluating?"
            autoComplete="off"
            disabled={arriving}
          />
          <button
            type="button"
            className="device-note"
            aria-label="Storage note"
            aria-describedby="device-note-tip"
          >
            <svg viewBox="0 0 16 16" aria-hidden="true" className="device-icon">
              <rect x="2.75" y="3.5" width="10.5" height="7" rx="1" />
              <path d="M8 10.5v2.25M5.5 12.75h5" />
            </svg>
          </button>
          <span role="tooltip" id="device-note-tip" className="tooltip">
            Your answers stay on this device
          </span>
        </div>
        <div className="start-actions">
          <button type="submit" className="button" disabled={arriving}>
            {returning ? "Continue" : "Begin"}
          </button>
          {returning ? (
            <button type="button" className="link-button" onClick={startOver} disabled={arriving}>
              Start over
            </button>
          ) : null}
        </div>
      </div>
    </form>
  );
}
