import { useEffect } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ENTRIES, ageLabels, badgeFor, collectionLabel, formatDate } from "../lib/entries.js";

export default function EntryPage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const entry = ENTRIES.find((item) => item.id === id);
  const browseHref = `/browse${params.toString() ? `?${params.toString()}` : ""}`;

  useEffect(() => {
    document.title = entry
      ? `${entry.title} · Resources & tools`
      : "Entry not found · Resources & tools";
  }, [entry]);

  if (!entry) {
    return (
      <div className="not-found">
        <h1>Entry not found</h1>
        <p>That entry could not be found — it may have been removed, or the link may be wrong.</p>
        <p className="not-found-action">
          <Link className="button-secondary" to={browseHref}>
            Browse resources
          </Link>
        </p>
      </div>
    );
  }

  return (
    <article className="entry-detail">
      <p className="back-row">
        <Link className="back-link" to={browseHref}>
          Back to browse
        </Link>
      </p>

      <span className="entry-badge">{badgeFor(entry.format)}</span>
      <h1>{entry.title}</h1>
      <p className="entry-source">{entry.source}</p>
      <p className="entry-description">{entry.description}</p>

      {entry.url ? (
        <p className="entry-action">
          <a className="button" href={entry.url} target="_blank" rel="noreferrer">
            Open resource
          </a>
        </p>
      ) : (
        <p className="sample-note">
          <strong>Sample content.</strong> In the finished library, this entry links to the
          resource.
        </p>
      )}

      <dl className="entry-meta">
        <div>
          <dt>Who it’s for</dt>
          <dd>{ageLabels(entry.age_groups)}</dd>
        </div>
        {entry.published_date && (
          <div>
            <dt>Published</dt>
            <dd>{formatDate(entry.published_date)}</dd>
          </div>
        )}
        {entry.collection && (
          <div>
            <dt>Listed in</dt>
            <dd>{collectionLabel(entry.collection)}</dd>
          </div>
        )}
        <div>
          <dt>Added</dt>
          <dd>{formatDate(entry.added_date)}</dd>
        </div>
        {entry.tags.length > 0 && (
          <div>
            <dt>Topics</dt>
            <dd className="tags">
              {entry.tags.map((tag) => (
                <span className="tag" key={tag}>
                  {tag}
                </span>
              ))}
            </dd>
          </div>
        )}
      </dl>
    </article>
  );
}
