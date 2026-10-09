import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Vitest runs without globals here, so Testing Library's auto-cleanup does
// not register on its own. Unmount between tests, or each render stacks up
// in the same document.
afterEach(() => {
  cleanup();
});
