# Bench Almanac

Care windows for your bonsai, tuned to Norway's seasons. A season-ring calendar,
an "on the bench" list of upcoming jobs, and per-species task tracking with
completion check-offs — all stored locally in your browser, no account needed.

Ships with a European Beech (*Fagus sylvatica*) schedule as seed data; add your
own species and tasks from there.

**Live app:** https://dotknewt.github.io/bonsai/

## Run it

```bash
npm install
npm run dev        # dev server at http://localhost:5173
npm run build      # production build in dist/
npm run preview    # serve the production build locally
```

The build is a fully static site (`dist/`) — host it on GitHub Pages, Netlify,
or any static file server.

## Deploying

Every push to `main` triggers `.github/workflows/deploy.yml`, which builds the
app and publishes `dist/` to GitHub Pages at the URL above.

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

Each task is a care *window* — a span of weeks to months, not a single day.

| key           | value                                                                        |
| ------------- | ---------------------------------------------------------------------------- |
| `title`       | string — required. What to do, e.g. `"Repot"`                                |
| `startMonth`  | number 1–12 — required. Month the window opens. 1 = January                  |
| `startDay`    | number 1–31 — required. Day the window opens                                 |
| `endMonth`    | number 1–12 — optional. Month the window closes; may wrap the year (Nov → Feb) |
| `endDay`      | number 1–31 — optional. Day the window closes. If omitted, a typical span for the category is used (~3 weeks for repotting, ~1 month for pruning, ~2 months for wiring, ~3 months for feeding/pest watch) |
| `category`    | one of `repot`, `feed`, `prune`, `wire`, `propagate`, `seed`, `pest`, `other` (anything else becomes `other`) |
| `description` | string — optional. Longer notes shown under the task                         |

Legacy single-date tasks (`month` / `day`) are still accepted on import and are
migrated automatically: the date becomes the window's start, and the end
defaults to the category's typical span.

### Accepted paste shapes

**Bare task list** (type a common name first, then paste just the tasks):

```json
[
  { "title": "Repot", "startMonth": 4, "startDay": 15, "endMonth": 5, "endDay": 5, "category": "repot", "description": "Repot as buds swell." },
  { "title": "Feeding season", "startMonth": 5, "startDay": 10, "endMonth": 8, "endDay": 20, "category": "feed" }
]
```

**Single species:**

```json
{
  "name": "Japanese Maple",
  "botanicalName": "Acer palmatum",
  "tasks": [
    { "title": "Prune to shape", "startMonth": 6, "startDay": 1, "endMonth": 7, "endDay": 1, "category": "prune" }
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
