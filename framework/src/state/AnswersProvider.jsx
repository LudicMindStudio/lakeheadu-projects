import { useCallback, useEffect, useMemo, useState } from "react";
import { AnswersContext, STORAGE_KEY } from "./answers-context.js";

function loadAnswers() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

// Answers live in the browser only — in memory for the session, and in
// localStorage so a refresh does not lose the walkthrough.
export default function AnswersProvider({ children }) {
  const [answers, setAnswers] = useState(loadAnswers);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
    } catch {
      // Storage can be unavailable; the walkthrough still works in memory.
    }
  }, [answers]);

  const setAnswer = useCallback((questionId, label) => {
    setAnswers((current) => ({ ...current, [questionId]: label }));
  }, []);

  const clearAnswers = useCallback(() => {
    setAnswers({});
  }, []);

  const value = useMemo(
    () => ({ answers, setAnswer, clearAnswers }),
    [answers, setAnswer, clearAnswers],
  );

  return <AnswersContext.Provider value={value}>{children}</AnswersContext.Provider>;
}
