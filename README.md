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

## Putting it on an iPhone

1. Open the site in **Safari**.
2. Tap the **Share** button, then **Add to Home Screen**.
3. Open it from the new icon. It runs full screen and keeps working offline.

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
