import { useState, type FormEvent } from 'react';
import { Button } from './Button';
import { Notice } from './Notice';
import { TextField } from './TextField';
import { cx } from './cx';
import './AuthCard.css';

export type AuthMode = 'register' | 'login';

/** Sign-up and log-in in one card. */
export interface AuthCardProps {
  defaultMode?: AuthMode;
  /** Controlled mode; pair with onModeChange. */
  mode?: AuthMode;
  onModeChange?: (mode: AuthMode) => void;
  /** The fields are named `name`, `email` and `password`; read them from the form. */
  onSubmit?: (mode: AuthMode, event: FormEvent<HTMLFormElement>) => void;
  /** Hides the "Forgot password?" link when omitted. */
  forgotHref?: string;
  /** Ask for a name when creating an account. Default true. */
  collectName?: boolean;
  /** Fine print under the submit button, per mode. */
  finePrint?: Partial<Record<AuthMode, string>>;
  submitting?: boolean;
  error?: string;
  className?: string;
}

const DEFAULT_FINE_PRINT: Record<AuthMode, string> = {
  register: 'Free for up to 5 trackers. No card needed.',
  login: 'Welcome back. Your trackers kept watching.',
};

export function AuthCard({
  defaultMode = 'register', mode: controlledMode, onModeChange, onSubmit, forgotHref,
  collectName = true, finePrint, submitting, error, className,
}: AuthCardProps) {
  const [ownMode, setOwnMode] = useState<AuthMode>(defaultMode);
  const mode = controlledMode ?? ownMode;
  const reg = mode === 'register';
  const fine = { ...DEFAULT_FINE_PRINT, ...finePrint }[mode];

  const switchTo = (next: AuthMode) => {
    if (controlledMode === undefined) setOwnMode(next);
    onModeChange?.(next);
  };

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit?.(mode, e);
  };

  return (
    <div className={cx('dt-auth', className)}>
      <div className="dt-auth__tabs" role="tablist">
        <button type="button" role="tab" aria-selected={reg} className={cx('dt-auth__tab', reg && 'is-active')} onClick={() => switchTo('register')}>
          Create account
        </button>
        <button type="button" role="tab" aria-selected={!reg} className={cx('dt-auth__tab', !reg && 'is-active')} onClick={() => switchTo('login')}>
          Log in
        </button>
      </div>
      <form className="dt-auth__form" onSubmit={submit}>
        {reg && collectName && <TextField label="Name" name="name" placeholder="Your name" autoComplete="name" />}
        <TextField label="Email" name="email" type="email" placeholder="you@example.com" autoComplete="email" required />
        <TextField
          key={mode}
          label="Password"
          name="password"
          type="password"
          placeholder={reg ? 'At least 8 characters' : '••••••••'}
          autoComplete={reg ? 'new-password' : 'current-password'}
          minLength={reg ? 8 : undefined}
          required
        />
        {!reg && forgotHref && <a className="dt-auth__link" href={forgotHref}>Forgot password?</a>}
        {error && <Notice tone="error">{error}</Notice>}
        <Button variant="primary" type="submit" className="dt-auth__submit" disabled={submitting}>
          {reg ? 'Create free account' : 'Log in'}
        </Button>
        <p className="dt-auth__fine">{fine}</p>
      </form>
    </div>
  );
}
