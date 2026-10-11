import type * as React from 'react';

/** Primary for the one action a view is for; secondary for supporting actions; quiet for low-emphasis and inline actions. */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'quiet';
  size?: 'md' | 'sm';
  /** Optional leading icon element (20px outline icon). */
  icon?: React.ReactNode;
}
export declare function Button(props: ButtonProps): React.ReactElement;

/** Pill label. `deal` and `soft` mean an offer exists; `watching` and `paused` describe a tracker. */
export interface DealBadgeProps {
  tone?: 'deal' | 'soft' | 'watching' | 'paused';
  /** Leading dot in the text colour. */
  dot?: boolean;
  className?: string;
  children?: React.ReactNode;
}
export declare function DealBadge(props: DealBadgeProps): React.ReactElement;

/** One tracked website or store. */
export interface TrackerCardProps {
  store: string;
  /** Display URL, e.g. "nordicoutdoor.se/sale". */
  url?: string;
  /** Square logo image URL; falls back to the store's initial. */
  logo?: string;
  status?: 'watching' | 'deal' | 'paused';
  /** Shown when status is "deal". */
  deal?: { title: string; detail?: string };
  /** What the tracker looks for, e.g. "Any campaign on jackets". */
  watchFor?: string;
  /** e.g. "Checked 4 min ago". */
  lastChecked?: string;
  /** Renders a Pause / Resume quiet button. */
  onTogglePause?: () => void;
  /** Renders a primary "View offer" button when status is "deal". */
  onViewOffer?: () => void;
  className?: string;
}
export declare function TrackerCard(props: TrackerCardProps): React.ReactElement;

/** One alert in the notification list. */
export interface NotificationRowProps {
  store: string;
  message: string;
  /** e.g. "2 min ago". */
  time: string;
  unread?: boolean;
  /** Short badge text, e.g. "-20%". */
  badge?: string;
  /** Renders as a link. */
  href?: string;
  /** Renders as a button when no href. */
  onClick?: () => void;
  className?: string;
}
export declare function NotificationRow(props: NotificationRowProps): React.ReactElement;

/** Labelled single-line input. Other props go to the <input>. */
export interface TextFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  label?: string;
  /** Fixed text inside the box, e.g. "https://". */
  prefix?: string;
  hint?: string;
  /** Replaces the hint and marks the field invalid. */
  error?: string;
}
export declare function TextField(props: TextFieldProps): React.ReactElement;

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
export declare function Switch(props: SwitchProps): React.ReactElement;

/** Single choice from a short set of options, shown as pills. */
export interface ChoiceChipsProps {
  /** Accessible name for the group. */
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange?: (value: string) => void;
}
export declare function ChoiceChips(props: ChoiceChipsProps): React.ReactElement;

export interface TrackerFormValues {
  url: string;
  watch: 'campaign' | 'price' | 'keyword' | 'shipping';
  keyword: string;
  frequency: '15m' | '30m' | '1h' | '1d';
  email: boolean;
  push: boolean;
}
/** Form for adding a store or page to watch. */
export interface AddTrackerFormProps {
  onSubmit?: (values: TrackerFormValues) => void;
  /** Shows a quiet Cancel button. */
  onCancel?: () => void;
  defaultValues?: Partial<TrackerFormValues>;
  /** Default "Track a new site". */
  title?: string;
  /** Default "Start tracking". */
  submitLabel?: string;
  className?: string;
}
export declare function AddTrackerForm(props: AddTrackerFormProps): React.ReactElement;

/** Sign-up and log-in in one card. */
export interface AuthCardProps {
  defaultMode?: 'register' | 'login';
  onSubmit?: (mode: 'register' | 'login', event: React.FormEvent<HTMLFormElement>) => void;
  forgotHref?: string;
  className?: string;
}
export declare function AuthCard(props: AuthCardProps): React.ReactElement;

/** One headline number. */
export interface StatTileProps {
  /** Pre-formatted, e.g. "12,480", "18%". */
  value: string;
  label: string;
  detail?: string;
  /** "deal" for offer-related numbers only. */
  tone?: 'default' | 'deal';
  className?: string;
}
export declare function StatTile(props: StatTileProps): React.ReactElement;

/** What an empty list shows. */
export interface EmptyStateProps {
  title: string;
  body?: string;
  /** Usually one Button. */
  action?: React.ReactNode;
  className?: string;
}
export declare function EmptyState(props: EmptyStateProps): React.ReactElement;

declare global {
  interface Window {
    DealTracker: {
      Button: typeof Button;
      DealBadge: typeof DealBadge;
      TrackerCard: typeof TrackerCard;
      NotificationRow: typeof NotificationRow;
      TextField: typeof TextField;
      Switch: typeof Switch;
      ChoiceChips: typeof ChoiceChips;
      AddTrackerForm: typeof AddTrackerForm;
      AuthCard: typeof AuthCard;
      StatTile: typeof StatTile;
      EmptyState: typeof EmptyState;
    };
  }
}
