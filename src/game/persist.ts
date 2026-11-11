/**
 * HER PROGRESS NEVER GOES BACKWARDS.
 *
 * Every save goes through here. Three protections, so no update and no bug
 * can lose what she has earned:
 *
 * 1. Saving MERGES with what is already stored and only ever keeps the
 *    better result: a finished level stays finished, stars only go up,
 *    opened letters stay opened, best times only get faster.
 * 2. Before a new version of the app first runs, the current progress is
 *    copied into a backup (the last few versions are kept).
 * 3. If the saved progress is ever missing or damaged, it is restored from
 *    the newest backup, and damaged data is set aside, never overwritten.
 *
 * The only thing that erases progress is RESET_EPOCH in storage.ts, which
 * must only change when Lukas explicitly asks for it.
 */
import { normalize, type Progress, type Result } from './progress';
import { loadRaw, saveRaw } from './storage';

const KEY = 'progress';
const BACKUPS = 'backups';
const MAX_BACKUPS = 5;

export interface Backup {
  version: string;
  at: number;
  progress: Progress;
}

function parse(raw: string | null): Progress | null {
  if (raw === null) return null;
  try {
    const v = JSON.parse(raw);
    if (!v || typeof v !== 'object' || typeof v.levels !== 'object') return null;
    return normalize(v);
  } catch {
    return null;
  }
}

function readBackups(): Backup[] {
  try {
    const list = JSON.parse(loadRaw(BACKUPS) ?? '[]');
    return Array.isArray(list) ? list.filter((b) => b && b.progress && typeof b.progress.levels === 'object') : [];
  } catch {
    return [];
  }
}

function better(a: Result | undefined, b: Result | undefined): Result | undefined {
  if (!a) return b;
  if (!b) return a;
  return { stars: Math.max(a.stars, b.stars), timeMs: Math.min(a.timeMs, b.timeMs) };
}

function mergeResults(a: Record<string, Result>, b: Record<string, Result>): Record<string, Result> {
  const out: Record<string, Result> = {};
  for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) out[k] = better(a[k], b[k])!;
  return out;
}

/**
 * Combine two copies of her progress, keeping the best of both.
 * Nothing she has earned in either copy is ever dropped.
 * Settings come from `next` (changing a setting is always on purpose).
 */
export function mergeProgress(stored: Progress, next: Progress): Progress {
  const best: Progress['stats']['best'] = { ...stored.stats.best };
  for (const [d, t] of Object.entries(next.stats.best)) {
    const k = d as keyof typeof best;
    if (t !== undefined) best[k] = best[k] === undefined ? t : Math.min(best[k]!, t);
  }
  return {
    ...stored,
    ...next,
    v: 1,
    levels: mergeResults(stored.levels, next.levels),
    daily: mergeResults(stored.daily, next.daily),
    opened: [...new Set([...stored.opened, ...next.opened])].sort((a, b) => a - b),
    stats: {
      won: Math.max(stored.stats.won, next.stats.won),
      perfect: Math.max(stored.stats.perfect, next.stats.perfect),
      longestStreak: Math.max(stored.stats.longestStreak, next.stats.longestStreak),
      best,
    },
    settings: { ...stored.settings, ...next.settings },
    installHintSeen: stored.installHintSeen || next.installHintSeen,
  };
}

/** Load her progress, recovering from a backup if the save is missing or damaged. */
export function loadProgress(): { progress: Progress; recovered: boolean } {
  const raw = loadRaw(KEY);
  const parsed = parse(raw);
  if (parsed) return { progress: parsed, recovered: false };

  // Damaged? Keep the damaged text somewhere safe instead of overwriting it.
  if (raw !== null) saveRaw(`damaged:${Date.now()}`, raw);

  const latest = readBackups().sort((a, b) => b.at - a.at)[0];
  if (latest) {
    const restored = normalize(latest.progress);
    saveRaw(KEY, JSON.stringify(restored));
    return { progress: restored, recovered: true };
  }
  return { progress: normalize(null), recovered: false };
}

/** Save her progress. Never lowers anything already saved. Returns what was stored. */
export function saveProgress(next: Progress): Progress {
  const stored = parse(loadRaw(KEY));
  const merged = stored ? mergeProgress(stored, next) : normalize(next);
  saveRaw(KEY, JSON.stringify(merged));
  return merged;
}

/** Called once at start-up: if this is a new version of the app, back up first. */
export function backupBeforeNewVersion(version: string, now = Date.now()): boolean {
  const current = parse(loadRaw(KEY));
  if (!current) return false;
  const list = readBackups();
  if (list.some((b) => b.version === version)) return false;
  list.push({ version, at: now, progress: current });
  list.sort((a, b) => a.at - b.at);
  saveRaw(BACKUPS, JSON.stringify(list.slice(-MAX_BACKUPS)));
  return true;
}

export function listBackups(): Backup[] {
  return readBackups().sort((a, b) => b.at - a.at);
}
