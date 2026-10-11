import { useState } from 'react';
import type { TrackerFormValues } from '../components/ui';
import { createTracker } from '../utils/trackers';

/** Creates a tracker from AddTrackerForm values and tracks the request state. */
export function useAddTracker(onCreated: () => void, initialError?: string) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>(initialError);

  const submit = async (values: TrackerFormValues) => {
    setSubmitting(true);
    setError(undefined);
    const err = await createTracker(values);
    setSubmitting(false);
    if (err) {
      setError(err);
      return;
    }
    onCreated();
  };

  return { submit, submitting, error, setError };
}
