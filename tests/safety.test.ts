/**
 * EMILY IS PLAYING THIS APP. These tests protect her saved progress.
 *
 * If one of them fails, do NOT "fix" the test. Change the code so her
 * existing save keeps working instead. See CLAUDE.md.
 */
import { describe, expect, it } from 'vitest';
import { LETTERS } from '../src/content/letters';
import { generate, levelDifficulty, levelSeed } from '../src/engine/generator';
import { currentLevel, normalize, streak, totalStars, unlockedLetters, unreadLetters, type Progress } from '../src/game/progress';
import { shareText } from '../src/game/share';
import { RESET_EPOCH, load, resetIfOutdated, save } from '../src/game/storage';
import pinnedLevels from './fixtures/level-puzzles.json';
import savedV1 from './fixtures/save-v1.json';

class MemoryStorage {
  map = new Map<string, string>();
  get length() {
    return this.map.size;
  }
  key(i: number) {
    return [...this.map.keys()][i] ?? null;
  }
  getItem(k: string) {
    return this.map.get(k) ?? null;
  }
  setItem(k: string, v: string) {
    this.map.set(k, v);
  }
  removeItem(k: string) {
    this.map.delete(k);
  }
  clear() {
    this.map.clear();
  }
}

describe('her progress must never be wiped', () => {
  it('RESET_EPOCH stays at 1 forever (raising it erases her phone)', () => {
    expect(RESET_EPOCH).toBe(1);
  });

  it('a phone that already reset keeps its progress on every later update', () => {
    const s = new MemoryStorage() as unknown as Storage;
    s.setItem('emily-sudoku:epoch', '1');
    s.setItem('emily-sudoku:progress', JSON.stringify(savedV1));
    s.setItem('emily-sudoku:save:level', '{"values":[1]}');
    for (let boot = 0; boot < 5; boot++) expect(resetIfOutdated(s)).toBe(false);
    expect(JSON.parse(s.getItem('emily-sudoku:progress')!)).toEqual(savedV1);
    expect(s.getItem('emily-sudoku:save:level')).not.toBeNull();
  });

  it('progress is still stored under the same key', () => {
    const s = new MemoryStorage();
    const g = globalThis as unknown as { localStorage?: unknown };
    const before = g.localStorage;
    g.localStorage = s;
    try {
      save('progress', { hello: 1 });
      expect(s.getItem('emily-sudoku:progress')).toBe('{"hello":1}');
      expect(load('progress', null)).toEqual({ hello: 1 });
    } finally {
      g.localStorage = before;
    }
  });

  it('a save made by the current version loads with nothing lost', () => {
    const p = normalize(structuredClone(savedV1) as Partial<Progress>);
    expect(p.levels).toEqual(savedV1.levels);
    expect(p.daily).toEqual(savedV1.daily);
    expect(p.opened).toEqual(savedV1.opened);
    expect(p.stats).toEqual(savedV1.stats);
    expect(p.settings).toEqual(savedV1.settings);
    expect(p.installHintSeen).toBe(true);
    expect(currentLevel(p)).toBe(7);
    expect(totalStars(p)).toBe(14);
  });
});

describe('her letters must stay in place', () => {
  // Letters are tracked by position. New letters may be ADDED AT THE END,
  // but these must never be removed, renamed or reordered.
  const LOCKED = [
    'Peace',
    'Walks',
    'Eyes',
    'Just special',
    'At first sight',
    'Time stops',
    'Warmth',
    'Six months: Peace, found',
    'Six months: Still',
    'Six months: Whole',
    'From the oasis',
  ];

  it('existing letters keep their position and number', () => {
    LOCKED.forEach((title, i) => {
      expect(LETTERS[i]?.title).toBe(title);
      expect(LETTERS[i]?.id).toBe(i + 1);
    });
  });

  it('a letter she opened stays opened and unlocked', () => {
    const p = normalize(structuredClone(savedV1) as Partial<Progress>);
    expect(unlockedLetters(p).map((l) => l.title)).toEqual(['Peace']);
    expect(unreadLetters(p)).toEqual([]);
  });
});

describe('her levels must stay the same puzzles', () => {
  it('level puzzles have not changed', () => {
    for (const [n, givens] of Object.entries(pinnedLevels as Record<string, string>)) {
      const level = Number(n);
      expect(generate(levelSeed(level), levelDifficulty(level)).givens.join(''), `level ${level}`).toBe(givens);
    }
  });
});

describe('sharing is read-only', () => {
  const deepFreeze = <T>(o: T): T => {
    if (o && typeof o === 'object') {
      Object.values(o).forEach(deepFreeze);
      Object.freeze(o);
    }
    return o;
  };

  it('never changes her progress', () => {
    const p = deepFreeze(normalize(structuredClone(savedV1) as Partial<Progress>));
    const before = JSON.stringify(p);
    const text = shareText(p, '2026-11-13');
    expect(JSON.stringify(p)).toBe(before);
    expect(text).toContain('level 6 done');
    expect(text).toContain('14 of 18 stars');
    expect(text).toContain(`1 of ${LETTERS.length} letters unlocked`);
    expect(text).toContain('2-day streak');
    expect(streak(p, '2026-11-13')).toBe(2);
  });

  it('reads nicely for a brand-new player', () => {
    const text = shareText(normalize(null));
    expect(text).toContain('Just started');
    expect(text).not.toContain('streak');
  });
});
