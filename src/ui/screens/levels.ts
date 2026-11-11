import { app, type Screen } from '../../app';
import { LETTERS } from '../../content/letters';
import { DIFFICULTY_LABEL, levelDifficulty } from '../../engine/generator';
import { currentLevel, letterLevel, totalStars } from '../../game/progress';
import { goHome, playLevel } from '../../nav';
import { h, svg } from '../dom';
import { ICON } from '../icons';
import { unlockAudio } from '../sound';

const STEP = 78; // vertical distance between levels
const TOP = 44;

/** Where level n sits on the winding path, x in percent of the width. */
const xOf = (n: number) => 50 + 29 * Math.sin(n * 0.82);
const yOf = (n: number) => TOP + (n - 1) * STEP;

function pathD(from: number, to: number): string {
  let d = `M ${xOf(from)} ${yOf(from)}`;
  for (let n = from + 1; n <= to; n++) {
    const y0 = yOf(n - 1);
    const y1 = yOf(n);
    const mid = (y0 + y1) / 2;
    d += ` C ${xOf(n - 1)} ${mid} ${xOf(n)} ${mid} ${xOf(n)} ${y1}`;
  }
  return d;
}

export function levelsScreen(): Screen {
  const p = app.progress;
  const current = currentLevel(p);
  const count = Math.max(30, Math.ceil((current + 12) / 5) * 5);
  const height = yOf(count) + TOP + 20;

  const NS = 'http://www.w3.org/2000/svg';
  const art = document.createElementNS(NS, 'svg');
  art.setAttribute('class', 'trail');
  art.setAttribute('viewBox', `0 0 100 ${height}`);
  art.setAttribute('preserveAspectRatio', 'none');
  const mk = (cls: string, d: string) => {
    const path = document.createElementNS(NS, 'path');
    path.setAttribute('class', cls);
    path.setAttribute('d', d);
    path.setAttribute('vector-effect', 'non-scaling-stroke');
    art.append(path);
  };
  mk('ahead', pathD(1, count));
  if (current > 1) mk('walked', pathD(1, current));

  const map = h('div', { class: 'map', style: { height: `${height}px` } });
  map.append(art);
  let here: HTMLElement | null = null;

  for (let n = 1; n <= count; n++) {
    const result = p.levels[n];
    const state = result ? 'done' : n === current ? 'here' : 'ahead';
    const node = h(
      'button',
      {
        class: `node ${state}`,
        type: 'button',
        disabled: state === 'ahead',
        style: { left: `${xOf(n)}%`, top: `${yOf(n)}px` },
        'aria-label': `Level ${n}${result ? `, ${result.stars} stars` : state === 'here' ? ', next' : ', locked'}`,
        onclick: () => {
          unlockAudio();
          void playLevel(n);
        },
      },
      h('b', null, String(n)),
      result
        ? h('span', { class: 'node-stars' }, ...[0, 1, 2].map((i) => svg(ICON.star, i < result.stars ? 'on' : '')))
        : null,
    );
    if (state === 'here') here = node;
    map.append(node);

    // A letter waits at every 5th level, for as long as there are letters.
    const letter = LETTERS.find((l) => letterLevel(l.id) === n);
    if (letter) {
      const side = xOf(n) > 50 ? 'left' : 'right';
      map.append(
        h(
          'span',
          {
            class: `waypoint ${side} ${result ? (p.opened.includes(letter.id) ? 'read' : 'unread') : 'sealed'}`,
            style: { left: `${xOf(n)}%`, top: `${yOf(n)}px` },
          },
          svg(ICON.envelope),
          h('small', null, result ? (p.opened.includes(letter.id) ? 'read' : 'a letter') : 'a letter'),
        ),
      );
    }
    // Mark where the difficulty changes.
    if (n > 1 && n % 10 !== 0 && (n - 1) % 10 !== 0 && levelDifficulty(n) !== levelDifficulty(n - 1)) {
      map.append(h('span', { class: 'stage-mark', style: { top: `${yOf(n) - STEP / 2}px` } }, DIFFICULTY_LABEL[levelDifficulty(n)]));
    } else if ((n - 1) % 10 === 0 && n > 1 && levelDifficulty(n) !== levelDifficulty(n - 2)) {
      map.append(h('span', { class: 'stage-mark', style: { top: `${yOf(n) - STEP / 2}px` } }, DIFFICULTY_LABEL[levelDifficulty(n)]));
    }
  }

  const el = h(
    'div',
    { class: 'screen levels' },
    h(
      'header',
      { class: 'page-head' },
      h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Back', onclick: () => goHome() }, svg(ICON.back)),
      h('h1', null, 'All levels'),
      h('p', { class: 'head-note' }, svg(ICON.star, 'on'), String(totalStars(p))),
    ),
    h('p', { class: 'page-intro' }, 'Tap any level you’ve finished to play it again for more stars.'),
    map,
  );

  requestAnimationFrame(() => here?.scrollIntoView({ block: 'center' }));
  return { el };
}
