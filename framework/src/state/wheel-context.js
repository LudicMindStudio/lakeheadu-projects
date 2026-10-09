import { createContext, useContext } from "react";

// The wheel's presentation state, shared by the shell and the pages.
export const WheelContext = createContext(null);

export function useWheel() {
  const value = useContext(WheelContext);
  if (!value) throw new Error("useWheel must be used inside WheelProvider");
  return value;
}
