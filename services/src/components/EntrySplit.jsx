// The entry view: a pseudo page rendered as an animated split of the map.
// The card slides in from the right as a floating sub-window; the first
// step leads.

import { useEffect, useRef } from "react";
import { COST_LABELS, REFERRAL_NOTES, STATUS_LABELS, optionLabel } from "../data/filters.js";
import { formatDate } from "../lib/format.js";

export default function EntrySplit({ entry, onClose }) {
  const closeRef = useRef(null);

  useEffect(() => {
    closeRef.current?.focus();
  }, [entry.slug]);

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <aside className="entry-card" role="dialog" aria-label={`${entry.program} — service details`}>
      <header className="ec-head">
        <button
          ref={closeRef}
          type="button"
          className="ec-close"
          aria-label="Close service details"
          onClick={onClose}
        >
          ×
        </button>
      </header>
      <div className="ec-scroll">
        <section className="ec-hero" aria-label="Your first step">
          <p className="ec-hero-label">Your first step</p>
          <p className="ec-hero-action">{entry.firstStep}</p>
          <p className="ec-hero-note">{REFERRAL_NOTES[entry.referral]}</p>
        </section>

        <div className="ec-title">
          <p className="ec-org">{entry.org}</p>
          <h1 className="ec-program">{entry.program}</h1>
          {entry.status && STATUS_LABELS[entry.status] && (
            <p className={`ec-status status-${entry.status}`}>{STATUS_LABELS[entry.status]}</p>
          )}
        </div>

        <p className="ec-desc">{entry.description}</p>

        <section className="ec-details" aria-label="Details">
          <h2 className="ec-section-title">Details</h2>
          <dl className="ec-rows">
            <div className="ec-row">
              <dt>Cost</dt>
              <dd>
                {entry.cost === "free" ? (
                  <span className="tag-free">Free</span>
                ) : (
                  COST_LABELS[entry.cost]
                )}
              </dd>
            </div>
            <div className="ec-row">
              <dt>Ways to get help</dt>
              <dd className="ec-chips">
                {entry.nature.map((value) => (
                  <span key={value} className="tag">
                    {optionLabel("nature", value)}
                  </span>
                ))}
              </dd>
            </div>
            <div className="ec-row">
              <dt>Ages</dt>
              <dd className="ec-chips">
                {entry.ages.map((value) => (
                  <span key={value} className="tag">
                    {optionLabel("ages", value)}
                  </span>
                ))}
              </dd>
            </div>
            {entry.considerations.length > 0 && (
              <div className="ec-row">
                <dt>Designed with consideration for</dt>
                <dd className="ec-chips">
                  {entry.considerations.map((value) => (
                    <span key={value} className="tag">
                      {optionLabel("considerations", value)}
                    </span>
                  ))}
                </dd>
              </div>
            )}
            <div className="ec-row">
              <dt>I want help with</dt>
              <dd className="ec-chips">
                {entry.concerns.map((value) => (
                  <span key={value} className="tag tag-cat" data-cat={value}>
                    {optionLabel("concerns", value)}
                  </span>
                ))}
              </dd>
            </div>
            <div className="ec-row">
              <dt>Where</dt>
              <dd>{entry.region}</dd>
            </div>
            <div className="ec-row">
              <dt>Availability</dt>
              <dd>{entry.availability}</dd>
            </div>
            <div className="ec-row">
              <dt>Last verified</dt>
              <dd>
                <time dateTime={entry.lastVerified}>{formatDate(entry.lastVerified)}</time>
              </dd>
            </div>
          </dl>
        </section>

        <section className="ec-contact" aria-label="Contact">
          <h2 className="ec-section-title">Contact</h2>
          <p>{entry.contact}</p>
        </section>

        <p className="ec-sample">Sample listing, not a real service yet.</p>
      </div>
    </aside>
  );
}
