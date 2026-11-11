import { ALL, PEERS, bit, popcount, singleDigit, type Grid } from './grid';
import { shuffle, type Rng } from './rng';

/**
 * Bitmask backtracking solver with "fewest candidates first" ordering.
 * countSolutions stops as soon as it reaches `limit` (use 2 to test uniqueness).
 */
function candidates(g: Grid, i: number): number {
  let used = 0;
  for (const p of PEERS[i]) if (g[p]) used |= bit(g[p]);
  return ALL & ~used;
}

function search(g: Grid, limit: number, rng: Rng | null, found: { n: number; first: Grid | null }): void {
  let best = -1;
  let bestMask = 0;
  let bestCount = 10;
  for (let i = 0; i < 81; i++) {
    if (g[i]) continue;
    const m = candidates(g, i);
    const c = popcount(m);
    if (c === 0) return;
    if (c < bestCount) {
      best = i;
      bestMask = m;
      bestCount = c;
      if (c === 1) break;
    }
  }
  if (best === -1) {
    found.n++;
    if (!found.first) found.first = g.slice();
    return;
  }
  const digits: number[] = [];
  for (let m = bestMask; m; m &= m - 1) digits.push(singleDigit(m & -m));
  if (rng) shuffle(digits, rng);
  for (const d of digits) {
    g[best] = d;
    search(g, limit, rng, found);
    if (found.n >= limit) {
      g[best] = 0;
      return;
    }
  }
  g[best] = 0;
}

export function countSolutions(grid: Grid, limit = 2): number {
  const found = { n: 0, first: null as Grid | null };
  search(grid.slice(), limit, null, found);
  return found.n;
}

export function solve(grid: Grid): Grid | null {
  const found = { n: 0, first: null as Grid | null };
  search(grid.slice(), 1, null, found);
  return found.first;
}

/** A random completely filled valid grid. */
export function randomSolution(rng: Rng): Grid {
  const found = { n: 0, first: null as Grid | null };
  search(new Array(81).fill(0), 1, rng, found);
  return found.first!;
}

/** True if the filled cells don't break any rule. */
export function isConsistent(g: Grid): boolean {
  for (let i = 0; i < 81; i++) {
    if (!g[i]) continue;
    for (const p of PEERS[i]) if (g[p] === g[i]) return false;
  }
  return true;
}

