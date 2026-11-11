# Emily's Sudoku: rules for changing this app

**Emily is playing this app.** Her progress (levels, stars, streaks, opened letters, the game in progress) lives only in her phone's browser storage. There is no backup anywhere else. Losing it cannot be undone.

Every push to `main` deploys automatically, and her phone picks up the new version the next time she opens it online. Treat every change as running on her phone.

## Never

- **Never change `RESET_EPOCH`** in `src/game/storage.ts`. Raising it erases everything on her phone.
- **Never remove, rename or reorder letters** in `src/content/letters.ts`. Opened letters are tracked by position. New letters go **at the end** only.
- **Never change puzzle generation** (`src/engine/generator.ts`, `grader.ts`, `solver.ts`, `rng.ts`, `levelDifficulty`, `levelSeed`) in a way that changes existing level puzzles.
- **Never rename storage keys** (`emily-sudoku:progress`, `emily-sudoku:save:*`, `emily-sudoku:epoch`) or the `PREFIX`.
- **Never remove or rename fields** in `Progress`, `Game` or `Settings`. Adding new optional fields is fine: `normalize()` fills defaults for older saves.
- **Never call `localStorage.clear()`**, and never write code that removes `emily-sudoku:*` keys.
- **Never edit or delete `tests/safety.test.ts` or `tests/fixtures/*`** to make a failing test pass. If a safety test fails, the change is wrong, not the test.

## Always

- New progress fields: add them to `emptyProgress()` and make `normalize()` handle saves that don't have them.
- Features that only display progress (like sharing) must only read `app.progress`, never write it.
- Run `npm test` before pushing. The deploy workflow also runs it and refuses to publish if it fails.
- Test on a phone-sized browser with an existing save before shipping anything that touches progress.

## Safe to change freely

Styles, animations, sounds, wording, new screens, new letters at the end, new settings with sensible defaults.
