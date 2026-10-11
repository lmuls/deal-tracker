import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cx } from './cx';
import './Button.css';

export type ButtonVariant = 'primary' | 'secondary' | 'quiet';
export type ButtonSize = 'md' | 'sm';

/** Primary for the one action a view is for; secondary for supporting actions; quiet for low-emphasis and inline actions. */
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Optional leading icon element (20px outline icon). */
  icon?: ReactNode;
}

export function Button({ variant = 'secondary', size = 'md', icon, className, children, type = 'button', ...rest }: ButtonProps) {
  return (
    <button type={type} className={cx('dt-btn', `dt-btn--${variant}`, `dt-btn--${size}`, className)} {...rest}>
      {icon && <span className="dt-btn__icon" aria-hidden="true">{icon}</span>}
      {children}
    </button>
  );
}
