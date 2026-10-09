// Motion helpers: the reduced-motion preference and view transitions.
// All motion is CSS and platform APIs; these helpers only guard the edges.

import { useEffect, useState } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

export function prefersReducedMotion() {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia(QUERY).matches;
}

export function useReducedMotion() {
  const [reduced, setReduced] = useState(prefersReducedMotion);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return undefined;
    const media = window.matchMedia(QUERY);
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener?.("change", update);
    return () => media.removeEventListener?.("change", update);
  }, []);

  return reduced;
}

export function supportsViewTransitions() {
  return typeof document !== "undefined" && typeof document.startViewTransition === "function";
}

// Run a state change inside a view transition when the browser supports one.
// The update callback is expected to apply its state synchronously.
export function morphWithTransition(update) {
  if (!supportsViewTransitions() || prefersReducedMotion()) {
    update();
    return;
  }
  document.startViewTransition(() => update());
}

// Whether the tab is visible, so ambient motion can pause politely.
export function useDocumentVisible() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const update = () => setVisible(document.visibilityState !== "hidden");
    update();
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);

  return visible;
}
