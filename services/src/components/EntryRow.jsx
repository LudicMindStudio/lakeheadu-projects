import { Link, useLocation } from "react-router-dom";
import { COST_LABELS, REFERRAL_LABELS, optionLabel } from "../data/filters.js";
import { formatDistance } from "../lib/format.js";

export default function EntryRow({ entry, distance }) {
  const location = useLocation();
  const meta = [
    COST_LABELS[entry.cost],
    ...entry.nature.map((value) => optionLabel("nature", value)),
    REFERRAL_LABELS[entry.referral],
    entry.region,
    ...(distance === null || distance === undefined
      ? []
      : [formatDistance(distance, entry.region)]),
  ];

  return (
    <li className="entry-row">
      <Link
        className="entry-row-link"
        to={`/entry/${entry.slug}`}
        state={{ from: `${location.pathname}${location.search}` }}
      >
        <span className="entry-row-org">{entry.org}</span>
        <span className="entry-row-title">{entry.program}</span>
        <span className="entry-row-desc">{entry.description}</span>
        <span className="entry-row-meta">{meta.join(" · ")}</span>
        <span className="entry-row-step">
          <span className="entry-row-step-label">First step:</span> {entry.firstStep}
        </span>
      </Link>
    </li>
  );
}
