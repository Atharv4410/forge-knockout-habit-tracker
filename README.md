# Atlas — Adaptive AI Habit Tracker

*Tell us what you want to become. We'll build and adapt the habits to get you there.*

A goal-first habit tracker: you pick an outcome, a recommendation engine designs a starting plan of
personalized habits, you track them day to day, and the app learns from your actual check-in history
to suggest adjustments — reduce a target you keep missing, shift a habit earlier in the day, and so on.
Nothing is invented: every insight and recommendation is computed from your real check-in data first,
then turned into plain language.

## Stack

- React 18 + Vite, React Router
- No backend — a single local persistence layer (`src/lib/db.js`) backed by `localStorage`.
  Swapping in a real backend later only means changing that one module.
- `src/ai/` is a self-contained recommendation/insight engine (deterministic + rule-based, not an
  external LLM call), so the app works fully offline and never needs an API key. See "How the AI
  layer works" below.

## Run locally

```bash
npm install
npm run dev
```

## Build for production

```bash
npm run build
```

Outputs a static site to `dist/`, deployable anywhere that serves static files (Vercel, Netlify, etc.)
with zero server-side configuration.

## Project structure

```
src/
  lib/          date utilities, the localStorage persistence layer, pure statistics
                (streaks, completion rates, patterns) computed from check-in history
  ai/           generateHabits, generateWeeklyInsights, suggestAdjustments, coachResponse,
                parseNaturalLogEntry — all pure functions over the stats lib's output
  context/      AppContext — the single source of app state + actions
  components/   layout shell, reusable UI primitives, habit + onboarding + insight widgets
  pages/        Landing, Onboarding, Dashboard, Habits, HabitDetail, Progress, Insights, Coach, Profile
public/sw.js    minimal service worker for local notification display
```

## How the AI layer works

There's no external AI API call in this build — `src/ai/` is a rule-based recommendation engine that
reads structured facts computed by `src/lib/stats.js` (completion rate, streaks, weekday/time-of-day
patterns) and turns them into the plan, the weekly review, and the adaptive suggestions. The AI layer
never calculates its own statistics — it only interprets numbers that were already computed from stored
check-ins, so nothing shown to you is invented. This keeps the app fully functional offline, with no API
key to configure, while keeping the architecture ready to swap in a real LLM call later (the function
signatures in `src/ai/index.js` are the seam to do that behind).

## Data & privacy

Everything — your profile, habits, check-ins, and settings — lives in `localStorage` on this device only.
Clearing site data or switching browsers loses it. There's no account system and no server.
