# AuthCard

Sign-up and log-in in one card, switched by a pill tab at the top. It is the entry point on the public landing page, so it uses `shadow-lift` to sit above the `gradient-wash` hero.

- "Create account" is the default tab for visitors; open on "Log in" when the person arrived from a "Log in" link.
- Create account asks for name, email and password; Log in asks for email and password and shows "Forgot password?".
- The fine print under the button states the free limit plainly ("Free for up to 5 trackers. No card needed.").
- The consumer provides `onSubmit(mode, event)`, `defaultMode` and `forgotHref`; it reads the fields from the form.

## In the app (`frontend/src/components/ui/AuthCard.tsx`)

- `collectName` hides the Name field; the landing page turns it off because accounts don't store a name yet.
- "Forgot password?" shows only when `forgotHref` is given; there is no reset flow yet, so it is hidden.
- Extra props: controlled `mode` + `onModeChange`, `finePrint`, `submitting` and `error`.
