// Motion helpers for the reduced-motion preference and view transitions.
// All motion is CSS and platform APIs.

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

// One view transition at a time: a call while one is running swaps instantly
// instead of queueing a second transition behind the first.
let morphActive = false;

// How fast a finished transition can be before we treat it as dropped by the
// browser: the swap's animations run for 300ms, so anything this quick did
// not actually play.
const DROPPED_MS = 150;

// The swap's guaranteed half. When the browser drops its transition, the fresh
// surface still arrives with the same clean fade and step up as the morph's
// incoming side.
function playSwapFade() {
  const stage = document.querySelector(".stage");
  if (!stage) return;
  stage.classList.remove("swap-in");
  void stage.offsetWidth;
  stage.classList.add("swap-in");
  stage.addEventListener("animationend", () => stage.classList.remove("swap-in"), {
    once: true,
  });
}

// Run a state change inside a view transition when the browser supports one.
// The update callback must apply its state synchronously. The `vt-morph`
// class scopes the swap's fade and translations to these transitions only.
export function morphWithTransition(update) {
  if (!supportsViewTransitions() || prefersReducedMotion() || morphActive) {
    update();
    return;
  }
  morphActive = true;
  const root = document.documentElement;
  root.classList.add("vt-morph");
  const started = performance.now();
  const transition = document.startViewTransition(() => update());
  const finish = () => {
    root.classList.remove("vt-morph");
    morphActive = false;
    if (performance.now() - started < DROPPED_MS && !prefersReducedMotion()) playSwapFade();
  };
  transition.finished.then(finish, finish);
}

// Whether the tab is visible, so ambient motion can pause when hidden.
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
