# DealBadge

A pill label that says whether there is news. Always uses the `label` style (12px, 600, uppercase) on `radius-pill`.

| Tone | Look | Use |
| --- | --- | --- |
| `deal` | `gradient-deal`, `ink` text | A live offer: "-20%", "Offer live", "Free shipping". The loudest thing on the screen. |
| `soft` | `orange-100`, `orange-700` text | An offer that is already seen or secondary, e.g. in a read notification. |
| `watching` | `blue-100`, `blue-600` text | A tracker that is running with nothing found yet. |
| `paused` | `surface`, `ink-muted` text, `line` outline | A tracker the person has paused. |

- Keep text to one to three words or a number. "-20%" beats "20 percent off".
- `dot` adds a leading status dot; use it on status badges, not on discount amounts.
- Only one `deal` badge per card.
