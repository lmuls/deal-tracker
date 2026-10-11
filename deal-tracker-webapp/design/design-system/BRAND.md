# Deal Tracker

Deal Tracker watches the websites and stores people care about and tells them the moment a campaign or offer goes live. The interface should feel like the product: calm while it waits, unmistakable when something happens. Blue is the calm, the quiet watching. Orange is the moment, a deal found. Most screens are mostly white space and blue; orange appears only where there is news.

## Principles

- **Space first.** Layouts breathe. Prefer `space-lg` and `space-xl` between bands, `space-md` inside cards, and let lists run with `space-sm` gaps instead of dividers where possible.
- **Orange means news.** `orange-500`, `orange-100` and `gradient-deal` are reserved for live offers, price drops and unread alerts. A screen with no active deal should have no orange on it.
- **One gradient moment per screen.** `gradient-horizon` is the signature; use it once (hero, logo tile, onboarding) and keep everything else flat or softly washed.
- **Light, not thin.** Weight comes from space and soft elevation (`shadow-soft`), not from heavy borders or dark panels.

## Voice

Plain, specific, quick to scan. Lead with the store and the offer, then the detail.

- Notification: "Nordic Outdoor Store: 20% off jackets, ends Sunday." Not "Great news! A fantastic deal is waiting for you!"
- Empty state: "No offers yet. We check every 30 minutes." Not "Nothing to see here 😴"
- Buttons are verbs: "Track store", "Pause alerts", "View offer".
- Numbers are exact: "-20%", "€49 → €39", "Ends in 2 days". No exclamation marks.

## Color

| Role | Tokens | Rule |
| --- | --- | --- |
| Ground | `surface`, `surface-raised` | Page on `surface`; cards on `surface-raised`. |
| Text | `ink`, `ink-muted` | `ink` for anything a person must read; `ink-muted` for metadata. |
| Brand | `blue-600`, `blue-100` | Links, focus, selection, tracker chips. |
| Deal | `orange-500`, `orange-700`, `orange-100` | Only for live offers. Orange text is always `orange-700`. |
| Structure | `line`, `line-control` | `line` for decorative hairlines between rows; `line-control` for the borders of inputs, chips and switches, which must be visible. |

Text on `orange-500` and `gradient-deal` is always `ink`, never white. White text belongs only on `gradient-primary` and `blue-600`. Blue and orange differ in lightness as well as hue, so states stay distinguishable for colour-blind users; still pair every deal colour with a label or icon.

## Gradients

| Token | Where |
| --- | --- |
| `gradient-primary` | Primary buttons, active tab indicator. White label. |
| `gradient-deal` | Deal badges, "offer found" highlight. Ink label. |
| `gradient-horizon` | Hero blocks, logo tile, onboarding art. Once per screen; no text over its pale middle. |
| `gradient-wash` | Soft background behind a marketing hero or empty state. |

Angles are fixed in the tokens (135° for components, 120° for the horizon). Do not invent new stops; if a gradient is needed somewhere new, add it here first.

## Typography

One family, **Plus Jakarta Sans** (Google Fonts, weights 400, 600, 700), falling back to the system UI font. Headlines are tight (negative tracking on `display` and `heading-1`); body text is loose (`body` at 16/26). `label` is the only uppercase style and is used for badges and overlines.

## Spacing and shape

Spacing runs `space-xs` 8 · `space-sm` 16 · `space-md` 24 · `space-lg` 40 · `space-xl` 72. When unsure, take the larger step. Two in-between steps exist for tight spots only: `space-2xs` 4 (a heading and the line under it) and `space-xs-sm` 12 (dense rows and compact controls).

Corners are soft: `radius-sm` for controls, `radius-lg` for cards and panels, `radius-xl` for large decorative shapes, `radius-pill` for badges, chips and toggles. A deal badge is always a pill.

Elevation: cards rest on `shadow-soft`; hover, menus and modals use `shadow-lift`, whose faint blue cast ties depth to the brand.

## Components

React components, available as `window.DealTracker` once React 18 and `components/bundle.js` are loaded (styles in `components/bundle.css`, after `tokens.css`):

- **Button**: primary (once per view), secondary and quiet; `md` and `sm`.
- **DealBadge**: the pill that says whether there's news: `deal`, `soft`, `watching`, `paused`.
- **TrackerCard**: one tracked store in its `watching`, `deal` or `paused` state.
- **NotificationRow**: one alert, unread or read.
- **TextField**, **Switch**, **ChoiceChips**: form controls.
- **AddTrackerForm**: add a store or page to watch.
- **AuthCard**: create account and log in, in one card.
- **StatTile**: one headline number.
- **EmptyState**: what an empty list shows.

Each component's own guidelines say what the consumer provides.

## Pages

**LandingPage** is the public front page, built only from the components above. Everything in the product sits behind sign-in, so the first screen pairs the pitch with the `AuthCard`, and a row of four `StatTile`s closes the hero. Below the fold, a framed dashboard shows real `TrackerCard`s and `NotificationRow`s on a `gradient-horizon` glow, the page's one gradient moment. "How it works" puts three numbered steps beside a live `AddTrackerForm`, and an `ink` band repeats the sign-up action.

The statistics on the page are placeholders. In production, feed them live counts and show only numbers you can back with data. Offer-related figures take `tone="deal"`.

## Iconography

No icon set is defined yet. Until one is, use a single outline set with rounded caps and joins at 1.5px stroke, 20px in UI and 24px in navigation, coloured `ink` or `ink-muted` (and `blue-600` when active). Store logos sit in a `radius-sm` tile on `surface-raised`.

## Logo

No logo exists yet. Write the name in Plus Jakarta Sans 700 in `ink`; a `gradient-horizon` tile with `radius-sm` corners may stand beside it as a placeholder mark. The tile counts as the screen's one `gradient-horizon`, so leave it off on screens that use the gradient elsewhere (the landing page's demo glow).
