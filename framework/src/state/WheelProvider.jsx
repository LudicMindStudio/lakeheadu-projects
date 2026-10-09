import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  domainByKey,
  domains,
  firstIncompletePath,
  hasAnyAnswers,
  pathForDomain,
  rotationForDomain,
} from "../content.js";
import { useAnswers } from "./answers-context.js";
import { WheelContext } from "./wheel-context.js";

// The wheel's four presentations: arrival (assembling), rest (centered and
// slowly spinning), handoff (the move into the dock), and dock (the bottom
// half-wheel). The hub spin runs on the CSS clock. Every move that stops it
// keeps the same direction, so the wheel never reverses on the way in.

// Beats, in milliseconds.
const ARRIVAL_MS = 2300; // assembly runs to interactive
const HANDOFF_LEAD = 400; // the route commits under the move
const HANDOFF_MS = 1050; // the move lands docked
const TURN_OUT_MS = 180; // the old content bows out
const TURN_SETTLE_MS = 820; // rotation lands, then the labels return

function reducedMotionQuery() {
  return typeof window.matchMedia === "function"
    ? window.matchMedia("(prefers-reduced-motion: reduce)")
    : null;
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(() => Boolean(reducedMotionQuery()?.matches));
  useEffect(() => {
    const query = reducedMotionQuery();
    if (!query) return undefined;
    const onChange = () => setReduced(query.matches);
    if (typeof query.addEventListener === "function") {
      query.addEventListener("change", onChange);
      return () => query.removeEventListener("change", onChange);
    }
    if (typeof query.addListener === "function") {
      query.addListener(onChange);
      return () => query.removeListener(onChange);
    }
    return undefined;
  }, []);
  return reduced;
}

// Keep angles inside one turn. The spin and every stop travel
// counterclockwise, so a target always sits at or below the live angle.
function mod360(deg) {
  return ((deg % 360) + 360) % 360;
}

// The rotor's live angle, read from the rendered matrix mid-spin, so a stop
// continues from where the wheel actually is.
function liveRotorAngle(el, fallback) {
  if (!el || typeof window === "undefined" || typeof window.DOMMatrixReadOnly !== "function") {
    return fallback;
  }
  const transform = window.getComputedStyle(el).transform;
  if (!transform || transform === "none") return fallback;
  try {
    const matrix = new window.DOMMatrixReadOnly(transform);
    const deg = (Math.atan2(matrix.b, matrix.a) * 180) / Math.PI;
    return Number.isFinite(deg) ? deg : fallback;
  } catch {
    return fallback;
  }
}

// Which surface a path names: the hub, one part, the assessment, or off-map.
function routeFor(pathname) {
  const clean = pathname.replace(/\/+$/, "") || "/";
  if (clean === "/") return { kind: "hub" };
  if (clean === "/evaluate") return { kind: "part", index: 0 };
  if (clean === "/evaluate/guidance") return { kind: "assessment" };
  const match = clean.match(/^\/evaluate\/([^/]+)$/);
  if (match) {
    const domain = domainByKey(match[1]);
    if (domain) return { kind: "part", index: domains.indexOf(domain) };
  }
  return { kind: "other" };
}

export default function WheelProvider({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { answers, subject } = useAnswers();
  const reduced = useReducedMotion();
  const route = useMemo(() => routeFor(location.pathname), [location.pathname]);

  // The orchestrated beat, set from events and timers. The presentation
  // itself follows the route, so external moves (back, direct links) land
  // in the right state without extra writes.
  const [beat, setBeat] = useState(() => {
    if (route.kind === "part" || route.kind === "assessment") return "dock";
    const fresh = route.kind === "hub" && !hasAnyAnswers(answers) && !subject.trim();
    return fresh && !reduced ? "arrival" : "rest";
  });
  const [rotorState, setRotorState] = useState(() =>
    route.kind === "part" ? rotationForDomain(domains[route.index]) : 0,
  );
  const [turning, setTurning] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [focusToken, setFocusToken] = useState(0);
  const [cycle, setCycle] = useState(0);
  // The spin-down adds whole turns to the parked angle, so one session can
  // read below zero. The epoch keeps route-derived angles and the parked
  // angle in the same frame. It is state because the rotor reads it
  // during render.
  const [epoch, setEpoch] = useState(0);
  const rotorElRef = useRef(null);
  const timers = useRef([]);

  const schedule = useCallback((fn, ms) => {
    timers.current.push(window.setTimeout(fn, ms));
  }, []);

  const clearTimers = useCallback(() => {
    for (const id of timers.current) window.clearTimeout(id);
    timers.current = [];
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  const stage = useMemo(() => {
    if (beat === "arrival") return route.kind === "hub" ? "arrival" : "dock";
    if (beat === "handoff") return "handoff";
    if (route.kind === "part" || route.kind === "assessment") return "dock";
    return "rest";
  }, [beat, route.kind]);

  const rotor = useMemo(() => {
    if (reduced) {
      if (route.kind === "part") return rotationForDomain(domains[route.index]);
      if (route.kind === "assessment") return rotorState;
      return 0;
    }
    if (turning || beat === "handoff") return rotorState;
    if (route.kind === "part") return rotationForDomain(domains[route.index]) + epoch;
    return rotorState;
  }, [reduced, turning, beat, route.kind, route.index, rotorState, epoch]);

  // The arrival: a settle timer, and any first input skips straight to rest.
  useEffect(() => {
    if (stage !== "arrival" || reduced) return undefined;
    const settle = () => {
      setBeat("rest");
      setFocusToken((count) => count + 1);
    };
    const skip = () => {
      clearTimers();
      setBeat("rest");
    };
    schedule(settle, ARRIVAL_MS);
    window.addEventListener("pointerdown", skip);
    window.addEventListener("keydown", skip);
    return () => {
      window.removeEventListener("pointerdown", skip);
      window.removeEventListener("keydown", skip);
      clearTimers();
    };
  }, [stage, reduced, cycle, schedule, clearTimers]);

  // Begin (or Continue) from the hub card, or a wedge picked before a name.
  // The slow spin carries on to the target seat instead of stopping dead,
  // so the wheel settles like a dial rather than snapping.
  const begin = useCallback(
    (targetPath) => {
      if (stage !== "rest") return;
      const path =
        targetPath ?? (hasAnyAnswers(answers) ? firstIncompletePath(answers) : "/evaluate");
      const targetRoute = routeFor(path);
      let base = rotorState;
      if (targetRoute.kind === "part") base = rotationForDomain(domains[targetRoute.index]);
      if (targetRoute.kind === "assessment") base = 0;
      let target = base;
      if (!reduced) {
        const live = liveRotorAngle(rotorElRef.current, rotorState);
        target = live - mod360(live - base);
      }
      setEpoch(target - base);
      setRotorState(target);
      if (reduced) {
        setBeat("dock");
        navigate(path);
        return;
      }
      clearTimers();
      setBeat("handoff");
      schedule(() => navigate(path), HANDOFF_LEAD);
      schedule(() => setBeat("dock"), HANDOFF_MS);
    },
    [stage, rotorState, answers, reduced, navigate, schedule, clearTimers],
  );

  // A part-to-part move: one turn with the content crossfade, always the
  // same way around, matching the spin.
  const turnTo = useCallback(
    (domainIndex) => {
      if (stage !== "dock" || turning) return;
      const domain = domains[domainIndex];
      if (!domain) return;
      if (route.kind === "part" && route.index === domainIndex) return;
      const path = pathForDomain(domain);
      const base = rotationForDomain(domain);
      const target = rotorState - mod360(rotorState - base);
      setEpoch(target - base);
      setRotorState(target);
      if (reduced) {
        navigate(path);
        return;
      }
      setTurning(true);
      setLeaving(true);
      schedule(() => {
        setLeaving(false);
        navigate(path);
      }, TURN_OUT_MS);
      schedule(() => setTurning(false), TURN_SETTLE_MS);
    },
    [stage, turning, route.kind, route.index, rotorState, reduced, navigate, schedule],
  );

  // Start over: a clean record plays the arrival again from zero.
  const resetArrival = useCallback(() => {
    clearTimers();
    setTurning(false);
    setLeaving(false);
    setEpoch(0);
    setRotorState(0);
    setCycle((count) => count + 1);
    setBeat(reduced ? "rest" : "arrival");
  }, [clearTimers, reduced]);

  const value = useMemo(
    () => ({
      stage,
      rotor,
      turning,
      leaving,
      reduced,
      focusToken,
      cycle,
      route,
      rotorElRef,
      begin,
      turnTo,
      resetArrival,
    }),
    [
      stage,
      rotor,
      turning,
      leaving,
      reduced,
      focusToken,
      cycle,
      route,
      begin,
      turnTo,
      resetArrival,
    ],
  );

  return <WheelContext.Provider value={value}>{children}</WheelContext.Provider>;
}
