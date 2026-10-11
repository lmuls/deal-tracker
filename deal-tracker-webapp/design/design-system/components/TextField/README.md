# TextField

A labelled single-line input with an optional hint or error underneath. The box is `surface-raised` with a `line-control` border; focus turns it `blue-600` with a `blue-100` halo.

- Always give a visible `label`. Placeholders show an example ("you@example.com"), never the label itself.
- `prefix` shows fixed text inside the box, e.g. `https://` for the website field.
- `hint` explains the format; `error` replaces it with an `orange-700` message and border. Errors say how to fix it: "Use at least 3 characters."
- The consumer provides the label, value handling and validation; all other props go to the `<input>`.
