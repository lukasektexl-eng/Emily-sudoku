/**
 * Getting from one screen to another. Screens import these functions rather
 * than each other, which keeps the dependency graph simple.
 */
import { app } from './app';
import { getPuzzle } from './engine/client';
import { dailyDifficulty, dailySeed, levelDifficulty, levelSeed, type Difficulty } from './engine/generator';
import { dateKey } from './game/progress';
import { newGame, type Game } from './game/state';
import { h } from './ui/dom';
import { dailyScreen } from './ui/screens/daily';
import { gameScreen } from './ui/screens/game';
import { homeScreen } from './ui/screens/home';
import { lettersScreen } from './ui/screens/letters';
import { levelsScreen } from './ui/screens/levels';
import { settingsScreen } from './ui/screens/settings';
import { statsScreen } from './ui/screens/stats';

type Dir = 'forward' | 'back' | 'none';

export const goHome = (dir: Dir = 'back') => app.show(homeScreen(), dir);
export const goLevels = () => app.show(levelsScreen());
export const goLetters = (openId?: number) => app.show(lettersScreen(openId));
export const goStats = () => app.show(statsScreen());
export const goSettings = () => app.show(settingsScreen());
export const goDaily = () => app.show(dailyScreen());

/** Shown only if a puzzle takes a noticeable moment to prepare. */
function loadingScreen(label: string) {
  return { el: h('div', { class: 'screen loading' }, h('p', null, label)) };
}

async function start(make: () => Promise<Game>): Promise<void> {
  let shown = false;
  const slow = setTimeout(() => {
    shown = true;
    app.show(loadingScreen('Setting the board…'), 'none');
  }, 180);
  const game = await make();
  clearTimeout(slow);
  app.show(gameScreen(game), shown ? 'none' : 'forward');
}

export function playLevel(level: number): Promise<void> {
  return start(async () => {
    const saved = app.loadGame(app.progress.levels[level] ? 'replay' : 'level');
    if (saved && saved.level === level) return saved;
    const difficulty = levelDifficulty(level);
    const p = await getPuzzle(levelSeed(level), difficulty);
    return newGame('level', difficulty, p.givens, p.solution, { level });
  });
}

export function playDaily(date = dateKey()): Promise<void> {
  return start(async () => {
    const saved = app.loadGame('daily');
    if (saved && saved.date === date) return saved;
    const difficulty = dailyDifficulty(date);
    const p = await getPuzzle(dailySeed(date), difficulty);
    return newGame('daily', difficulty, p.givens, p.solution, { date });
  });
}

export function playFree(difficulty: Difficulty | null): Promise<void> {
  return start(async () => {
    const saved = app.loadGame('free');
    if (!difficulty && saved) return saved;
    const d = difficulty ?? 'easy';
    const p = await getPuzzle(`free:${Date.now()}:${Math.random()}`, d);
    return newGame('free', d, p.givens, p.solution);
  });
}

/** Same puzzle again from a clean board. */
export function replay(g: Game): void {
  const again = newGame(g.kind, g.difficulty, g.givens, g.solution, { level: g.level, date: g.date });
  app.show(gameScreen(again), 'none');
}
