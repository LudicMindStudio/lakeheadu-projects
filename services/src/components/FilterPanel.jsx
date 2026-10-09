import { FILTER_GROUPS } from "../data/filters.js";

export default function FilterPanel({ id, filters, onToggle }) {
  return (
    <div className="filter-panel" id={id}>
      <h2 className="sr-only">Filters</h2>
      <div className="filter-groups">
        {FILTER_GROUPS.map((group) => (
          <fieldset key={group.id} className="filter-group">
            <legend>{group.legend}</legend>
            {group.options.map((option) => (
              <label key={option.value} className="filter-option">
                <input
                  type="checkbox"
                  checked={filters[group.id].includes(option.value)}
                  onChange={() => onToggle(group.id, option.value)}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </fieldset>
        ))}
      </div>
    </div>
  );
}
