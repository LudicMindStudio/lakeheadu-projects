import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach } from "vitest";

// This setup runs for every suite, including the node-environment server
// tests, so anything touching window or fetch is guarded.

const inBrowser = typeof window !== "undefined";

beforeEach(() => {
  // Browser tests run without a management server unless a test stubs fetch.
  if (inBrowser) {
    globalThis.fetch = () => Promise.reject(new Error("network disabled in tests"));
  }
});

afterEach(() => {
  if (!inBrowser) return;
  cleanup();
  try {
    window.sessionStorage.clear();
  } catch {
    // Storage unavailable in this environment.
  }
});

if (inBrowser) {
  // jsdom does not implement scrolling. The app resets scroll on navigation.
  window.scrollTo = () => {};

  // jsdom does not implement matchMedia; default to no motion preference.
  if (typeof window.matchMedia !== "function") {
    window.matchMedia = (query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    });
  }
}
