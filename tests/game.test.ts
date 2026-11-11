import { describe, expect, it } from 'vitest';
import { LETTERS } from '../src/content/letters';
import { generate } from '../src/engine/generator';
import { bit } from '../src/engine/grid';
import {
  currentLevel,
  emptyProgress,
  exportCode,
  importCode,
  lineForLevel,
  recordWin,
  streak,
  unlockedLetters,
  unreadLetters,
} from '../src/game/progress';
import { starsFor } from '../src/game/rules';
import { autoNotes, erase, newGame, placeDigit, toggleNote, undo, type Game } from '../src/game/state';

const P = generate('game-test', 'gentle');
const fresh = (extra: Partial<Game> = {}) => newGame('level', 'gentle', P.givens, P.solution, { level: 1, ...extra });
const empties = (g: Game) => g.values.map((v, i) => (v ? -1 : i)).filter((i) => i >= 0);

describe('game state', () => {
  it('counts mistakes and lets them be fixed', () => {
    const g = fresh();
    const i = empties(g)[0];
    const wrong = (g.solution[i] % 9) + 1;
    expect(placeDigit(g, i, wrong).kind).toBe('wrong');
    expect(g.mistakes).toBe(1);
    expect(placeDigit(g, i, g.solution[i]).kind).toBe('correct');
    expect(g.mistakes).toBe(1);
  });

  it('ignores givens and keeps correct digits from being erased', () => {
    const g = fresh();
    const given = g.givens.findIndex((v) => v !== 0);
    expect(placeDigit(g, given, 5).kind).toBe('ignored');
    const i = empties(g)[0];
    placeDigit(g, i, g.solution[i]);
    expect(erase(g, i)).toBe(false);
  });

  it('clears matching notes in peers and restores them on undo', () => {
    const g = fresh();
    const [a] = empties(g);
    const d = g.solution[a];
    const peer = empties(g).find((j) => j !== a && Math.floor(j / 9) === Math.floor(a / 9))!;
    toggleNote(g, peer, d);
    expect(g.notes[peer]).toBe(bit(d));
    placeDigit(g, a, d);
    expect(g.notes[peer]).toBe(0);
    undo(g);
    expect(g.values[a]).toBe(0);
    expect(g.notes[peer]).toBe(bit(d));
  });

  it('auto notes never exclude the answer', () => {
    const g = fresh();
    autoNotes(g);
    for (const i of empties(g)) expect(g.notes[i] & bit(g.solution[i])).toBeTruthy();
  });

  it('reports finished units, finished digits and the win', () => {
    const g = fresh();
    const cells = empties(g);
    let sawUnit = false;
    let sawDigit = false;
    cells.forEach((i, n) => {
      const r = placeDigit(g, i, g.solution[i]);
      expect(r.kind).toBe('correct');
      if (r.kind === 'correct') {
        sawUnit ||= r.units.length > 0;
        sawDigit ||= r.digitDone;
        expect(r.solved).toBe(n === cells.length - 1);
      }
    });
    expect(sawUnit && sawDigit).toBe(true);
    expect(g.done).toBe(true);
  });

  it('gives stars for clean play', () => {
    expect(starsFor(0, 0)).toBe(3);
    expect(starsFor(1, 1)).toBe(2);
    expect(starsFor(3, 0)).toBe(1);
  });
});

describe('progress', () => {
  const win = (p = emptyProgress(), level: number, extra: Partial<Game> = {}) =>
    recordWin(p, { ...fresh({ level, ...extra }), elapsedMs: 60000, done: true });

  it('moves along the level path', () => {
    const p = emptyProgress();
    expect(currentLevel(p)).toBe(1);
    win(p, 1);
    win(p, 2);
    expect(currentLevel(p)).toBe(3);
  });

  it('unlocks one letter every 5 levels, once', () => {
    const p = emptyProgress();
    for (let n = 1; n <= 4; n++) expect(win(p, n).letter).toBeNull();
    expect(win(p, 5).letter?.id).toBe(1);
    expect(win(p, 5).letter).toBeNull(); // replaying doesn't unlock again
    for (let n = 6; n <= 9; n++) win(p, n);
    expect(win(p, 10).letter?.id).toBe(2);
    expect(unlockedLetters(p).map((l) => l.id)).toEqual([1, 2]);
    p.opened.push(1);
    expect(unreadLetters(p).map((l) => l.id)).toEqual([2]);
  });

  it('switches to short lines after the last letter', () => {
    const last = LETTERS.length * 5;
    expect(lineForLevel(last)).toBeNull();
    expect(lineForLevel(last + 5)).toBeTruthy();
    expect(lineForLevel(last + 6)).toBeNull();
  });

  it('keeps the best result when a level is replayed', () => {
    const p = emptyProgress();
    win(p, 1, { mistakes: 4 });
    expect(p.levels[1].stars).toBe(1);
    win(p, 1);
    expect(p.levels[1].stars).toBe(3);
    win(p, 1, { mistakes: 4 });
    expect(p.levels[1].stars).toBe(3);
  });

  it('counts the daily streak', () => {
    const p = emptyProgress();
    p.daily['2026-11-09'] = { stars: 3, timeMs: 1 };
    p.daily['2026-11-10'] = { stars: 3, timeMs: 1 };
    expect(streak(p, '2026-11-11')).toBe(2); // today not done yet, streak still alive
    p.daily['2026-11-11'] = { stars: 3, timeMs: 1 };
    expect(streak(p, '2026-11-11')).toBe(3);
    expect(streak(p, '2026-11-13')).toBe(0);
  });

  it('round-trips through an export code', () => {
    const p = emptyProgress();
    win(p, 1);
    p.opened.push(1);
    expect(importCode(exportCode(p))).toEqual(p);
    expect(importCode('nonsense')).toBeNull();
  });
});
