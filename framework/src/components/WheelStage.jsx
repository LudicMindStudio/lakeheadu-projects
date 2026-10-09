import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { centeredIndexFor, countsFor, domains, partNumberFor, pathForDomain } from "../content.js";
import { useAnswers } from "../state/answers-context.js";
import { useWheel } from "../state/wheel-context.js";
import StartCard from "./StartCard.jsx";
import DockLinks from "./DockLinks.jsx";

// The one wheel: three part wedges around a hub, in arrival, rest, handoff,
// and docked presentations. Inline SVG, no canvas.
const C = 50; // viewBox center
const R = 46; // outer radius
const HUB = 18.5; // hub disc radius
const INNER = 20; // wedge inner edge
const GAP = 2.4; // degrees of field between wedges
const SPAN = 120; // degrees per wedge
const LABEL_R = 36.5; // where a part's name sits, clear of the center card

function polar(radius, deg) {
  const a = ((deg - 90) * Math.PI) / 180;
  return [C + radius * Math.cos(a), C + radius * Math.sin(a)];
}

function wedgePath(a0, a1) {
  const [x0, y0] = polar(R, a0);
  const [x1, y1] = polar(R, a1);
  const [x2, y2] = polar(INNER, a1);
  const [x3, y3] = polar(INNER, a0);
  return `M ${x0} ${y0} A ${R} ${R} 0 0 1 ${x1} ${y1} L ${x2} ${y2} A ${INNER} ${INNER} 0 0 0 ${x3} ${y3} Z`;
}

function arcPath(a0, a1) {
  const [x0, y0] = polar(R - 3, a0);
  const [x1, y1] = polar(R - 3, a1);
  return `M ${x0} ${y0} A ${R - 3} ${R - 3} 0 0 1 ${x1} ${y1}`;
}

// Direction factors for a wedge's outward step, along its own bisector, and
// the slice's arrival beat.
function sliceVarsFor(index) {
  const deg = index * SPAN;
  const a = ((deg - 90) * Math.PI) / 180;
  return {
    "--lx": Math.cos(a).toFixed(4),
    "--ly": Math.sin(a).toFixed(4),
    "--d": `${150 + index * 260}ms`,
  };
}

function partLabel(domain, count) {
  const base = `${domain.name} — part ${partNumberFor(domain)} of ${domains.length}`;
  if (count.total === 0 || count.answered === 0) return base;
  if (count.answered >= count.total) return `${base}, all ${count.total} answered`;
  return `${base}, ${count.answered} of ${count.total} answered`;
}

// The dock radius as a fraction of the arrival diameter, so the wrapper can
// grow between the two presentations with one transform.
function computeDockScale() {
  const vw = window.innerWidth || 1200;
  const vh = window.innerHeight || 900;
  const narrow = vw <= 760;
  const dockR = narrow ? Math.min(0.52 * vh, 0.62 * vw) : Math.min(0.6 * vh, 0.48 * vw);
  const arrivalD = Math.min(0.82 * vh, 0.9 * vw, 1100);
  if (!(arrivalD > 0)) return 1.46;
  return Math.min(4, Math.max(0.8, (2 * dockR) / arrivalD));
}

function Wedge({ domain, index, count, stage, hot, dimmed, current, setHot, onOpen }) {
  const a0 = index * SPAN - 60 + GAP / 2;
  const a1 = index * SPAN + 60 - GAP / 2;
  const frac = count.total ? count.answered / count.total : 0;
  const [lx, ly] = polar(LABEL_R, index * SPAN);
  const [gx, gy] = polar(LABEL_R - 2, index * SPAN);

  const classes = ["wedge-g", hot && "is-hot", dimmed && "is-dim"].filter(Boolean).join(" ");

  return (
    <Link
      to={pathForDomain(domain)}
      className="wedge-link"
      data-part={partNumberFor(domain)}
      aria-current={current ? "page" : undefined}
      aria-label={partLabel(domain, count)}
      aria-hidden={stage === "arrival" ? "true" : undefined}
      tabIndex={stage === "arrival" ? -1 : undefined}
      style={sliceVarsFor(index)}
      onMouseEnter={() => setHot(index)}
      onMouseLeave={() => setHot(null)}
      onFocus={() => setHot(index)}
      onBlur={() => setHot(null)}
      onClick={onOpen}
    >
      <g
        className="wedge-flight"
        style={{
          "--fly-x": `var(--fly-${index + 1}-x, 0px)`,
          "--fly-y": `var(--fly-${index + 1}-y, 0px)`,
        }}
      >
        <g className="wedge-lock">
          <g className={classes}>
            <path className="wedge" d={wedgePath(a0, a1)} />
            <path
              className="wedge-sep"
              d={arcPath(a0 + 3, a1 - 3)}
              style={{ opacity: frac === 0 ? 0 : 1 }}
            />
            {/* Hidden at zero progress so no stray dot sits at the arc start. */}
            <path
              className="wedge-arc"
              d={arcPath(a0 + 3, a1 - 3)}
              pathLength="100"
              strokeDasharray="100"
              style={{ strokeDashoffset: 100 - 100 * frac, opacity: frac === 0 ? 0 : 1 }}
            />
          </g>
        </g>
      </g>
      <text className="wedge-label" x={lx} y={ly} textAnchor="middle" dominantBaseline="middle">
        {domain.name}
      </text>
      <circle
        className="wedge-glow"
        cx={gx}
        cy={gy}
        r="22"
        fill={`url(#wheel-glow-${index + 1})`}
      />
    </Link>
  );
}

export default function WheelStage() {
  const { answers } = useAnswers();
  const { stage, turning, rotor, reduced, route, cycle, begin, turnTo } = useWheel();
  const [hot, setHot] = useState(null);
  const [dockScale, setDockScale] = useState(computeDockScale);
  const svgRef = useRef(null);

  useEffect(() => {
    const onResize = () => setDockScale(computeDockScale());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Flight start offsets, measured once per arrival so slices enter from
  // fully off screen along their own bisectors.
  useLayoutEffect(() => {
    if (stage !== "arrival" || reduced) return;
    const el = svgRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect?.();
    const wheelPx = rect && rect.width > 0 ? rect.width : 700;
    const vw = window.innerWidth || 1200;
    const vh = window.innerHeight || 900;
    const dist = (Math.hypot(vw, vh) / 2 + wheelPx * 0.25) * (100 / wheelPx);
    [0, 1, 2].forEach((index) => {
      const a = (index * SPAN * Math.PI) / 180;
      el.style.setProperty(`--fly-${index + 1}-x`, `${(Math.sin(a) * dist).toFixed(2)}px`);
      el.style.setProperty(`--fly-${index + 1}-y`, `${(-Math.cos(a) * dist).toFixed(2)}px`);
    });
  }, [stage, reduced, cycle]);

  const currentIndex = route.kind === "part" ? route.index : -1;
  const docked = stage === "dock" || stage === "handoff";
  const lightIndex = route.kind === "part" ? route.index : centeredIndexFor(rotor);

  const openWedge = (index) => {
    if (stage === "dock") {
      if (index !== currentIndex) turnTo(index);
      return;
    }
    if (stage === "rest") begin(pathForDomain(domains[index]));
  };

  return (
    <>
      <div
        className="wheel-stage"
        data-stage={stage}
        data-turning={turning ? "true" : undefined}
        data-part={docked ? partNumberFor(domains[lightIndex]) : undefined}
      >
        <div className="dock-light" aria-hidden="true" />
        <div className="wheel-wrapper" style={{ "--dock-scale": dockScale }}>
          {stage !== "dock" ? <StartCard key={cycle} /> : null}
          <nav className="wheel-nav" aria-label="Parts of the evaluation">
            <svg ref={svgRef} key={cycle} className="wheel-svg" viewBox="0 0 100 100">
              <defs>
                {domains.map((domain, index) => (
                  <radialGradient id={`wheel-glow-${index + 1}`} key={domain.key}>
                    <stop
                      className={`glow-stop glow-stop--${index + 1}`}
                      offset="0%"
                      stopOpacity="0.85"
                    />
                    <stop
                      className={`glow-stop glow-stop--${index + 1}`}
                      offset="100%"
                      stopOpacity="0"
                    />
                  </radialGradient>
                ))}
              </defs>
              <circle className="wheel-track" cx={C} cy={C} r={R} />
              <g className="wheel-rotor" style={{ transform: `rotate(${rotor}deg)` }}>
                {domains.map((domain, index) => (
                  <Wedge
                    key={domain.key}
                    domain={domain}
                    index={index}
                    count={countsFor(domain, answers)}
                    stage={stage}
                    hot={hot === index}
                    dimmed={hot !== null && hot !== index}
                    current={docked && currentIndex === index}
                    setHot={setHot}
                    onOpen={(event) => {
                      event.preventDefault();
                      openWedge(index);
                    }}
                  />
                ))}
                <circle className="hub" cx={C} cy={C} r={HUB} />
              </g>
            </svg>
          </nav>
        </div>
      </div>
      <DockLinks hot={hot} setHot={setHot} />
    </>
  );
}
