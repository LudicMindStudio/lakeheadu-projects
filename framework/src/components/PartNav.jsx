import { Link } from "react-router-dom";
import { countsFor, domains, partNumberFor, pathForDomain } from "../content.js";
import { useAnswers } from "../state/answers-context.js";

// The wheel: three wedges, one per part. Each wedge is a real link. A
// hairline arc along its outer edge fills as questions are answered.
const C = 50; // viewBox center
const R = 46; // outer radius
const HUB = 15.5; // hub radius
const GAP = 2.4; // degrees of field between wedges
const SPAN = 120; // degrees per wedge

function polar(radius, deg) {
  const a = ((deg - 90) * Math.PI) / 180;
  return [C + radius * Math.cos(a), C + radius * Math.sin(a)];
}

function wedgePath(a0, a1) {
  const [x0, y0] = polar(R, a0);
  const [x1, y1] = polar(R, a1);
  const [x2, y2] = polar(HUB + 1.5, a1);
  const [x3, y3] = polar(HUB + 1.5, a0);
  return `M ${x0} ${y0} A ${R} ${R} 0 0 1 ${x1} ${y1} L ${x2} ${y2} A ${HUB + 1.5} ${HUB + 1.5} 0 0 0 ${x3} ${y3} Z`;
}

function arcPath(a0, a1) {
  const [x0, y0] = polar(R - 2.6, a0);
  const [x1, y1] = polar(R - 2.6, a1);
  return `M ${x0} ${y0} A ${R - 2.6} ${R - 2.6} 0 0 1 ${x1} ${y1}`;
}

// The few pixels a wedge steps out when it is hovered or open, along its own
// bisector so it moves outward from the center.
function liftFor(index) {
  const deg = index * SPAN + SPAN / 2;
  const a = ((deg - 90) * Math.PI) / 180;
  return { tx: `${(2.2 * Math.cos(a)).toFixed(2)}px`, ty: `${(2.2 * Math.sin(a)).toFixed(2)}px` };
}

function partLabel(domain, index, count) {
  const base = `${domain.name} — part ${index + 1} of ${domains.length}`;
  if (count.total === 0 || count.answered === 0) return base;
  if (count.answered >= count.total) return `${base}, all ${count.total} answered`;
  return `${base}, ${count.answered} of ${count.total} answered`;
}

export default function PartNav({ currentKey = null, showBar = false }) {
  const { answers } = useAnswers();

  return (
    <nav
      className={showBar ? "parts parts--swappable" : "parts"}
      aria-label="Parts of the evaluation"
    >
      <div className="parts-wheel" data-variant="wheel">
        <svg viewBox="0 0 100 100">
          {domains.map((domain, index) => {
            const a0 = index * SPAN + GAP / 2;
            const a1 = (index + 1) * SPAN - GAP / 2;
            const count = countsFor(domain, answers);
            const frac = count.total ? count.answered / count.total : 0;
            const current = currentKey === domain.key;
            return (
              <Link
                key={domain.key}
                to={pathForDomain(domain)}
                className="wedge-link"
                data-part={partNumberFor(domain)}
                aria-current={current ? "page" : undefined}
                aria-label={partLabel(domain, index, count)}
                style={liftFor(index)}
              >
                <g className="wedge-g">
                  <path className="wedge" d={wedgePath(a0, a1)} />
                  {/* Hidden at zero progress. A round linecap would leave a
                      stray dot at the arc start. */}
                  <path
                    className="wedge-arc"
                    d={arcPath(a0 + 3, a1 - 3)}
                    pathLength="100"
                    strokeDasharray="100"
                    style={{ strokeDashoffset: 100 - 100 * frac, opacity: frac === 0 ? 0 : 1 }}
                  />
                </g>
              </Link>
            );
          })}
          <circle className="hub" cx={C} cy={C} r={HUB} />
        </svg>
      </div>
      {showBar ? (
        <div className="parts-bar" data-variant="bar">
          {domains.map((domain, index) => {
            const count = countsFor(domain, answers);
            const current = currentKey === domain.key;
            return (
              <Link
                key={domain.key}
                to={pathForDomain(domain)}
                className="bar-seg"
                data-part={partNumberFor(domain)}
                aria-current={current ? "page" : undefined}
                aria-label={partLabel(domain, index, count)}
              >
                <span className="bar-seg-label">Part {index + 1}</span>
                <span className="bar-seg-count">
                  {count.total ? `${count.answered}/${count.total}` : ""}
                </span>
              </Link>
            );
          })}
        </div>
      ) : null}
    </nav>
  );
}
