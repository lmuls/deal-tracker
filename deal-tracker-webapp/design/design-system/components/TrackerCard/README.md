# TrackerCard

One tracked website or store: who, what it watches for, its status, and when it last checked. Cards sit on `surface-raised` with `radius-lg`, `space-md` padding and `shadow-soft`, lifting to `shadow-lift` on hover.

- **watching**: blue initial tile and a `watching` badge. No orange anywhere.
- **deal**: orange initial tile, an `orange-100` panel with the offer title in `ink` and the detail in `orange-700`, and a primary "View offer" button. This is the only state that uses orange.
- **paused**: flat (no shadow, a `line` outline), faded logo, `paused` badge, "Resume" action.

Lay cards out in a grid with `space-md` gaps; minimum width 300px. The consumer provides the store name, display URL, optional logo URL, status, the deal text, the "watching for" phrase, a relative "Checked 4 min ago" string and the handlers. Write deal titles as the offer itself ("20% off all jackets") and details as the exact facts ("€149 → €119 · ends Sunday").
