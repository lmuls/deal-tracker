# Deal Tracker: design system rules

Deal Tracker lets people track websites and online stores and get alerted when a campaign or offer goes live. All UI in this project follows the design system in `design-system/`. Read `design-system/BRAND.md` before building any screen.

## What's in `design-system/`

| Path | What it is | How to use it |
| --- | --- | --- |
| `BRAND.md` | Brand guide: principles, voice, colour, gradients, type, spacing, iconography | The rules. Follow them. |
| `tokens.json` | Source of truth for every design value, with a usage note per token | Read the `usage` notes when choosing a token. |
| `tokens.css` | The same tokens as CSS custom properties plus type classes (`.display`, `.heading-1`, `.body`, `.label`…) | Import once, globally. |
| `components/bundle.css` | Styles for every component (`dt-` class prefix) | Import globally after `tokens.css`, or split into per-component CSS modules. |
| `components/bundle.js` | **Reference implementation** of all components (plain `React.createElement`, attaches to `window.DealTracker`) | Port each component to a proper module in the app's framework. Do not ship this file as-is. |
| `components/index.d.ts` | Props for every component | Use these as the TypeScript prop types when porting. |
| `components/<Name>/README.md` | When to use each component, its states and what the consumer provides | Read before using or changing that component. |
| `../landing-page.html` | Approved landing page design, runnable in a browser | The visual reference for the public page. Match it. |

## Hard rules

- **Tokens only.** No raw hex, rgb, px spacing or shadow values in app code. Use `var(--token)`. If a value is missing, add it to `tokens.json` *and* `tokens.css` with a usage note, then use it.
- **Orange means news.** `orange-500`, `orange-700`, `orange-100` and `gradient-deal` appear only for live offers, price drops, unread alerts and offer statistics. A screen with no active deal has no orange.
- **Text on orange is `ink`**, never white. White text only on `gradient-primary` and `blue-600`.
- **One primary button per view.** Everything else is `secondary` or `quiet`.
- **`gradient-horizon` at most once per screen.**
- **Space first.** Prefer the larger spacing step when unsure. Cards use `space-md` padding, sections use `space-xl` between them.
- **Contrast.** Text ≥ 4.5:1, control borders and focus rings ≥ 3:1. Input, chip and switch borders use `line-control`, not `line`. Never remove focus rings.
- **Voice.** Plain, specific, exact numbers, verbs on buttons, no exclamation marks, no emoji. See BRAND.md › Voice.
- **Real statistics only.** The landing-page numbers (sites tracked, offers found, check interval, average discount) are placeholders. Implement them from real data (e.g. a cached stats endpoint) and never hard-code or inflate them.

## Components to port

Button, DealBadge, TrackerCard, NotificationRow, TextField, Switch, ChoiceChips, AddTrackerForm, AuthCard, StatTile, EmptyState.

When porting:
1. Keep the prop names from `index.d.ts` and the `dt-` class names from `bundle.css`, so the styles and the reference stay in sync.
2. Keep the accessibility details in the reference: `role="switch"` + `aria-checked` on Switch, `role="radiogroup"`/`role="radio"` on ChoiceChips, `aria-invalid` + `aria-describedby` on TextField errors, the visually hidden "(unread)" on NotificationRow, `role="tablist"` on AuthCard.
3. Render each ported component next to the reference (`landing-page.html`, or the design system's previews) and check they look the same.

## Pages and access

- **Public:** the landing page only (`landing-page.html`): nav, hero with the sign-up/log-in card, stats row, a dashboard demo below the fold, "How it works" with the add-tracker form, closing call to action, footer. The demo frame below the fold uses real components with sample data; it is not a screenshot image.
- **Behind sign-in:** everything else. At least: the trackers dashboard (TrackerCard grid, "Track a new site" primary button opening AddTrackerForm, EmptyState when there are no trackers), alerts (NotificationRow list grouped "Today" / "Earlier") and settings (Switch for alert channels).
- "Log in" links open AuthCard in `login` mode; "Create account" opens it in `register` mode.

## Stack

If the project has no stack yet, ask the user before scaffolding. A sensible default is Next.js (App Router) with TypeScript and plain CSS: import `tokens.css` and `bundle.css` in the root layout and port the components to `.tsx` files. Load Plus Jakarta Sans (400, 600, 700) via the framework's font loader instead of the `@import` in `bundle.css`.
