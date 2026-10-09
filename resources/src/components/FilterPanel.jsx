import { AGE_GROUPS, COLLECTIONS, FORMATS } from "../lib/entries.js";

function Group({ legend, group, options, counts, selected, onToggle }) {
  return (
    <fieldset className="filter-group">
      <legend>{legend}</legend>
      <div className="filter-options">
        {options.map((option) => (
          <label key={option.key} className="filter-option">
            <input
              type="checkbox"
              checked={selected.has(option.key)}
              onChange={() => onToggle(group, option.key)}
            />
            <span>{option.label}</span>
            <span className="filter-count" aria-hidden="true">
              {counts[option.key]}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

// The filters panel: one quiet disclosure in the results row, unfolding to a
// sheet on narrow screens. Options combine within a group and narrow across.
export default function FilterPanel({ open, counts, selected, onToggle, onClose }) {
  return (
    <div
      id="filters-panel"
      className="filters-panel"
      hidden={!open}
      onKeyDown={(event) => {
        if (event.key === "Escape") onClose();
      }}
    >
      <Group
        legend="What kind of resource?"
        group="kind"
        options={FORMATS}
        counts={counts.kind}
        selected={selected.kind}
        onToggle={onToggle}
      />
      <Group
        legend="Who it’s for?"
        group="who"
        options={AGE_GROUPS}
        counts={counts.who}
        selected={selected.who}
        onToggle={onToggle}
      />
      <Group
        legend="mHealth apps"
        group="apps"
        options={COLLECTIONS}
        counts={counts.apps}
        selected={selected.apps}
        onToggle={onToggle}
      />
      <div className="filters-footer">
        <button type="button" className="button-secondary" onClick={onClose}>
          Done
        </button>
      </div>
    </div>
  );
}
