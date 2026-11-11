import { LETTERS } from '../content/letters';
import { currentLevel, dateKey, streak, totalStars, unlockedLetters, type Progress } from './progress';

/**
 * The little progress message she can send. This only READS progress:
 * it never changes or saves anything, so sharing can't affect her game.
 */
export function shareText(p: Readonly<Progress>, today = dateKey()): string {
  const done = currentLevel(p as Progress) - 1;
  const stars = totalStars(p as Progress);
  const letters = unlockedLetters(p as Progress).length;
  const run = streak(p as Progress, today);

  const lines: string[] = [];
  if (done === 0) {
    lines.push('Just started Emily’s Sudoku.');
  } else {
    lines.push(`Emily’s Sudoku: level ${done} done.`);
    lines.push(`${stars} of ${done * 3} stars`);
  }
  lines.push(`${letters} of ${LETTERS.length} letters unlocked`);
  if (run > 0) lines.push(`${run}-day streak`);
  if (p.stats.perfect > 0) lines.push(`${p.stats.perfect} solved without a slip`);
  return lines.join('\n');
}
