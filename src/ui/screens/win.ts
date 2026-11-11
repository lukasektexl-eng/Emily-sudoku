import { DIFFICULTY_LABEL } from '../../engine/generator';
import { formatTime, type WinSummary } from '../../game/progress';
import type { Game } from '../../game/state';
import { goHome, goLetters, playFree, playLevel } from '../../nav';
import { h, svg } from '../dom';
import * as fx from '../fx';
import { ICON } from '../icons';
import { madeWithLove } from '../made';
import { openSheet } from '../sheet';
import { sfx } from '../sound';
import { gameTitle } from './game';

const HEADLINE: Record<number, string[]> = {
  3: ['Flawless.', 'Not a single slip.', 'Clean as anything.'],
  2: ['Nicely done.', 'That was smooth.', 'Lovely.'],
  1: ['Done. That one fought back.', 'Got there.', 'Solved, and that counts.'],
};

export function showWin(g: Game, s: WinSummary): void {
  const pick = HEADLINE[s.stars];
  const headline = pick[(g.level ?? Math.floor(g.elapsedMs)) % pick.length];

  const stars = [0, 1, 2].map((i) => svg(ICON.star, 'star' + (i < s.stars ? ' earned' : '')));
  const timeEl = h('b', null, '00:00');

  const facts = h(
    'dl',
    { class: 'facts' },
    h('div', null, h('dt', null, 'Time'), h('dd', null, timeEl, s.newBest ? h('em', null, 'best yet') : null)),
    h('div', null, h('dt', null, 'Mistakes'), h('dd', null, h('b', null, String(g.mistakes)))),
    h('div', null, h('dt', null, 'Hints'), h('dd', null, h('b', null, String(g.hints)))),
  );

  let extra: HTMLElement | null = null;
  if (s.letter) {
    const letter = s.letter;
    extra = h(
      'button',
      {
        class: 'letter-card',
        type: 'button',
        onclick: () => {
          void sheet.close();
          goLetters(letter.id);
        },
      },
      h('span', { class: 'mini-envelope' }, h('i', { class: 'seal' })),
      h('span', { class: 'letter-card-text' }, h('b', null, 'A letter for you'), h('small', null, 'Sealed until now. Tap to open it.')),
      svg(ICON.chevron),
    );
  } else if (s.line) {
    extra = h('blockquote', { class: 'line' }, s.line);
  } else if (g.kind === 'daily' && s.streak > 1) {
    extra = h('p', { class: 'streak-note' }, h('b', null, String(s.streak)), ' days in a row');
  }

  const close = (then: () => void) => () => {
    void sheet.close();
    then();
  };

  const actions = h('div', { class: 'actions' });
  if (g.kind === 'level' && g.level) {
    const next = g.level + 1;
    actions.append(
      h('button', { class: 'btn primary', type: 'button', onclick: close(() => void playLevel(next)) }, `Level ${next}`),
      h('button', { class: 'btn quiet', type: 'button', onclick: close(() => goHome()) }, 'Home'),
    );
  } else if (g.kind === 'free') {
    actions.append(
      h('button', { class: 'btn primary', type: 'button', onclick: close(() => void playFree(g.difficulty)) }, 'Another one'),
      h('button', { class: 'btn quiet', type: 'button', onclick: close(() => goHome()) }, 'Home'),
    );
  } else {
    actions.append(h('button', { class: 'btn primary', type: 'button', onclick: close(() => goHome()) }, 'Home'));
  }

  const body = h(
    'div',
    { class: 'sheet-body win' },
    h('p', { class: 'kicker' }, `${gameTitle(g)} · ${DIFFICULTY_LABEL[g.difficulty]}`),
    h('h2', null, headline),
    h('div', { class: 'stars', 'aria-label': `${s.stars} of 3 stars` }, ...stars),
    facts,
    extra,
    actions,
    madeWithLove(),
  );

  const sheet = openSheet(body, { dismissible: false });
  stars.forEach((el, i) => {
    if (i < s.stars) {
      fx.starIn(el, i);
      setTimeout(() => sfx.star(i), fx.motionReduced() ? 0 : 350 + i * 260);
    }
  });
  fx.countUp(timeEl, s.timeMs, formatTime, 800);
  if (extra) {
    fx.stagger([extra], 0, 900);
    if (s.letter) setTimeout(() => sfx.letter(), 1100);
  }
}
