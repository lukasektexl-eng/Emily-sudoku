import { ALL, CELL_UNITS, PEERS, UNITS, bit, popcount, singleDigit, type Grid } from './grid';

/**
 * Solves a puzzle the way a person would, one technique at a time, easiest
 * first. The hardest technique it needs decides how difficult the puzzle is.
 * The same machinery powers hint explanations.
 *
 * Tiers: 1 singles · 2 pointing/claiming + pairs · 3 triples · 4 X-Wing
 */

export type UnitKind = 'row' | 'col' | 'box';
export const unitKind = (u: number): UnitKind => (u < 9 ? 'row' : u < 18 ? 'col' : 'box');

export interface Placement {
  cell: number;
  digit: number;
  technique: 'naked-single' | 'hidden-single';
  unit?: UnitKind;
}

export interface Grade {
  solved: boolean;
  maxTier: number;
  score: number;
  steps: number;
}

const TIER_SCORE = [0, 1, 6, 14, 28];

export class LogicSolver {
  values: Grid;
  cands: number[];

  constructor(grid: Grid) {
    this.values = grid.slice();
    this.cands = new Array(81).fill(0);
    for (let i = 0; i < 81; i++) {
      if (this.values[i]) continue;
      let used = 0;
      for (const p of PEERS[i]) if (this.values[p]) used |= bit(this.values[p]);
      this.cands[i] = ALL & ~used;
    }
  }

  get filled(): boolean {
    return this.values.every((v) => v !== 0);
  }

  place(i: number, d: number): void {
    this.values[i] = d;
    this.cands[i] = 0;
    const b = ~bit(d);
    for (const p of PEERS[i]) this.cands[p] &= b;
  }

  /** Easiest single available right now, without placing it. */
  findSingle(): Placement | null {
    // Hidden single in a box is what people spot first.
    const order = [18, 19, 20, 21, 22, 23, 24, 25, 26];
    for (const u of order) {
      const p = this.hiddenSingleIn(u);
      if (p) return p;
    }
    for (let i = 0; i < 81; i++) {
      if (!this.values[i] && popcount(this.cands[i]) === 1) {
        return { cell: i, digit: singleDigit(this.cands[i]), technique: 'naked-single' };
      }
    }
    for (let u = 0; u < 18; u++) {
      const p = this.hiddenSingleIn(u);
      if (p) return p;
    }
    return null;
  }

  private hiddenSingleIn(u: number): Placement | null {
    for (let d = 1; d <= 9; d++) {
      const b = bit(d);
      let pos = -1;
      let count = 0;
      for (const i of UNITS[u]) {
        if (this.values[i] === d) {
          count = 99;
          break;
        }
        if (this.cands[i] & b) {
          pos = i;
          count++;
        }
      }
      if (count === 1) return { cell: pos, digit: d, technique: 'hidden-single', unit: unitKind(u) };
    }
    return null;
  }

  /** Apply one elimination technique of at most `maxTier`. Returns its tier, or 0. */
  eliminate(maxTier = 4): number {
    if (maxTier >= 2 && (this.pointing() || this.claiming() || this.nakedSubset(2) || this.hiddenSubset(2))) return 2;
    if (maxTier >= 3 && (this.nakedSubset(3) || this.hiddenSubset(3))) return 3;
    if (maxTier >= 4 && this.xWing()) return 4;
    return 0;
  }

  /** Box: digit confined to one row/col -> remove from rest of that line. */
  private pointing(): boolean {
    for (let b = 18; b < 27; b++) {
      for (let d = 1; d <= 9; d++) {
        const m = bit(d);
        const cells = UNITS[b].filter((i) => this.cands[i] & m);
        if (cells.length < 2) continue;
        for (const k of [0, 1]) {
          const line = CELL_UNITS[cells[0]][k];
          if (cells.every((i) => CELL_UNITS[i][k] === line)) {
            if (this.removeFrom(UNITS[line].filter((i) => CELL_UNITS[i][2] !== b), m)) return true;
          }
        }
      }
    }
    return false;
  }

  /** Line: digit confined to one box -> remove from rest of that box. */
  private claiming(): boolean {
    for (let u = 0; u < 18; u++) {
      for (let d = 1; d <= 9; d++) {
        const m = bit(d);
        const cells = UNITS[u].filter((i) => this.cands[i] & m);
        if (cells.length < 2) continue;
        const box = CELL_UNITS[cells[0]][2];
        if (cells.every((i) => CELL_UNITS[i][2] === box)) {
          if (this.removeFrom(UNITS[box].filter((i) => !UNITS[u].includes(i)), m)) return true;
        }
      }
    }
    return false;
  }

  private nakedSubset(n: number): boolean {
    for (let u = 0; u < 27; u++) {
      const open = UNITS[u].filter((i) => !this.values[i] && popcount(this.cands[i]) <= n);
      for (const combo of combinations(open, n)) {
        let union = 0;
        for (const i of combo) union |= this.cands[i];
        if (popcount(union) !== n) continue;
        const others = UNITS[u].filter((i) => !this.values[i] && !combo.includes(i));
        if (this.removeFrom(others, union)) return true;
      }
    }
    return false;
  }

  private hiddenSubset(n: number): boolean {
    for (let u = 0; u < 27; u++) {
      const digits: number[] = [];
      for (let d = 1; d <= 9; d++) {
        const c = UNITS[u].filter((i) => this.cands[i] & bit(d)).length;
        if (c >= 2 && c <= n) digits.push(d);
      }
      for (const combo of combinations(digits, n)) {
        let mask = 0;
        for (const d of combo) mask |= bit(d);
        const cells = UNITS[u].filter((i) => this.cands[i] & mask);
        if (cells.length !== n) continue;
        let changed = false;
        for (const i of cells) {
          if (this.cands[i] & ~mask) {
            this.cands[i] &= mask;
            changed = true;
          }
        }
        if (changed) return true;
      }
    }
    return false;
  }

  private xWing(): boolean {
    for (const [base, cover] of [
      [0, 9],
      [9, 0],
    ]) {
      for (let d = 1; d <= 9; d++) {
        const m = bit(d);
        const lines: { u: number; cross: number[] }[] = [];
        for (let k = 0; k < 9; k++) {
          const cells = UNITS[base + k].filter((i) => this.cands[i] & m);
          if (cells.length === 2) lines.push({ u: base + k, cross: cells.map((i) => CELL_UNITS[i][base === 0 ? 1 : 0] - cover) });
        }
        for (let a = 0; a < lines.length; a++) {
          for (let b = a + 1; b < lines.length; b++) {
            const A = lines[a];
            const B = lines[b];
            if (A.cross[0] !== B.cross[0] || A.cross[1] !== B.cross[1]) continue;
            let changed = false;
            for (const c of A.cross) {
              const targets = UNITS[cover + c].filter((i) => !UNITS[A.u].includes(i) && !UNITS[B.u].includes(i));
              if (this.removeFrom(targets, m)) changed = true;
            }
            if (changed) return true;
          }
        }
      }
    }
    return false;
  }

  private removeFrom(cells: number[], mask: number): boolean {
    let changed = false;
    for (const i of cells) {
      if (this.cands[i] & mask) {
        this.cands[i] &= ~mask;
        changed = true;
      }
    }
    return changed;
  }
}

function* combinations<T>(arr: T[], n: number, start = 0, acc: T[] = []): Generator<T[]> {
  if (acc.length === n) {
    yield acc.slice();
    return;
  }
  for (let i = start; i < arr.length; i++) {
    acc.push(arr[i]);
    yield* combinations(arr, n, i + 1, acc);
    acc.pop();
  }
}

/** How hard is this puzzle for a person? Stops early if it would exceed maxTier. */
export function grade(puzzle: Grid, maxTier = 4): Grade {
  const s = new LogicSolver(puzzle);
  let tierMax = 1;
  let score = 0;
  let steps = 0;
  for (let guard = 0; guard < 2000; guard++) {
    if (s.filled) return { solved: true, maxTier: tierMax, score, steps };
    const p = s.findSingle();
    if (p) {
      s.place(p.cell, p.digit);
      score += TIER_SCORE[1];
      steps++;
      continue;
    }
    const t = s.eliminate(maxTier);
    if (!t) break;
    tierMax = Math.max(tierMax, t);
    score += TIER_SCORE[t];
    steps++;
  }
  return { solved: false, maxTier: 99, score, steps };
}

export interface Hint {
  cell: number;
  digit: number;
  text: string;
}

const UNIT_WORD: Record<UnitKind, string> = { row: 'row', col: 'column', box: 'box' };

/**
 * The next sensible move from the current (correct) board, with a one-line
 * explanation. `solution` is the fallback when logic alone can't see it.
 */
export function nextHint(values: Grid, solution: Grid, preferCell = -1): Hint | null {
  const s = new LogicSolver(values);
  if (s.filled) return null;
  let advanced = false;
  for (let guard = 0; guard < 200; guard++) {
    const p = s.findSingle();
    if (p) {
      if (p.digit !== solution[p.cell]) break; // shouldn't happen on a correct board
      return { cell: p.cell, digit: p.digit, text: explain(p, advanced) };
    }
    if (!s.eliminate(4)) break;
    advanced = true;
  }
  const cell = preferCell >= 0 && !values[preferCell] ? preferCell : values.findIndex((v) => v === 0);
  return { cell, digit: solution[cell], text: `This one is a ${solution[cell]}. It's a tough spot, so here's a little push.` };
}

function explain(p: Placement, advanced: boolean): string {
  const lead = advanced ? 'Looking a bit deeper (a pair is hiding nearby), ' : '';
  if (p.technique === 'naked-single') {
    return `${lead}${advanced ? 'this' : 'This'} cell can only be a ${p.digit}. Every other number is already in its row, column or box.`;
  }
  return `${lead}${advanced ? 'a' : 'A'} ${p.digit} has only one place left in this ${UNIT_WORD[p.unit!]}.`;
}

