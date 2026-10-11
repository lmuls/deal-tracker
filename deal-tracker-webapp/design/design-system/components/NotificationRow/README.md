# NotificationRow

One alert in the notification list or dropdown. The store name sits above in `ink-muted`; the message, written as the offer itself, sits below in `ink`.

- **Unread** rows are raised (`surface-raised`, `shadow-soft`), bold, with an `orange-500` dot and a `deal` badge. A hidden "(unread)" is added for screen readers.
- **Read** rows are flat on the page, regular weight, with a `soft` badge.
- Stack rows with `space-xs` gaps; group by day with a `label`-style overline ("TODAY", "EARLIER").
- Give `href` to render a link, or `onClick` for a button; hover tints `blue-100`.
- The consumer provides the store, the message ("20% off jackets, ends Sunday"), a relative time and an optional short badge ("-20%").
