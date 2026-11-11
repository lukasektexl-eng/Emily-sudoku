/** Shared grid geometry. A grid is 81 numbers, row-major, 0 = empty. */

export type Grid = number[];

export const rowOf = (i: number) => Math.floor(i / 9);
export const colOf = (i: number) => i % 9;
export const boxOf = (i: number) => Math.floor(rowOf(i) / 3) * 3 + Math.floor(colOf(i) / 3);

/** UNITS[0..8] rows, [9..17] cols, [18..26] boxes. */
export const UNITS: number[][] = (() => {
  const units: number[][] = [];
  for (let r = 0; r < 9; r++) units.push(Array.from({ length: 9 }, (_, c) => r * 9 + c));
  for (let c = 0; c < 9; c++) units.push(Array.from({ length: 9 }, (_, r) => r * 9 + c));
  for (let b = 0; b < 9; b++) {
    const r0 = Math.floor(b / 3) * 3;
    const c0 = (b % 3) * 3;
    const u: number[] = [];
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) u.push((r0 + r) * 9 + c0 + c);
    units.push(u);
  }
  return units;
})();

/** For each cell: the indices of its row, col and box units. */
export const CELL_UNITS: [number, number, number][] = Array.from({ length: 81 }, (_, i) => [
  rowOf(i),
  9 + colOf(i),
  18 + boxOf(i),
]);

/** For each cell: the 20 distinct peers. */
export const PEERS: number[][] = Array.from({ length: 81 }, (_, i) => {
  const s = new Set<number>();
  for (const u of CELL_UNITS[i]) for (const j of UNITS[u]) if (j !== i) s.add(j);
  return [...s];
});

export const ALL = 0x1ff; // bits 0..8 => digits 1..9
export const bit = (d: number) => 1 << (d - 1);
export const popcount = (m: number) => {
  let c = 0;
  while (m) {
    m &= m - 1;
    c++;
  }
  return c;
};
export const digitsOf = (m: number): number[] => {
  const out: number[] = [];
  for (let d = 1; d <= 9; d++) if (m & bit(d)) out.push(d);
  return out;
};
export const singleDigit = (m: number) => 32 - Math.clz32(m); // valid when popcount(m) === 1

export const toString = (g: Grid) => g.join('');
export const fromString = (s: string): Grid => s.split('').map((ch) => (ch >= '1' && ch <= '9' ? +ch : 0));
