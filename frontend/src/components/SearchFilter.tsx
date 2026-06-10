import { useEffect, useId, useRef, useState } from "react";
import { FilterIcon } from "./ActionIcons";

type SearchFilterProps = {
  label: string;
  options: string[];
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
};

export const SearchFilter = ({
  label,
  options,
  placeholder,
  value,
  onChange
}: SearchFilterProps) => {
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    }
  }, [open]);

  return (
    <div className={`search-filter${open ? " is-open" : ""}`}>
      <button
        type="button"
        className={`ghost-button icon-button filter-button${value ? " is-active" : ""}`}
        aria-expanded={open}
        aria-label={label}
        title={label}
        onClick={() => setOpen((current) => !current)}
      >
        <FilterIcon />
      </button>
      {open && (
        <div className="search-filter-field">
          <input
            ref={inputRef}
            aria-label={label}
            list={listId}
            placeholder={placeholder}
            type="search"
            value={value}
            onChange={(event) => onChange(event.target.value)}
          />
          <datalist id={listId}>
            {options.map((option) => (
              <option key={option} value={option} />
            ))}
          </datalist>
        </div>
      )}
    </div>
  );
};
