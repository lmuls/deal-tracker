import './ChoiceChips.css';
import { cx } from './cx';

export interface ChoiceOption<T extends string = string> {
  value: T;
  label: string;
}

/** Single choice from a short set of options, shown as pills. */
export interface ChoiceChipsProps<T extends string = string> {
  /** Accessible name for the group. */
  label: string;
  options: ChoiceOption<T>[];
  value: T;
  onChange?: (value: T) => void;
  disabled?: boolean;
}

export function ChoiceChips<T extends string = string>({ label, options, value, onChange, disabled }: ChoiceChipsProps<T>) {
  return (
    <div className="dt-chips" role="radiogroup" aria-label={label}>
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            className={cx('dt-chip', selected && 'is-selected')}
            onClick={() => onChange?.(o.value)}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
