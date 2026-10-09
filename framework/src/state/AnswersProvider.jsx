import { useCallback, useEffect, useMemo, useState } from "react";
import { AnswersContext, LEGACY_KEY, STORAGE_KEY } from "./answers-context.js";

function emptyRecord() {
  return { subject: "", answers: {} };
}

// One local record: { subject, answers }. Answers-only records are read
// across once, so nobody loses answers.
function loadRecord() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        return {
          subject: typeof parsed.subject === "string" ? parsed.subject : "",
          answers:
            parsed.answers && typeof parsed.answers === "object" ? parsed.answers : {},
        };
      }
    }
    const legacy = window.localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      const parsed = JSON.parse(legacy);
      if (parsed && typeof parsed === "object") {
        return { subject: "", answers: parsed };
      }
    }
  } catch {
    // Storage can be unavailable. The walkthrough still works in memory.
  }
  return emptyRecord();
}

export default function AnswersProvider({ children }) {
  const [record, setRecord] = useState(loadRecord);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
    } catch {
      // Storage can be unavailable. The walkthrough still works in memory.
    }
  }, [record]);

  const setSubject = useCallback((subject) => {
    setRecord((current) => ({ ...current, subject }));
  }, []);

  const setAnswer = useCallback((questionId, label) => {
    setRecord((current) => ({
      ...current,
      answers: { ...current.answers, [questionId]: label },
    }));
  }, []);

  const clearAll = useCallback(() => {
    setRecord(emptyRecord());
  }, []);

  const value = useMemo(
    () => ({
      subject: record.subject,
      answers: record.answers,
      setSubject,
      setAnswer,
      clearAll,
    }),
    [record, setSubject, setAnswer, clearAll],
  );

  return <AnswersContext.Provider value={value}>{children}</AnswersContext.Provider>;
}
