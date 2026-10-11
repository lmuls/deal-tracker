import { ChoiceChips, type ChoiceOption } from './ChoiceChips';
import { cx } from './cx';
import './ChoiceField.css';

/** ChoiceChips with a visible label above them, laid out like a TextField. */
export interface ChoiceFieldProps<T extends string = string> {
  label: string;
  options: ChoiceOption<T>[];
  value: T;
  onChange?: (value: T) => void;
  disabled?: boolean;
  className?: string;
}

export function ChoiceField<T extends string = string>({ label, className, ...chips }: ChoiceFieldProps<T>) {
  return (
    <div className={cx('app-choice-field', className)}>
      <span className="dt-field__label" aria-hidden="true">{label}</span>
      <ChoiceChips label={label} {...chips} />
    </div>
  );
}
