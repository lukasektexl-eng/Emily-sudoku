import { LETTERS, LEVELS_PER_LETTER, LINES, type Letter } from '../content/letters';
import type { Difficulty } from '../engine/generator';
import { starsFor } from './rules';
import type { Game } from './state';

export type Theme = 'auto' | 'light' | 'dark';

export interface Settings {
  mistakeLimit: boolean;
  sound: boolean;
  haptics: boolean;
  reduceMotion: boolean;
  theme: Theme;
  highlightSame: boolean;
  showTimer: boolean;
}

export interface Result {
  stars: number;
  timeMs: number;
}

export interface Progress {
  v: 1;
  levels: Record<string, Result>;
  daily: Record<string, Result>;
  /** Letter ids she has opened. */
  opened: number[];
  stats: {
    won: number;
    perfect: number;
    best: Partial<Record<Difficulty, number>>;
    longestStreak: number;
  };
  settings: Settings;
  installHintSeen: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  mistakeLimit: true,
  sound: true,
  haptics: true,
  reduceMotion: false,
  theme: 'auto',
  highlightSame: true,
  showTimer: true,
};

export function emptyProgress(): Progress {
  return {
    v: 1,
    levels: {},
    daily: {},
    opened: [],
    stats: { won: 0, perfect: 0, best: {}, longestStreak: 0 },
    settings: { ...DEFAULT_SETTINGS },
    installHintSeen: false,
  };
}

/** Fill in anything missing so older saves keep working after updates. */
export function normalize(p: Partial<Progress> | null | undefined): Progress {
  const base = emptyProgress();
  if (!p || typeof p !== 'object') return base;
  return {
    ...base,
    ...p,
    v: 1,
    levels: { ...(p.levels ?? {}) },
    daily: { ...(p.daily ?? {}) },
    opened: Array.isArray(p.opened) ? p.opened.slice() : [],
    stats: { ...base.stats, ...(p.stats ?? {}), best: { ...(p.stats?.best ?? {}) } },
    settings: { ...base.settings, ...(p.settings ?? {}) },
  };
}

export function highestDone(p: Progress): number {
  let max = 0;
  for (const k of Object.keys(p.levels)) max = Math.max(max, +k);
  return max;
}

/** The level she is up to: first one not finished yet. */
export function currentLevel(p: Progress): number {
  let n = 1;
  while (p.levels[n]) n++;
  return n;
}

export function totalStars(p: Progress): number {
  return Object.values(p.levels).reduce((a, r) => a + r.stars, 0);
}

/** Level whose completion unlocks letter `id`. */
export const letterLevel = (id: number) => id * LEVELS_PER_LETTER;

export function unlockedLetters(p: Progress): Letter[] {
  return LETTERS.filter((l) => p.levels[letterLevel(l.id)]);
}

export function unreadLetters(p: Progress): Letter[] {
  return unlockedLetters(p).filter((l) => !p.opened.includes(l.id));
}

/** After the letters run out, every 5th level gets a short line instead. */
export function lineForLevel(level: number): string | null {
  if (level % LEVELS_PER_LETTER !== 0) return null;
  const idx = level / LEVELS_PER_LETTER - LETTERS.length - 1;
  if (idx < 0) return null;
  return LINES[idx % LINES.length];
}

export const dateKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export function addDays(key: string, n: number): string {
  const d = new Date(key + 'T12:00:00');
  d.setDate(d.getDate() + n);
  return dateKey(d);
}

/** Consecutive daily puzzles done, counting back from today (or yesterday if today isn't done yet). */
export function streak(p: Progress, today = dateKey()): number {
  let day = p.daily[today] ? today : addDays(today, -1);
  let n = 0;
  while (p.daily[day]) {
    n++;
    day = addDays(day, -1);
  }
  return n;
}

export interface WinSummary {
  stars: 1 | 2 | 3;
  timeMs: number;
  newBest: boolean;
  /** A letter that this win just unlocked. */
  letter: Letter | null;
  line: string | null;
  streak: number;
  firstClear: boolean;
}

/** Record a finished game. Mutates and returns what the win screen should show. */
export function recordWin(p: Progress, g: Game, today = dateKey()): WinSummary {
  const stars = starsFor(g.mistakes, g.hints);
  const result: Result = { stars, timeMs: g.elapsedMs };
  let letter: Letter | null = null;
  let line: string | null = null;
  let firstClear = true;

  if (g.kind === 'level' && g.level) {
    const prev = p.levels[g.level];
    firstClear = !prev;
    p.levels[g.level] = prev
      ? { stars: Math.max(prev.stars, stars), timeMs: Math.min(prev.timeMs, g.elapsedMs) }
      : result;
    if (firstClear) {
      letter = LETTERS.find((l) => letterLevel(l.id) === g.level) ?? null;
      if (!letter) line = lineForLevel(g.level);
    }
  } else if (g.kind === 'daily' && g.date) {
    const prev = p.daily[g.date];
    firstClear = !prev;
    p.daily[g.date] = prev
      ? { stars: Math.max(prev.stars, stars), timeMs: Math.min(prev.timeMs, g.elapsedMs) }
      : result;
  }

  const best = p.stats.best[g.difficulty];
  const newBest = best === undefined || g.elapsedMs < best;
  if (newBest) p.stats.best[g.difficulty] = g.elapsedMs;
  p.stats.won++;
  if (g.mistakes === 0 && g.hints === 0) p.stats.perfect++;
  const s = streak(p, today);
  p.stats.longestStreak = Math.max(p.stats.longestStreak, s);

  return { stars, timeMs: g.elapsedMs, newBest: newBest && best !== undefined, letter, line, streak: s, firstClear };
}

/** Progress as a copy-pasteable code, for moving to a new phone. */
export function exportCode(p: Progress): string {
  const json = JSON.stringify(p);
  const bytes = new TextEncoder().encode(json);
  let bin = '';
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return 'ES1.' + btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function importCode(code: string): Progress | null {
  try {
    const body = code.trim().replace(/^ES1\./, '').replace(/-/g, '+').replace(/_/g, '/');
    const bin = atob(body);
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    const parsed = JSON.parse(new TextDecoder().decode(bytes));
    if (!parsed || typeof parsed !== 'object' || typeof parsed.levels !== 'object') return null;
    return normalize(parsed);
  } catch {
    return null;
  }
}

export function formatTime(ms: number): string {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  if (m >= 60) return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
