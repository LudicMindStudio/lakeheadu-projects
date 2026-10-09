import { Link } from "react-router-dom";
import { ageLabels, badgeFor, formatDate, recencyKey } from "../lib/entries.js";
import { highlightParts } from "../lib/browse.js";

function Highlighted({ text, terms }) {
  return highlightParts(text, terms).map((part, index) =>
    index % 2 === 1 ? <mark key={index}>{part}</mark> : part,
  );
}

// One entry in the results list. The whole card is clickable; the title link
// is the real link, stretched over the card.
export default function EntryCard({ entry, terms, browseSearch }) {
  const meta = [entry.source, ageLabels(entry.age_groups), formatDate(recencyKey(entry))]
    .filter(Boolean)
    .join(" · ");

  return (
    <li className="entry-card">
      <span className="entry-badge">{badgeFor(entry.format)}</span>
      <h2 className="entry-title">
        <Link className="entry-link" to={{ pathname: `/entry/${entry.id}`, search: browseSearch }}>
          <Highlighted text={entry.title} terms={terms} />
        </Link>
      </h2>
      <p className="entry-snippet">
        <Highlighted text={entry.description} terms={terms} />
      </p>
      <p className="entry-card-meta">{meta}</p>
    </li>
  );
}
