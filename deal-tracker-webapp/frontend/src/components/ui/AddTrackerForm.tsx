import { useState, type FormEvent } from 'react';
import { Button } from './Button';
import { ChoiceField } from './ChoiceField';
import { Notice } from './Notice';
import { TextField } from './TextField';
import { cx } from './cx';
import { CHECK_INTERVALS, DEFAULT_CHECK_INTERVAL, type CheckInterval } from '../../utils/intervals';
import './AddTrackerForm.css';

export interface TrackerFormValues {
  /** Without the scheme, e.g. "nordicoutdoor.se/jackets". */
  url: string;
  name: string;
  frequency: CheckInterval;
}

/**
 * Form for adding a store or page to watch. Differs from the reference (see the design README): the backend
 * detects any campaign, so there is no "Watch for" choice; alerts are set per account in Settings, so there
 * are no Email/Push switches; and the tracker takes a name.
 */
export interface AddTrackerFormProps {
  onSubmit?: (values: TrackerFormValues) => void;
  /** Shows a quiet Cancel button. */
  onCancel?: () => void;
  defaultValues?: Partial<TrackerFormValues>;
  /** Default "Track a new site". */
  title?: string;
  /** Default "Start tracking". */
  submitLabel?: string;
  /** Disables the submit button while the parent saves. */
  submitting?: boolean;
  /** Shown above the actions when saving failed. */
  error?: string;
  className?: string;
}

export function AddTrackerForm({
  onSubmit, onCancel, defaultValues = {}, title = 'Track a new site', submitLabel = 'Start tracking',
  submitting, error, className,
}: AddTrackerFormProps) {
  const [values, setValues] = useState<TrackerFormValues>({
    url: defaultValues.url ?? '',
    name: defaultValues.name ?? '',
    frequency: defaultValues.frequency ?? DEFAULT_CHECK_INTERVAL,
  });
  const set = <K extends keyof TrackerFormValues>(key: K) => (value: TrackerFormValues[K]) =>
    setValues((v) => ({ ...v, [key]: value }));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit?.({ ...values, url: values.url.trim(), name: values.name.trim() });
  };

  return (
    <form className={cx('dt-form', className)} onSubmit={submit}>
      <div className="dt-form__head">
        <h3 className="dt-form__title">{title}</h3>
        <p className="dt-form__sub">Paste a store or page and choose how often we check it.</p>
      </div>
      <TextField
        label="Website or page"
        placeholder="nordicoutdoor.se/jackets"
        prefix="https://"
        value={values.url}
        onChange={(e) => set('url')(e.target.value.replace(/^https?:\/\//i, ''))}
        required
      />
      <TextField
        label="Name"
        placeholder="Nordic Outdoor Store"
        hint="Shown on the tracker and in alerts."
        value={values.name}
        onChange={(e) => set('name')(e.target.value)}
        required
      />
      <ChoiceField label="Check every" options={CHECK_INTERVALS} value={values.frequency} onChange={set('frequency')} />
      {error && <Notice tone="error">{error}</Notice>}
      <div className="dt-form__actions">
        {onCancel && <Button variant="quiet" onClick={onCancel}>Cancel</Button>}
        <Button variant="primary" type="submit" disabled={submitting}>{submitLabel}</Button>
      </div>
    </form>
  );
}
