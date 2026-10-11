# Switch

An on/off toggle for settings that apply immediately, such as alert channels. On is `blue-600`; off is `line-control`, so the track stays visible at 3:1.

- Pair it with a `label` and, when useful, a one-line `description` ("One message per new offer").
- Use a Switch for settings, not for choices that need a Save button; use ChoiceChips for picking one of several options.
- Works controlled (`checked` + `onChange(next)`) or uncontrolled (`defaultChecked`).
