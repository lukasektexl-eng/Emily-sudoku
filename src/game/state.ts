import type { Difficulty } from '../engine/generator';
import { PEERS, bit, type Grid } from '../engine/grid';
import { completedUnits, isSolved, remaining } from './rules';

export type GameKind = 'level' | 'daily' | 'free';

export interface Game {
  kind: GameKind;
  level?: number;
  date?: string;
  difficulty: Difficulty;
  givens: Grid;
  solution: Grid;
  values: Grid;
  notes: number[]; // bitmask per cell
  mistakes: number;
  hints: number;
  elapsedMs: number;
  /** Player chose "keep going" after hitting the mistake limit. */
  limitWaived: boolean;
  history: Snapshot[][];
  done: boolean;
}

interface Snapshot {
  i: number;
  v: number;
  n: number;
}

export function newGame(kind: GameKind, difficulty: Difficulty, givens: Grid, solution: Grid, extra: Partial<Game> = {}): Game {
  return {
    kind,
    difficulty,
    givens: givens.slice(),
    solution: solution.slice(),
    values: givens.slice(),
    notes: new Array(81).fill(0),
    mistakes: 0,
    hints: 0,
    elapsedMs: 0,
    limitWaived: false,
    history: [],
    done: false,
    ...extra,
  };
}

export const isGiven = (g: Game, i: number) => g.givens[i] !== 0;
export const isWrong = (g: Game, i: number) => g.values[i] !== 0 && g.values[i] !== g.solution[i];

export type PlaceResult =
  | { kind: 'ignored' }
  | { kind: 'wrong' }
  | { kind: 'correct'; units: number[]; digitDone: boolean; solved: boolean };

function snapshot(g: Game, cells: number[]): Snapshot[] {
  return cells.map((i) => ({ i, v: g.values[i], n: g.notes[i] }));
}

/** Put a digit in a cell (not notes mode). */
export function placeDigit(g: Game, i: number, d: number): PlaceResult {
  if (g.done || isGiven(g, i)) return { kind: 'ignored' };
  if (g.values[i] === d && !isWrong(g, i)) return { kind: 'ignored' };
  const correct = g.solution[i] === d;
  const touched = correct ? [i, ...PEERS[i].filter((p) => g.notes[p] & bit(d))] : [i];
  g.history.push(snapshot(g, touched));
  g.values[i] = d;
  g.notes[i] = 0;
  if (!correct) {
    g.mistakes++;
    return { kind: 'wrong' };
  }
  for (const p of PEERS[i]) g.notes[p] &= ~bit(d);
  const solved = isSolved(g.values, g.solution);
  if (solved) g.done = true;
  return {
    kind: 'correct',
    units: completedUnits(g.values, g.solution, i),
    digitDone: remaining(g.values, g.solution)[d] === 0,
    solved,
  };
}

export function toggleNote(g: Game, i: number, d: number): boolean {
  if (g.done || isGiven(g, i) || (g.values[i] && !isWrong(g, i))) return false;
  g.history.push(snapshot(g, [i]));
  if (g.values[i]) g.values[i] = 0; // clear a wrong digit when writing notes
  g.notes[i] ^= bit(d);
  return true;
}

export function erase(g: Game, i: number): boolean {
  if (g.done || isGiven(g, i)) return false;
  if (!g.values[i] && !g.notes[i]) return false;
  if (g.values[i] && !isWrong(g, i)) return false; // correct digits stay, like the apps she knows
  g.history.push(snapshot(g, [i]));
  g.values[i] = 0;
  g.notes[i] = 0;
  return true;
}

/** Returns the cells that changed, or null if nothing to undo. */
export function undo(g: Game): number[] | null {
  if (g.done) return null;
  const snap = g.history.pop();
  if (!snap) return null;
  for (const s of snap) {
    g.values[s.i] = s.v;
    g.notes[s.i] = s.n;
  }
  return snap.map((s) => s.i);
}

/** Fill every empty cell's notes with its legal candidates. */
export function autoNotes(g: Game): void {
  const cells: number[] = [];
  for (let i = 0; i < 81; i++) if (!g.values[i]) cells.push(i);
  g.history.push(snapshot(g, cells));
  for (const i of cells) {
    let used = 0;
    for (const p of PEERS[i]) if (g.values[p] && !isWrong(g, p)) used |= bit(g.values[p]);
    g.notes[i] = 0x1ff & ~used;
  }
}

/** The board as the logic solver should see it: only correct digits. */
export function correctValues(g: Game): Grid {
  return g.values.map((v, i) => (v === g.solution[i] ? v : 0));
}
