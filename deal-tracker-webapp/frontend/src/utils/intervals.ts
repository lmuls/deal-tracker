import type { ChoiceOption } from '../components/ui/ChoiceChips';

/** Check intervals the API accepts, as ISO-8601 durations. */
export type CheckInterval = 'PT30M' | 'PT1H' | 'PT6H' | 'PT12H' | 'P1D';

export const DEFAULT_CHECK_INTERVAL: CheckInterval = 'P1D';

export const CHECK_INTERVALS: ChoiceOption<CheckInterval>[] = [
  { value: 'PT30M', label: '30 min' },
  { value: 'PT1H', label: 'Hourly' },
  { value: 'PT6H', label: '6 hours' },
  { value: 'PT12H', label: '12 hours' },
  { value: 'P1D', label: 'Daily' },
];

const INTERVAL_TEXT: Record<string, string> = {
  PT30M: '30 minutes',
  PT1H: 'hour',
  PT6H: '6 hours',
  PT12H: '12 hours',
  P1D: '24 hours',
  P2D: '2 days',
  P7D: '7 days',
};

/** "30 minutes", "hour", "24 hours": reads after "every". */
export function intervalText(iso?: string): string {
  if (!iso) return '24 hours';
  return INTERVAL_TEXT[iso] ?? iso;
}
