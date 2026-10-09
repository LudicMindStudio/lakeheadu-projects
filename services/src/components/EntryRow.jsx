// One result row in the rail. Descriptions live on the entry view.

import { Link, useLocation } from "react-router-dom";
import IconRaiseHands from "./IconRaiseHands.jsx";
import { COST_LABELS, REFERRAL_LABELS, STATUS_LABELS, optionLabel } from "../data/filters.js";
import { formatDistance } from "../lib/format.js";

const MAX_NATURE = 2;

export default function EntryRow({ entry, distance, hovered, onHover }) {
  const location = useLocation();
  const facts = [
    COST_LABELS[entry.cost],
    ...entry.nature.slice(0, MAX_NATURE).map((value) => optionLabel("nature", value)),
  ];
  if (entry.nature.length > MAX_NATURE) {
    facts.push(`+${entry.nature.length - MAX_NATURE} more`);
  }
  facts.push(REFERRAL_LABELS[entry.referral]);
  if (distance !== null && distance !== undefined) {
    facts.push(formatDistance(distance, entry.region));
  }
  const statusLabel = entry.status ? STATUS_LABELS[entry.status] : null;

  return (
    <li className={`rail-row${hovered ? " is-active" : ""}`}>
      <Link
        className="rail-row-link"
        to={`/entry/${entry.slug}`}
        state={{ from: `${location.pathname}${location.search}` }}
        onMouseEnter={() => onHover?.(entry.slug)}
        onMouseLeave={() => onHover?.(null)}
        onFocus={() => onHover?.(entry.slug)}
        onBlur={() => onHover?.(null)}
      >
        <span className="rail-row-org">{entry.org}</span>
        <span className="rail-row-title-row">
          {statusLabel && (
            <span
              className={`status-bubble status-${entry.status}`}
              role="img"
              aria-label={statusLabel}
              title={statusLabel}
            />
          )}
          <span className="rail-row-title">{entry.program}</span>
        </span>
        <span className="rail-row-facts">{facts.join(" · ")}</span>
        <span className="rail-row-step" title={entry.firstStep}>
          <IconRaiseHands size={16} />
          <span className="sr-only">{"First step: "}</span>
          {entry.firstStepShort || entry.firstStep}
        </span>
      </Link>
    </li>
  );
}
