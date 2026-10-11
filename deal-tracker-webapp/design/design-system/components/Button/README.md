# Button

Three variants, one rule: **primary** (`gradient-primary`, white label) appears at most once per view, for the thing the view is for ("Track store", "View offer"). **Secondary** (`blue-100` fill, `blue-600` label) is for supporting actions beside it. **Quiet** (text only, `blue-600`) is for low-emphasis and inline actions such as "Pause" or "Edit".

- Labels are verbs in sentence case: "Track store", not "Submit" or "TRACK".
- `md` (44px) is the default; `sm` (34px) inside cards and dense rows.
- Never put a primary button on `gradient-horizon` or orange; it competes with the deal colour.
- Focus is a 2px `blue-600` ring offset 3px. Do not remove it.
- The consumer provides the label, the handler and an optional 20px outline icon.
