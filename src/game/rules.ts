import { CELL_UNITS, UNITS, type Grid } from '../engine/grid';

/** Units (row/col/box indices 0..26) that became fully and correctly filled by placing at `cell`. */
export function completedUnits(values: Grid, solution: Grid, cell: number): number[] {
  return CELL_UNITS[cell].filter((u) => UNITS[u].every((i) => values[i] !== 0 && values[i] === solution[i]));
}

export function isSolved(values: Grid, solution: Grid): boolean {
  return values.every((v, i) => v === solution[i]);
}

/** How many of each digit are still missing (index 1..9). Wrong entries don't count as placed. */
export function remaining(values: Grid, solution: Grid): number[] {
  const left = new Array(10).fill(9);
  left[0] = 0;
  values.forEach((v, i) => {
    if (v && v === solution[i]) left[v]--;
  });
  return left;
}

/** Stars from mistakes and hints. */
export function starsFor(mistakes: number, hints: number): 1 | 2 | 3 {
  const slips = mistakes + hints;
  if (slips === 0) return 3;
  if (slips <= 2) return 2;
  return 1;
}
