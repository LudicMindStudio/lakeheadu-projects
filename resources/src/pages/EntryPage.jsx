import { useEffect } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import EntryMedia from "../components/EntryMedia.jsx";
import { ageLabels, badgeFor, collectionLabel, familyFor, formatDate } from "../lib/entries.js";
import { resolveEmbed } from "../lib/embed.js";
import { supportsViewTransitions, useReducedMotion } from "../lib/motion.js";
import { useEntries } from "../lib/useEntries.js";

// One entry, everything: the hero banner, a quick facts banner, the
// description, and each embedded media item. Back returns the list.
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

  const vtName = viewTransition ? `entry-${entry.id}` : undefined;
  const embeds = (entry.embeds ?? []).filter((media) => resolveEmbed(media));

  return (
    <article className="entry-detail">
      <p className="back-row">
        <Link
          className="back-button"
          to={backHref}
          viewTransition={viewTransition}
          aria-label="Back to the list"
        >
          <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">
            <path
              d="M10 3.75L5.75 8 10 12.25"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
      </p>

      <div className="entry-hero" style={{ viewTransitionName: vtName }}>
        <EntryMedia entry={entry} className="entry-hero-media" />
      </div>

      <header className="entry-head">
        <span className={`badge badge-${familyFor(entry.format)}`}>{badgeFor(entry.format)}</span>
        <h1>{entry.title}</h1>
        <p className="entry-source">{entry.source}</p>
      </header>

      <div className="entry-body">
        <div className="entry-quick">
          <span className="quick-item">
            <span className="quick-key">For</span> {ageLabels(entry.age_groups)}
          </span>
          {entry.collection && (
            <span className="quick-item">
              <span className="quick-key">Listed in</span> {collectionLabel(entry.collection)}
            </span>
          )}
          {entry.published_date && (
            <span className="quick-item">
              <span className="quick-key">Published</span> {formatDate(entry.published_date)}
            </span>
          )}
          <span className="quick-item">
            <span className="quick-key">Added</span> {formatDate(entry.added_date)}
          </span>
          {entry.tags.length > 0 && (
            <span className="quick-tags">
              {entry.tags.map((tag) => (
                <span className="tag" key={tag}>
                  {tag}
                </span>
              ))}
            </span>
          )}
        </div>

        <p className="entry-description">{entry.description}</p>

        {embeds.length > 0 && (
          <section className="entry-embed" aria-label="Embedded media">
            {embeds.map((media, index) => {
              const embed = resolveEmbed(media);
              return (
                <figure className="embed-item" key={`${media.kind}-${index}`}>
                  {embed.mode === "video" && (
                    <video className="embed-video" src={embed.src} controls preload="auto" />
                  )}
                  {embed.mode === "iframe" && (
                    <iframe
                      className="embed-frame"
                      src={embed.src}
                      title={media.title || entry.title}
                    />
                  )}
                  {embed.mode === "pdf" && (
                    <object
                      className="embed-frame embed-frame-doc"
                      data={embed.src}
                      type="application/pdf"
                      title={media.title || entry.title}
                    >
                      <p className="embed-fallback">
                        <a href={embed.src} target="_blank" rel="noreferrer">
                          Open the document
                        </a>
                      </p>
                    </object>
                  )}
                  {embed.mode === "link" && (
                    <a
                      className="button-secondary"
                      href={embed.src}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open the media
                    </a>
                  )}
                  {media.title && <figcaption className="embed-caption">{media.title}</figcaption>}
                </figure>
              );
            })}
          </section>
        )}

        {entry.url && (
          <p className="entry-action">
            <a className="button" href={entry.url} target="_blank" rel="noreferrer">
              Open resource
            </a>
          </p>
        )}
      </div>
    </article>
  );
}
