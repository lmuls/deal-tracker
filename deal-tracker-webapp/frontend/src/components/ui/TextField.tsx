import { useId, type InputHTMLAttributes } from 'react';
import { cx } from './cx';
import './TextField.css';

/** Labelled single-line input. Other props go to the <input>. */
export interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  label?: string;
  /** Fixed text inside the box, e.g. "https://". */
  prefix?: string;
  hint?: string;
  /** Replaces the hint and marks the field invalid. */
  error?: string;
}

export function TextField({ label, prefix, hint, error, className, id, type = 'text', ...input }: TextFieldProps) {
  const generated = useId();
  const inputId = id ?? generated;
  const msgId = `${inputId}-msg`;
  const message = error || hint;

  return (
    <div className={cx('dt-field', error && 'dt-field--error', className)}>
      {label && <label className="dt-field__label" htmlFor={inputId}>{label}</label>}
      <div className="dt-field__box">
        {prefix && <span className="dt-field__prefix">{prefix}</span>}
        <input
          {...input}
          id={inputId}
          type={type}
          className="dt-field__input"
          aria-invalid={error ? true : undefined}
          aria-describedby={message ? msgId : undefined}
        />
      </div>
      {message && <p id={msgId} className="dt-field__msg">{message}</p>}
    </div>
  );
}
