import { Link, useLocation, useParams } from "react-router-dom";
import { ENTRIES } from "../data/entries.js";
import { COST_LABELS, REFERRAL_LABELS, optionLabel } from "../data/filters.js";
import { formatDate } from "../lib/format.js";

export default function EntryPage() {
  const { slug } = useParams();
  const location = useLocation();
  const entry = ENTRIES.find((item) => item.slug === slug);
  const backTo =
    typeof location.state?.from === "string" && location.state.from.startsWith("/directory")
      ? location.state.from
      : "/directory";

  if (!entry) {
    return (
      <div className="entry">
        <h1>Service not found</h1>
        <p className="muted">This service listing does not exist, or may have moved.</p>
        <p>
          <Link to="/directory">Back to the directory</Link>
        </p>
      </div>
    );
  }

  const referralNote =
    entry.referral === "self"
      ? "No referral needed. You can reach out directly."
      : "A referral is needed to get started.";

  return (
    <article className="entry">
      <p className="back">
        <Link to={backTo}>
          <span aria-hidden="true">←</span> Back to the directory
        </Link>
      </p>

      <header className="entry-head">
        <p className="entry-org">{entry.org}</p>
        <h1>{entry.program}</h1>
      </header>

      <section className="first-step" aria-labelledby="first-step-title">
        <h2 id="first-step-title">First step</h2>
        <p className="first-step-action">{entry.firstStep}</p>
        <p className="first-step-note">{referralNote}</p>
      </section>

      <p className="entry-desc">{entry.description}</p>

      <section className="entry-details">
        <h2>Details</h2>
        <dl>
          <div>
            <dt>Cost</dt>
            <dd>{COST_LABELS[entry.cost]}</dd>
          </div>
          <div>
            <dt>Ways to get help</dt>
            <dd>{entry.nature.map((value) => optionLabel("nature", value)).join(" · ")}</dd>
          </div>
          <div>
            <dt>Referral</dt>
            <dd>{REFERRAL_LABELS[entry.referral]}</dd>
          </div>
          <div>
            <dt>Ages</dt>
            <dd>{entry.ages.map((value) => optionLabel("ages", value)).join(" · ")}</dd>
          </div>
          {entry.considerations.length > 0 && (
            <div>
              <dt>Designed with consideration for</dt>
              <dd>
                {entry.considerations
                  .map((value) => optionLabel("considerations", value))
                  .join(" · ")}
              </dd>
            </div>
          )}
          <div>
            <dt>I want help with</dt>
            <dd>{entry.concerns.map((value) => optionLabel("concerns", value)).join(" · ")}</dd>
          </div>
          <div>
            <dt>Where</dt>
            <dd>{entry.region}</dd>
          </div>
          <div>
            <dt>Availability</dt>
            <dd>{entry.availability}</dd>
          </div>
          <div>
            <dt>Last verified</dt>
            <dd>
              <time dateTime={entry.lastVerified}>{formatDate(entry.lastVerified)}</time>
            </dd>
          </div>
        </dl>
      </section>

      <section className="entry-contact">
        <h2>Contact</h2>
        <p>{entry.contact}</p>
      </section>
    </article>
  );
}
