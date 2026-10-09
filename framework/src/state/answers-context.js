import { createContext, useContext } from "react";

export const STORAGE_KEY = "framework.answers.v1";

export const AnswersContext = createContext(null);

export function useAnswers() {
  const value = useContext(AnswersContext);
  if (!value) throw new Error("useAnswers must be used inside AnswersProvider");
  return value;
}
