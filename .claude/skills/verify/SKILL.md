---
name: verify
description: Build, launch, and drive Bench Almanac to verify changes at the UI surface.
---

# Verifying Bench Almanac

Client-only React 18 + Vite PWA; all state is in localStorage, seeded from
`src/data/seedSpecies.js` on first load. No test suite — verification is
driving the UI.

## Build & launch

```bash
npm install            # first run only
npm run build          # quick compile check (vite build)
npm run dev -- --port 5199 --strictPort   # dev server, background it
```

## Drive (headless browser)

Playwright is NOT a project dep. Install `playwright-core` in the session
scratchpad and use the pre-installed Chromium:

```js
import { chromium } from './node_modules/playwright-core/index.mjs';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', headless: true });
```

- Tools are hash routes: `#/almanac`, `#/wheel`, `#/collection`.
- A fresh profile auto-seeds 8 species, so the Almanac dashboard has rows
  immediately; "Winter dormancy & frost protection" (Japanese Maple) is a
  year-wrapping window (Nov 15 – Mar 1), useful as an edge case.
- Modals are `div.fixed.inset-0` with an `aria-label="Close dialog"` X button.
- Expect one benign `ERR_CONNECTION_RESET` console error in headless runs
  (external Google Fonts fetch); app functionality is unaffected.
