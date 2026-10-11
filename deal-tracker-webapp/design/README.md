# Deal Tracker: design starter kit

Everything Claude Code needs to build Deal Tracker in the agreed design.

- `CLAUDE.md`: rules Claude Code reads automatically when this folder is the project root (or copy it into your project root).
- `landing-page.html`: the approved landing page. Open it in a browser to see it (needs internet for React and the font).
- `design-system/`: brand guide, tokens (JSON and CSS), component styles, reference components and per-component guidelines.

## Getting started

1. Unzip this into an empty folder (or the root of your existing project).
2. Open a terminal there and run `claude`.
3. Give it a first task, for example:

   > Read CLAUDE.md and design-system/BRAND.md. Set up a Next.js + TypeScript app, port the design-system components to React components, and build the public landing page to match landing-page.html. Put the stats behind a placeholder API route for now.

Build in steps: landing page and components first, then sign-up/log-in, then the dashboard, then the tracking and alerting backend.
