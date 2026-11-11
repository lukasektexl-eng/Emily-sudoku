import { grade, type Grade } from './grader';
import type { Grid } from './grid';
import { rngFrom, shuffle } from './rng';
import { countSolutions, randomSolution } from './solver';

export type Difficulty = 'gentle' | 'easy' | 'medium' | 'hard' | 'expert';

export const DIFFICULTIES: Difficulty[] = ['gentle', 'easy', 'medium', 'hard', 'expert'];

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  gentle: 'Gentle',
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
  expert: 'Expert',
};

interface Band {
  /** Never go below this many clues. */
  minClues: number;
  /** Keep removing clues only while a person could still solve it with these tiers. */
  maxTier: number;
  /** Accept the puzzle only if it actually needs at least this. */
  accept: (g: Grade, clues: number) => boolean;
}

const BANDS: Record<Difficulty, Band> = {
  gentle: { minClues: 38, maxTier: 1, accept: (_g, c) => c <= 42 },
  easy: { minClues: 31, maxTier: 1, accept: (_g, c) => c <= 34 },
  medium: { minClues: 27, maxTier: 2, accept: (g, c) => c <= 30 && (g.maxTier >= 2 || c <= 27) },
  hard: { minClues: 24, maxTier: 3, accept: (g, c) => c <= 27 && g.maxTier >= 2 && g.score >= 55 },
  expert: { minClues: 22, maxTier: 4, accept: (g, c) => c <= 27 && (g.maxTier >= 3 || g.score >= 80) },
};

export interface Puzzle {
  seed: string;
  difficulty: Difficulty;
  givens: Grid;
  solution: Grid;
  clues: number;
  grade: Grade;
}

function dig(solution: Grid, seed: string, band: Band): { puzzle: Grid; grade: Grade } {
  const rng = rngFrom(seed + ':dig');
  const puzzle = solution.slice();
  // Rotational symmetry looks hand-made: remove cells in mirrored pairs.
  const order = shuffle(Array.from({ length: 41 }, (_, i) => i), rng);
  let clues = 81;
  let last = grade(puzzle, band.maxTier);
  for (const i of order) {
    if (clues <= band.minClues) break;
    const j = 80 - i;
    const a = puzzle[i];
    const b = puzzle[j];
    const removed = i === j ? 1 : 2;
    if (clues - removed < band.minClues) continue;
    puzzle[i] = 0;
    puzzle[j] = 0;
    if (countSolutions(puzzle, 2) === 1) {
      const g = grade(puzzle, band.maxTier);
      if (g.solved && g.maxTier <= band.maxTier) {
        clues -= removed;
        last = g;
        continue;
      }
    }
    puzzle[i] = a;
    puzzle[j] = b;
  }
  return { puzzle, grade: last };
}

/** Deterministic: the same seed and difficulty always give the same puzzle. */
export function generate(seed: string, difficulty: Difficulty): Puzzle {
  const band = BANDS[difficulty];
  let fallback: Puzzle | null = null;
  for (let attempt = 0; attempt < 60; attempt++) {
    const sub = `${seed}#${attempt}`;
    const solution = randomSolution(rngFrom(sub));
    const { puzzle, grade: g } = dig(solution, sub, band);
    const clues = puzzle.filter(Boolean).length;
    const result: Puzzle = { seed: sub, difficulty, givens: puzzle, solution, clues, grade: g };
    if (band.accept(g, clues)) return result;
    if (!fallback || g.score > fallback.grade.score) fallback = result;
  }
  return fallback!;
}

/** Level path: which difficulty is level n? Every 10th level is a step harder. */
export function levelDifficulty(level: number): Difficulty {
  const base: Difficulty = level <= 10 ? 'gentle' : level <= 30 ? 'easy' : level <= 60 ? 'medium' : level <= 100 ? 'hard' : 'expert';
  if (level % 10 === 0) {
    const idx = DIFFICULTIES.indexOf(base);
    return DIFFICULTIES[Math.min(idx + 1, DIFFICULTIES.length - 1)];
  }
  return base;
}

export const levelSeed = (level: number) => `level:${level}`;
export const dailySeed = (date: string) => `daily:${date}`;

/** Daily puzzle difficulty cycles through the week: gentler Monday, harder weekend. */
export function dailyDifficulty(date: string): Difficulty {
  const day = new Date(date + 'T12:00:00').getDay(); // 0 Sun
  return (['hard', 'easy', 'easy', 'medium', 'medium', 'medium', 'hard'] as Difficulty[])[day];
}
