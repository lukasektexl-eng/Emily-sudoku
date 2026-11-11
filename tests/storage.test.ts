import { describe, expect, it } from 'vitest';
import { LETTERS } from '../src/content/letters';
import { RESET_EPOCH, resetIfOutdated } from '../src/game/storage';

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

describe('fresh-start reset', () => {
  it('wipes old progress once, then leaves new progress alone', () => {
    const s = new MemoryStorage() as unknown as Storage;
    s.setItem('emily-sudoku:progress', '{"levels":{"1":{}}}');
    s.setItem('emily-sudoku:save:level', '{}');
    s.setItem('someone-else', 'keep');
    expect(resetIfOutdated(s)).toBe(true);
    expect(s.getItem('emily-sudoku:progress')).toBeNull();
    expect(s.getItem('emily-sudoku:save:level')).toBeNull();
    expect(s.getItem('someone-else')).toBe('keep');
    expect(s.getItem('emily-sudoku:epoch')).toBe(String(RESET_EPOCH));

    s.setItem('emily-sudoku:progress', '{"levels":{"1":{}}}');
    expect(resetIfOutdated(s)).toBe(false);
    expect(s.getItem('emily-sudoku:progress')).not.toBeNull();
  });

  it('is harmless on a brand-new phone', () => {
    const s = new MemoryStorage() as unknown as Storage;
    expect(resetIfOutdated(s)).toBe(false);
    expect(s.getItem('emily-sudoku:epoch')).toBe(String(RESET_EPOCH));
  });
});

describe('letters', () => {
  it('starts with Peace and no longer has the "if you ever read this" letter', () => {
    expect(LETTERS[0].title).toBe('Peace');
    expect(LETTERS[0].id).toBe(1);
    expect(LETTERS.some((l) => /ever read this/i.test(l.title + l.body))).toBe(false);
    expect(LETTERS).toHaveLength(11);
  });
});
