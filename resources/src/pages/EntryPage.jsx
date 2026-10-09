import { useEffect } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import EntryMedia from "../components/EntryMedia.jsx";
import { ageLabels, badgeFor, collectionLabel, familyFor, formatDate } from "../lib/entries.js";
import { resolveEmbed } from "../lib/embed.js";
import { supportsViewTransitions, useReducedMotion } from "../lib/motion.js";
import { useEntries } from "../lib/useEntries.js";

// One entry, everything: the hero banner, the description, embedded media
// when the entry carries it, and the meta table. Back returns the list.
export default function EntryPage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const entries = useEntries();
  const reduced = useReducedMotion();
  const entry = entries.find((item) => item.id === id);
  const backHref = params.toString() ? `/?${params.toString()}` : "/browse";
  const viewTransition = supportsViewTransitions() && !reduced;

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
          <Link className="button-secondary" to="/browse">
            Browse resources
          </Link>
        </p>
      </div>
    );
  }

  const embed = resolveEmbed(entry.embed);
  const vtName = entry.banner && viewTransition ? `entry-${entry.id}` : undefined;

  return (
    <article className="entry-detail">
      <p className="back-row">
        <Link className="back-link" to={backHref} viewTransition={viewTransition}>
          Back to the list
        </Link>
      </p>

      {entry.banner && (
        <div className="entry-hero" style={{ viewTransitionName: vtName }}>
          <EntryMedia entry={entry} className="entry-hero-media" />
        </div>
      )}

      <header className="entry-head">
        <span className={`badge badge-${familyFor(entry.format)}`}>{badgeFor(entry.format)}</span>
        <h1>{entry.title}</h1>
        <p className="entry-source">{entry.source}</p>
      </header>

      <div className="entry-body">
        <p className="entry-description">{entry.description}</p>

        {embed && (
          <section className="entry-embed" aria-label="Embedded media">
            {embed.mode === "video" && (
              <video className="embed-video" src={embed.src} controls preload="auto" />
            )}
            {embed.mode === "iframe" && (
              <iframe
                className="embed-frame"
                src={embed.src}
                title={entry.embed.title || entry.title}
              />
            )}
            {embed.mode === "pdf" && (
              <object
                className="embed-frame embed-frame-doc"
                data={embed.src}
                type="application/pdf"
                title={entry.embed.title || entry.title}
              >
                <p className="embed-fallback">
                  <a href={embed.src} target="_blank" rel="noreferrer">
                    Open the document
                  </a>
                </p>
              </object>
            )}
            {embed.mode === "link" && (
              <a className="button-secondary" href={embed.src} target="_blank" rel="noreferrer">
                Open the media
              </a>
            )}
            {entry.embed.title && <p className="embed-caption">{entry.embed.title}</p>}
          </section>
        )}

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
      </div>
    </article>
  );
}
