import { createContext, useContext } from "react";

// One local record per browser: { subject, answers } under a versioned key.
// Answers-only records are read across once so nobody loses a walkthrough.
export const STORAGE_KEY = "framework.record.v2";
export const LEGACY_KEY = "framework.answers.v1";

export const AnswersContext = createContext(null);

export function useAnswers() {
  const value = useContext(AnswersContext);
  if (!value) throw new Error("useAnswers must be used inside AnswersProvider");
  return value;
}
