import { centeredIndexFor, domains, pathForDomain } from "../content.js";
import { useWheel } from "../state/wheel-context.js";

// The docked wheel's corner labels: the other parts' names ride their wheel
// slivers, quiet by default, and grow into clear buttons on hover. The
// corner hit zones and the wedge links both lead here.
export default function DockLinks({ hot, setHot, geometry }) {
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
      style={{ "--dock-scale": String(geometry.scale), "--wheel-px": `${geometry.wheelPx}px` }}
    >
      {entries.map(({ side, index }) => {
        const domain = domains[index];
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
            <span className="protrusion-label">{domain.name}</span>
          </a>
        );
      })}
    </div>
  );
}
