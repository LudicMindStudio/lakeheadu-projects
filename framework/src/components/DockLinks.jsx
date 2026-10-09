import { centeredIndexFor, countsFor, domains, pathForDomain } from "../content.js";
import { useAnswers } from "../state/answers-context.js";
import { useWheel } from "../state/wheel-context.js";

// The docked wheel's corner protrusions: each is one link covering the part's
// sliver and its pill. The pill carries the name and the quiet count.
function countText(count) {
  if (count.total > 0 && count.answered >= count.total) return "Complete";
  return `${count.answered} of ${count.total}`;
}

export default function DockLinks({ hot, setHot }) {
  const { answers } = useAnswers();
  const { stage, rotor, turning, route, turnTo } = useWheel();

  if (stage !== "dock" && stage !== "handoff") return null;

  const current = route.kind === "part" ? route.index : centeredIndexFor(rotor);
  const entries = [
    { side: "left", index: (current + 2) % 3 },
    { side: "right", index: (current + 1) % 3 },
  ];

  return (
    <div
      className="dock-links"
      data-state={stage}
      data-turning={turning ? "true" : undefined}
      aria-hidden="true"
    >
      {entries.map(({ side, index }) => {
        const domain = domains[index];
        const count = countsFor(domain, answers);
        return (
          <a
            key={side}
            className={`protrusion protrusion--${side}`}
            href={pathForDomain(domain)}
            tabIndex={-1}
            onClick={(event) => {
              event.preventDefault();
              turnTo(index);
            }}
            onMouseEnter={() => setHot(index)}
            onMouseLeave={() => setHot(null)}
            data-hot={hot === index ? "true" : undefined}
            data-turning={turning ? "true" : undefined}
          >
            <span className="protrusion-pill">
              <span className="pill-name">{domain.name}</span>
              <span className="pill-sep">·</span>
              <span className="pill-count">{countText(count)}</span>
            </span>
          </a>
        );
      })}
    </div>
  );
}
