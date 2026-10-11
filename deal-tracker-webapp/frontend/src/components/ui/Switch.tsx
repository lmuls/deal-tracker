import { useId, useState } from 'react';
import { cx } from './cx';
import './Switch.css';

/** On/off toggle for settings that apply immediately. */
export interface SwitchProps {
  label?: string;
  description?: string;
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (next: boolean) => void;
  disabled?: boolean;
  id?: string;
  className?: string;
}

export function Switch({ label, description, checked, defaultChecked, onChange, disabled, id, className }: SwitchProps) {
  const generated = useId();
  const switchId = id ?? generated;
  const controlled = checked !== undefined;
  const [own, setOwn] = useState(!!defaultChecked);
  const on = controlled ? !!checked : own;

  const toggle = () => {
    if (disabled) return;
    if (!controlled) setOwn(!on);
    onChange?.(!on);
  };

  return (
    <div className={cx('dt-switch', disabled && 'dt-switch--disabled', className)}>
      <button
        type="button"
        role="switch"
        id={switchId}
        aria-checked={on}
        aria-labelledby={label ? `${switchId}-l` : undefined}
        disabled={disabled}
        className={cx('dt-switch__track', on && 'is-on')}
        onClick={toggle}
      >
        <span className="dt-switch__thumb" />
      </button>
      {(label || description) && (
        <div className="dt-switch__text">
          {label && <label id={`${switchId}-l`} htmlFor={switchId} className="dt-switch__label">{label}</label>}
          {description && <span className="dt-switch__desc">{description}</span>}
        </div>
      )}
    </div>
  );
}
