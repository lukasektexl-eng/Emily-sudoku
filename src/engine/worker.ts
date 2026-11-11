import { generate, type Difficulty } from './generator';

self.onmessage = (e: MessageEvent<{ id: number; seed: string; difficulty: Difficulty }>) => {
  const { id, seed, difficulty } = e.data;
  (self as unknown as Worker).postMessage({ id, puzzle: generate(seed, difficulty) });
};
