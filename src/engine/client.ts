import { generate, type Difficulty, type Puzzle } from './generator';

/**
 * Puzzles are generated off the main thread so animations never hitch.
 * Results are cached, and the next level is prepared ahead of time.
 */
const cache = new Map<string, Promise<Puzzle>>();
let worker: Worker | null = null;
let nextId = 1;
const waiting = new Map<number, (p: Puzzle) => void>();

function getWorker(): Worker | null {
  if (worker) return worker;
  try {
    worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (e: MessageEvent<{ id: number; puzzle: Puzzle }>) => {
      waiting.get(e.data.id)?.(e.data.puzzle);
      waiting.delete(e.data.id);
    };
    worker.onerror = () => {
      // Fall back to generating on the main thread for anything still pending.
      worker = null;
      failed = true;
      for (const [id, resolve] of waiting) {
        const job = jobs.get(id);
        if (job) resolve(generate(job.seed, job.difficulty));
      }
      waiting.clear();
    };
    return worker;
  } catch {
    failed = true;
    return null;
  }
}

let failed = false;
const jobs = new Map<number, { seed: string; difficulty: Difficulty }>();

export function getPuzzle(seed: string, difficulty: Difficulty): Promise<Puzzle> {
  const key = `${seed}|${difficulty}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const promise = new Promise<Puzzle>((resolve) => {
    const w = failed ? null : getWorker();
    if (!w) {
      resolve(generate(seed, difficulty));
      return;
    }
    const id = nextId++;
    jobs.set(id, { seed, difficulty });
    waiting.set(id, (p) => {
      jobs.delete(id);
      resolve(p);
    });
    w.postMessage({ id, seed, difficulty });
  });
  cache.set(key, promise);
  return promise;
}

export function prefetch(seed: string, difficulty: Difficulty): void {
  void getPuzzle(seed, difficulty);
}
