import { useState } from "react";
import { Link } from "react-router-dom";
import { ageLabels, badgeFor, familyFor, formatDate, recencyKey } from "../lib/entries.js";
import { highlightParts } from "../lib/browse.js";
import { supportsViewTransitions, useReducedMotion } from "../lib/motion.js";
import EntryMedia from "./EntryMedia.jsx";

function Highlighted({ text, terms }) {
  return highlightParts(text, terms).map((part, index) =>
    index % 2 === 1 ? <mark key={index}>{part}</mark> : part,
  );
}

// One entry as a media-led card: it fills a cell in the ring, runs as a wide
// band in the list, and opens its details in place.
export default function EntryCard({ entry, terms, browseSearch, style }) {
  const [open, setOpen] = useState(false);
  const reduced = useReducedMotion();
  const detailsId = `card-details-${entry.id}`;
  const meta = [ageLabels(entry.age_groups), formatDate(recencyKey(entry))]
    .filter(Boolean)
    .join(" · ");
  const target = { pathname: `/entry/${entry.id}`, search: browseSearch };
  const viewTransition = supportsViewTransitions() && !reduced;
  const vtName = viewTransition ? `entry-${entry.id}` : undefined;

  return (
    <article
      className="card"
      data-open={open ? "true" : undefined}
      style={{ viewTransitionName: vtName, ...style }}
    >
      <div className="card-media">
        <Link
          className="card-media-link"
          to={target}
          viewTransition={viewTransition}
          tabIndex={-1}
          aria-hidden="true"
        >
          <EntryMedia entry={entry} />
        </Link>
        <span className="card-scrim" aria-hidden="true" />
        <span className={`badge badge-${familyFor(entry.format)}`}>{badgeFor(entry.format)}</span>
      </div>

      <div className="card-body">
        <h2 className="card-title">
          <Link className="card-link" to={target} viewTransition={viewTransition}>
            <Highlighted text={entry.title} terms={terms} />
          </Link>
        </h2>
        <p className="card-source">{entry.source}</p>
        {terms.length > 0 && (
          <p className="card-snippet">
            <Highlighted text={entry.description} terms={terms} />
          </p>
        )}

        <div className="card-meta">
          <span className="card-meta-text">{meta}</span>
          <button
            type="button"
            className="card-more"
            aria-expanded={open}
            aria-controls={detailsId}
            onClick={() => setOpen((was) => !was)}
          >
            {open ? "Less" : "More"}
          </button>
        </div>

        <div className="card-expand" id={detailsId} data-open={open ? "true" : "false"}>
          <div className="card-expand-inner" inert={!open}>
            <p className="card-description">{entry.description}</p>
            {entry.tags.length > 0 && (
              <ul className="card-tags">
                {entry.tags.map((tag) => (
                  <li key={tag}>{tag}</li>
                ))}
              </ul>
            )}
            <p className="card-open-row">
              <Link className="card-open-link" to={target} viewTransition={viewTransition}>
                Open the full page
              </Link>
              {!entry.url && <span className="card-sample">Sample entry</span>}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}
