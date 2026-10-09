// The entry editor form. Every field in the entry shape is editable here.
// Changes publish to the store the public site reads.

import { useState } from "react";
import { FILTER_GROUPS } from "../../data/filters.js";
import { TOWNS, findTown } from "../../data/towns.js";
import { slugify } from "../../lib/slug.js";

const NATURE_OPTIONS = FILTER_GROUPS.find((group) => group.id === "nature").options;
const CONCERN_OPTIONS = FILTER_GROUPS.find((group) => group.id === "concerns").options;
const AGE_OPTIONS = FILTER_GROUPS.find((group) => group.id === "ages").options;
const CONSIDERATION_OPTIONS = FILTER_GROUPS.find((group) => group.id === "considerations").options;

const FIELD_LABELS = {
  form: "Form",
  slug: "Address",
  org: "Organization",
  program: "Program",
  description: "Description",
  cost: "Cost",
  nature: "Ways to get help",
  referral: "Referral",
  considerations: "Considerations",
  ages: "Age range",
  concerns: "I want help with",
  contact: "Contact",
  region: "Town",
  lat: "Latitude",
  lng: "Longitude",
  firstStep: "First step",
  availability: "Availability",
  status: "Status",
  lastVerified: "Last verified",
};

function emptyDraft() {
  return {
    slug: "",
    org: "",
    program: "",
    description: "",
    cost: "free",
    nature: [],
    referral: "self",
    considerations: [],
    ages: [],
    concerns: [],
    contact: "",
    region: TOWNS[0].name,
    lat: TOWNS[0].lat,
    lng: TOWNS[0].lon,
    firstStep: "",
    availability: "",
    status: "accepting",
    lastVerified: new Date().toISOString().slice(0, 10),
  };
}

function CheckGroup({ legend, options, values, onToggle }) {
  return (
    <fieldset className="form-group">
      <legend>{legend}</legend>
      <div className="form-checks">
        {options.map((option) => (
          <label key={option.value} className="form-check">
            <input
              type="checkbox"
              checked={values.includes(option.value)}
              onChange={() => onToggle(option.value)}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export default function EntryForm({ initial, errors, busy, onSubmit, onCancel }) {
  const [draft, setDraft] = useState(() => (initial ? { ...initial } : emptyDraft()));
  const [slugTouched, setSlugTouched] = useState(Boolean(initial));
  const isNew = !initial;

  const set = (key) => (event) => setDraft((prev) => ({ ...prev, [key]: event.target.value }));

  const toggle = (key, value) =>
    setDraft((prev) => {
      const current = prev[key];
      return {
        ...prev,
        [key]: current.includes(value)
          ? current.filter((item) => item !== value)
          : [...current, value],
      };
    });

  const useTownCentre = () => {
    const town = findTown(draft.region);
    if (town) {
      setDraft((prev) => ({ ...prev, lat: town.lat, lng: town.lon }));
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const slug = draft.slug || (slugTouched ? "" : slugify(draft.program));
    onSubmit({
      ...draft,
      slug,
      lat: Number(draft.lat),
      lng: Number(draft.lng),
    });
  };

  return (
    <form className="entry-form" onSubmit={handleSubmit}>
      {errors && (
        <div className="form-errors" role="alert">
          {Object.entries(errors).map(([key, message]) => (
            <p key={key}>
              {key === "form" ? String(message) : `${FIELD_LABELS[key] ?? key}: ${message}`}
            </p>
          ))}
        </div>
      )}

      <div className="form-row">
        <label className="form-field">
          <span>Program name</span>
          <input value={draft.program} onChange={set("program")} required maxLength={120} />
        </label>
        <label className="form-field">
          <span>Organization</span>
          <input value={draft.org} onChange={set("org")} required maxLength={120} />
        </label>
      </div>

      <label className="form-field">
        <span>Address (slug)</span>
        <input
          value={draft.slug}
          disabled={!isNew}
          placeholder="built from the program name"
          onChange={(event) => {
            setSlugTouched(true);
            set("slug")(event);
          }}
        />
        {!isNew && <span className="form-hint">The address stays the same after creation.</span>}
      </label>

      <label className="form-field">
        <span>Description</span>
        <textarea value={draft.description} onChange={set("description")} rows={3} required />
      </label>

      <label className="form-field">
        <span>First step — one sentence, including the point of contact</span>
        <textarea value={draft.firstStep} onChange={set("firstStep")} rows={2} required />
      </label>

      <div className="form-row">
        <label className="form-field">
          <span>Cost</span>
          <select value={draft.cost} onChange={set("cost")}>
            <option value="free">Free</option>
            <option value="not-free">Has a fee</option>
          </select>
        </label>
        <label className="form-field">
          <span>Referral</span>
          <select value={draft.referral} onChange={set("referral")}>
            <option value="self">No referral needed</option>
            <option value="required">A referral is needed</option>
          </select>
        </label>
        <label className="form-field">
          <span>Status</span>
          <select value={draft.status ?? ""} onChange={set("status")}>
            <option value="">No badge</option>
            <option value="accepting">Accepting new clients</option>
            <option value="call-first">Call to check</option>
            <option value="waitlist">Waitlist</option>
          </select>
        </label>
      </div>

      <CheckGroup
        legend="Ways to get help"
        options={NATURE_OPTIONS}
        values={draft.nature}
        onToggle={(value) => toggle("nature", value)}
      />
      <CheckGroup
        legend="I want help with"
        options={CONCERN_OPTIONS}
        values={draft.concerns}
        onToggle={(value) => toggle("concerns", value)}
      />
      <CheckGroup
        legend="Age range"
        options={AGE_OPTIONS}
        values={draft.ages}
        onToggle={(value) => toggle("ages", value)}
      />
      <CheckGroup
        legend="Designed with consideration for"
        options={CONSIDERATION_OPTIONS}
        values={draft.considerations}
        onToggle={(value) => toggle("considerations", value)}
      />

      <div className="form-row form-row-map">
        <label className="form-field">
          <span>Town</span>
          <select value={draft.region} onChange={set("region")}>
            {TOWNS.map((town) => (
              <option key={town.name} value={town.name}>
                {town.name}
              </option>
            ))}
          </select>
        </label>
        <label className="form-field">
          <span>Latitude</span>
          <input type="number" step="0.001" value={draft.lat} onChange={set("lat")} required />
        </label>
        <label className="form-field">
          <span>Longitude</span>
          <input type="number" step="0.001" value={draft.lng} onChange={set("lng")} required />
        </label>
        <button type="button" className="btn-quiet form-town-btn" onClick={useTownCentre}>
          Use town centre
        </button>
      </div>

      <label className="form-field">
        <span>Contact — the channel plus the identifier</span>
        <input value={draft.contact} onChange={set("contact")} required />
      </label>
      <label className="form-field">
        <span>Availability</span>
        <input value={draft.availability} onChange={set("availability")} required />
      </label>
      <label className="form-field">
        <span>Last verified</span>
        <input type="date" value={draft.lastVerified} onChange={set("lastVerified")} required />
      </label>

      <div className="form-actions">
        <button type="submit" className="btn" disabled={busy}>
          {busy ? "Saving…" : isNew ? "Create entry" : "Save entry"}
        </button>
        <button type="button" className="btn-quiet" onClick={onCancel} disabled={busy}>
          Cancel
        </button>
      </div>
    </form>
  );
}
