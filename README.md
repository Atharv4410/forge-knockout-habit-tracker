# Habit Tracker

A single-page React app: type a habit, it's added to a "Today" list, tap to mark it done for today. No server, no login — everything lives in `localStorage` in your browser.

## Run locally

```bash
npm install
npm run dev
```

## Build for production

```bash
npm run build
```

Outputs a static site to `dist/`, deployable to Vercel with zero configuration.

## Notes

- Data is stored per-browser via `localStorage` under the key `habit-tracker:habits`. Clearing site data or switching browsers/devices loses your habits.
- No accounts — anyone using the same browser profile shares the same habit list.
