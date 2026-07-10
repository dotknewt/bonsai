# Bench Almanac

Care windows for your bonsai, tuned to Norway's seasons. A season-ring calendar,
an "on the bench" list of upcoming jobs, and per-species task tracking with
completion check-offs — all stored locally in your browser, no account needed.

Ships with a European Beech (*Fagus sylvatica*) schedule as seed data; add your
own species and tasks from there.

## Run it

```bash
npm install
npm run dev        # dev server at http://localhost:5173
npm run build      # production build in dist/
npm run preview    # serve the production build locally
```

The build is a fully static site (`dist/`) — host it on GitHub Pages, Netlify,
or any static file server.

## On your phone (Android / iOS)

The app is a PWA. Open the hosted URL in your phone's browser and choose
**Add to Home Screen** (Safari share menu on iOS; Chrome menu on Android).
It installs like an app, runs fullscreen, works offline, and keeps your data
on the device. If you later want real Play Store / App Store builds, the same
codebase can be wrapped with [Capacitor](https://capacitorjs.com/) unchanged.

## Data & import format

Everything lives in `localStorage` (`bonsai-species`, `bonsai-completions`).
Species can be shared: **Export** produces JSON that anyone can paste into
**Add species → Paste to import**. The in-app **Format guide** (inside the
Add species dialog) documents this too.

### Species object

| key             | value                                                          |
| --------------- | -------------------------------------------------------------- |
| `name`          | string — required. Common name, e.g. `"Japanese Maple"`        |
| `botanicalName` | string — optional. E.g. `"Acer palmatum"`                      |
| `tasks`         | array of task objects — may be empty                           |

### Task object

| key           | value                                                                        |
| ------------- | ---------------------------------------------------------------------------- |
| `title`       | string — required. What to do, e.g. `"Repot"`                                |
| `month`       | number 1–12 — required. 1 = January                                          |
| `day`         | number 1–31 — required. Day of the month                                     |
| `category`    | one of `repot`, `feed`, `prune`, `wire`, `propagate`, `seed`, `pest`, `other` (anything else becomes `other`) |
| `description` | string — optional. Longer notes shown under the task                         |

### Accepted paste shapes

**Bare task list** (type a common name first, then paste just the tasks):

```json
[
  { "title": "Repot", "month": 4, "day": 15, "category": "repot", "description": "Repot as buds swell." },
  { "title": "Start feeding", "month": 5, "day": 10, "category": "feed" }
]
```

**Single species:**

```json
{
  "name": "Japanese Maple",
  "botanicalName": "Acer palmatum",
  "tasks": [
    { "title": "Prune to shape", "month": 6, "day": 1, "category": "prune" }
  ]
}
```

**Whole collection** (an array of species — what "Export all" produces):

```json
[
  { "name": "Japanese Maple", "botanicalName": "Acer palmatum", "tasks": [] },
  { "name": "Scots Pine", "botanicalName": "Pinus sylvestris", "tasks": [] }
]
```

## Stack

Vite + React, Tailwind CSS v4, lucide-react icons, vite-plugin-pwa.
