// The full filter panel, opened from the rail as a floating layer.

import { FILTER_GROUPS } from "../data/filters.js";

export default function FilterPanel({ id, filters, onToggle, onClear, onClose }) {
  return (
    <div className="filter-panel" id={id}>
      <div className="filter-panel-head">
        <h2 className="filter-panel-title">Filters</h2>
        <button type="button" className="panel-close" aria-label="Close filters" onClick={onClose}>
          ×
        </button>
      </div>
      <div className="filter-groups">
        {FILTER_GROUPS.map((group) => (
          <fieldset key={group.id} className="filter-group">
            <legend>{group.legend}</legend>
            {group.options.map((option) => (
              <label
                key={option.value}
                className={`filter-option${group.id === "concerns" ? " filter-option-cat" : ""}`}
                {...(group.id === "concerns" ? { "data-cat": option.value } : {})}
              >
                <input
                  type="checkbox"
                  checked={filters[group.id].includes(option.value)}
                  onChange={() => onToggle(group.id, option.value)}
                />
                {group.id === "concerns" && <span className="cat-dot" aria-hidden="true" />}
                <span>{option.label}</span>
              </label>
            ))}
          </fieldset>
        ))}
      </div>
      <div className="filter-panel-foot">
        <button type="button" className="chip-clear" onClick={onClear}>
          Clear all filters
        </button>
      </div>
    </div>
  );
}
