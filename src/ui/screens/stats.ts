import { app, type Screen } from '../../app';
import { DIFFICULTIES, DIFFICULTY_LABEL } from '../../engine/generator';
import { currentLevel, formatTime, streak, totalStars, unlockedLetters } from '../../game/progress';
import { goHome } from '../../nav';
import { h, svg } from '../dom';
import { stagger } from '../fx';
import { ICON } from '../icons';
import { madeWithLove } from '../made';

export function statsScreen(): Screen {
  const p = app.progress;
  const done = currentLevel(p) - 1;
  const fig = (value: string, label: string) => h('div', { class: 'fig' }, h('b', null, value), h('span', null, label));

  const figures = h(
    'section',
    { class: 'figs' },
    fig(String(done), done === 1 ? 'level done' : 'levels done'),
    fig(String(totalStars(p)), `of ${done * 3} stars`),
    fig(String(p.stats.won), 'puzzles solved'),
    fig(String(p.stats.perfect), 'without a slip'),
    fig(String(streak(p)), 'day run now'),
    fig(String(p.stats.longestStreak), 'longest run'),
  );

  const best = h(
    'section',
    { class: 'best' },
    h('h2', null, 'Best times'),
    h(
      'dl',
      null,
      ...DIFFICULTIES.map((d) => {
        const t = p.stats.best[d];
        return h('div', null, h('dt', null, DIFFICULTY_LABEL[d]), h('dd', { class: t === undefined ? 'none' : '' }, t === undefined ? 'not yet' : formatTime(t)));
      }),
    ),
  );

  const letters = unlockedLetters(p).length;
  const el = h(
    'div',
    { class: 'screen stats' },
    h(
      'header',
      { class: 'page-head' },
      h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Back', onclick: () => goHome() }, svg(ICON.back)),
      h('h1', null, 'Your numbers'),
    ),
    figures,
    best,
    h('p', { class: 'page-intro' }, letters ? `${letters} ${letters === 1 ? 'letter' : 'letters'} opened so far.` : 'No letters yet. The first one opens after level 5.'),
    madeWithLove(),
  );
  stagger(Array.from(figures.children), 40, 40);
  return { el };
}
