import { countsFor, domains, partNumberFor } from "../content.js";

// A plain list of the three parts with their progress. The wheel (or the
// narrow-screen bar) carries the links. This is the readable companion.
export default function PartsList({ answers, currentKey = null }) {
  return (
    <ul className="parts-list">
      {domains.map((domain, index) => {
        const count = countsFor(domain, answers);
        const complete = count.total > 0 && count.answered >= count.total;
        const current = currentKey === domain.key;
        return (
          <li
            key={domain.key}
            className={current ? "parts-item parts-item--current" : "parts-item"}
          >
            <span className={`part-dot part-dot--${partNumberFor(domain)}`} aria-hidden="true" />
            <span className="parts-item-name">
              Part {index + 1} · {domain.name}
            </span>
            <span className="parts-item-count">
              {complete ? "Complete" : count.answered > 0 ? `${count.answered} of ${count.total} answered` : ""}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
