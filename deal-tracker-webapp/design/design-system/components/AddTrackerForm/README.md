# AddTrackerForm

The form for adding a store or page to watch: website URL, what counts as a deal, how often to check and how to be alerted. It sits on a `surface-raised` card with `radius-lg`, `space-lg` padding and `shadow-soft`.

- Fields, in order: Website or page (with `https://` prefix) · Watch for (Any campaign, Price drop, Keyword, Free shipping) · Keyword field, shown only when Keyword is picked · Check every (15 min, 30 min, Hourly, Daily) · Email and Push switches.
- One primary action, "Start tracking"; "Cancel" is quiet and shown only when `onCancel` is given.
- Use it in a modal or side panel from "Track a new site", or inline on an empty dashboard.
- The consumer provides `onSubmit(values)` with `{ url, watch, keyword, frequency, email, push }`, and optionally `defaultValues`, `title`, `submitLabel` and `onCancel`.

## In the app (`frontend/src/components/ui/AddTrackerForm.tsx`)

The app's version follows what the backend supports, so its values are `{ url, name, frequency }`:

- No "Watch for" choice: the detector finds any campaign or offer.
- No Email/Push switches: alert channels are account-wide and live in Settings.
- A required "Name" field, shown on the tracker and in alerts.
- "Check every" offers 30 min, Hourly, 6 hours, 12 hours and Daily (default), the intervals the API accepts.
- Extra props `submitting` and `error` for the save request.
