# ChoiceChips

A single choice from two to six short options, shown as pills. Unselected chips have a `line-control` outline; the selected chip is `blue-100` with a 2px `blue-600` outline and `blue-600` text.

- Labels are one or two words: "Price drop", "Hourly".
- Use it for "Watch for" and "Check every" in the add-tracker form; use a select menu if there are more than six options.
- Controlled: the consumer provides `options` (`{ value, label }`), `value`, `onChange(value)` and an accessible `label`.
