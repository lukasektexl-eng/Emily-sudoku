# Emily's Sudoku

A quiet, ad-free sudoku made for one person. It installs on an iPhone home screen like a normal app and works without internet.

## What's in it

- Endless numbered levels that slowly get harder (Gentle → Easy → Medium → Hard → Expert)
- Notes, undo, hints that explain the move, a three-mistake check, timer and pause
- A daily puzzle with a streak and a calendar
- Free play at any difficulty
- A sealed letter that opens every 5 levels
- Paper and Evening looks, soft sounds, short animations
- Everything is saved on the phone. No accounts, no tracking, no ads.

## Putting it on a phone

Link: https://lukasektexl-eng.github.io/Emily-sudoku/

**iPhone**
1. Open the link in **Safari** (not Chrome or Instagram's browser).
2. Tap **Share**, then **Add to Home Screen**, then **Add**.

**Android**
1. Open the link in **Chrome** (or Samsung Internet).
2. Tap **Add** on the card on the home screen, or use the browser menu (⋮) → **Install app** / **Add to Home screen**.

Either way the icon sits next to her other apps, opens full screen with no browser bars, and keeps working offline.

## Adding or editing letters

All the letters live in [`src/content/letters.ts`](src/content/letters.ts). Add a new entry at the end of `LETTERS` and it becomes the next one to unlock. Push to `main` and the site updates itself.

## Working on it

```bash
npm install
npm run dev      # local preview
npm test         # puzzle engine and game rule tests
npm run build    # production build into dist/
```

Pushing to `main` runs the tests and deploys to GitHub Pages (Settings → Pages → Source: GitHub Actions).

The fonts are Manrope and Fraunces, both under the SIL Open Font License (see `src/assets/fonts`).
