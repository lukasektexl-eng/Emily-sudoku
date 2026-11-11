/**
 * Her progress never goes backwards. If one of these fails, fix the code,
 * never the test. See CLAUDE.md.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { backupBeforeNewVersion, listBackups, loadProgress, mergeProgress, saveProgress } from '../src/game/persist';
import { emptyProgress, normalize, type Progress } from '../src/game/progress';
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

let store: MemoryStorage;
const her = () => normalize(structuredClone(savedV1) as Partial<Progress>);
const stored = () => JSON.parse(store.getItem('emily-sudoku:progress')!);

beforeEach(() => {
  store = new MemoryStorage();
  (globalThis as unknown as { localStorage: unknown }).localStorage = store;
});

describe('saving never lowers her progress', () => {
  it('saving an empty or older progress cannot erase anything', () => {
    saveProgress(her());
    const result = saveProgress(emptyProgress()); // e.g. a buggy update starting from nothing
    expect(result.levels).toEqual(savedV1.levels);
    expect(stored().levels).toEqual(savedV1.levels);
    expect(stored().opened).toEqual([1]);
    expect(stored().stats.won).toBe(8);
  });

  it('a level that loses a star in a bug keeps its best', () => {
    saveProgress(her());
    const worse = her();
    worse.levels['1'] = { stars: 1, timeMs: 999999 };
    delete worse.levels['6'];
    worse.opened = [];
    const r = saveProgress(worse);
    expect(r.levels['1']).toEqual({ stars: 3, timeMs: 245000 });
    expect(r.levels['6']).toEqual(savedV1.levels['6']);
    expect(r.opened).toEqual([1]);
  });

  it('new progress is still added normally', () => {
    saveProgress(her());
    const next = her();
    next.levels['7'] = { stars: 3, timeMs: 100000 };
    next.levels['2'] = { stars: 3, timeMs: 200000 };
    next.opened.push(2);
    next.stats.won = 9;
    const r = saveProgress(next);
    expect(r.levels['7']).toEqual({ stars: 3, timeMs: 100000 });
    expect(r.levels['2']).toEqual({ stars: 3, timeMs: 200000 });
    expect(r.opened).toEqual([1, 2]);
    expect(r.stats.won).toBe(9);
  });

  it('settings changes are respected (those are always on purpose)', () => {
    saveProgress(her());
    const next = her();
    next.settings.sound = true;
    next.settings.theme = 'light';
    expect(saveProgress(next).settings).toMatchObject({ sound: true, theme: 'light' });
  });

  it('merging is symmetric for everything she has earned', () => {
    const a = her();
    const b = emptyProgress();
    b.levels['9'] = { stars: 2, timeMs: 1 };
    const m1 = mergeProgress(a, b);
    const m2 = mergeProgress(b, a);
    expect(m1.levels).toEqual(m2.levels);
    expect(m1.opened).toEqual(m2.opened);
    expect(m1.stats).toEqual(m2.stats);
  });
});

describe('backups before each new version', () => {
  it('backs up once per version and keeps the last five', () => {
    saveProgress(her());
    expect(backupBeforeNewVersion('v1', 1)).toBe(true);
    expect(backupBeforeNewVersion('v1', 2)).toBe(false);
    for (let i = 2; i <= 8; i++) backupBeforeNewVersion(`v${i}`, i * 10);
    const list = listBackups();
    expect(list).toHaveLength(5);
    expect(list[0].version).toBe('v8');
    expect(list[0].progress.levels).toEqual(savedV1.levels);
  });

  it('does nothing on a brand-new phone', () => {
    expect(backupBeforeNewVersion('v1')).toBe(false);
    expect(listBackups()).toEqual([]);
  });
});

describe('damaged or missing progress is recovered', () => {
  it('restores from the newest backup and sets the damaged copy aside', () => {
    saveProgress(her());
    backupBeforeNewVersion('v1', 5);
    store.setItem('emily-sudoku:progress', '{"levels": {"1": {"sta'); // half-written
    const { progress, recovered } = loadProgress();
    expect(recovered).toBe(true);
    expect(progress.levels).toEqual(savedV1.levels);
    expect(stored().levels).toEqual(savedV1.levels);
    const damaged = [...store.map.keys()].find((k) => k.startsWith('emily-sudoku:damaged:'));
    expect(damaged && store.getItem(damaged)).toBe('{"levels": {"1": {"sta');
  });

  it('restores if the progress disappeared but a backup exists', () => {
    saveProgress(her());
    backupBeforeNewVersion('v1', 5);
    store.removeItem('emily-sudoku:progress');
    expect(loadProgress().progress.levels).toEqual(savedV1.levels);
  });

  it('a normal load changes nothing', () => {
    saveProgress(her());
    const before = store.getItem('emily-sudoku:progress');
    expect(loadProgress().recovered).toBe(false);
    expect(store.getItem('emily-sudoku:progress')).toBe(before);
  });
});
