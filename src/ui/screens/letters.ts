import { app, type Screen } from '../../app';
import { LETTERS, LEVELS_PER_LETTER, SIGNATURE, type Letter } from '../../content/letters';
import { letterLevel } from '../../game/progress';
import { goHome } from '../../nav';
import { h, svg } from '../dom';
import { motionReduced, stagger } from '../fx';
import { tick } from '../haptics';
import { ICON } from '../icons';
import { sfx, unlockAudio } from '../sound';

/** A small paper envelope drawn in CSS. */
function envelope(state: 'sealed' | 'opened' | 'locked'): HTMLElement {
  return h('span', { class: `envelope ${state}`, 'aria-hidden': 'true' }, h('i', { class: 'flap' }), h('i', { class: 'seal' }));
}

export function lettersScreen(openId?: number): Screen {
  const p = app.progress;
  const list = h('ol', { class: 'letters-list' });

  const build = () => {
    list.replaceChildren(
      ...LETTERS.map((l) => {
        const unlocked = !!p.levels[letterLevel(l.id)];
        const opened = p.opened.includes(l.id);
        if (!unlocked) {
          return h(
            'li',
            { class: 'letter-item locked' },
            envelope('locked'),
            h('span', { class: 'letter-text' }, h('b', null, 'Sealed'), h('small', null, `Opens after level ${letterLevel(l.id)}`)),
            svg(ICON.lock, 'icon lock'),
          );
        }
        return h(
          'li',
          null,
          h(
            'button',
            {
              class: 'letter-item' + (opened ? '' : ' new'),
              type: 'button',
              onclick: () => {
                unlockAudio();
                read(l, !opened);
              },
            },
            envelope(opened ? 'opened' : 'sealed'),
            h('span', { class: 'letter-text' }, h('b', null, opened ? l.title : 'A letter for you'), h('small', null, opened ? `Letter ${l.id}` : 'Still sealed. Tap to open.')),
            svg(ICON.chevron, 'icon chev'),
          ),
        );
      }),
    );
  };

  const read = (l: Letter, ceremony: boolean) => {
    openReader(l, ceremony, () => {
      if (!p.opened.includes(l.id)) {
        p.opened.push(l.id);
        app.commit();
        build();
      }
    });
  };

  build();

  const unlockedCount = LETTERS.filter((l) => p.levels[letterLevel(l.id)]).length;
  const el = h(
    'div',
    { class: 'screen letters' },
    h(
      'header',
      { class: 'page-head' },
      h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Back', onclick: () => goHome() }, svg(ICON.back)),
      h('h1', null, 'Letters'),
    ),
    h(
      'p',
      { class: 'page-intro' },
      unlockedCount === 0
        ? `Lukas wrote these for you and sealed them. One opens every ${LEVELS_PER_LETTER} levels.`
        : `From Lukas. One opens every ${LEVELS_PER_LETTER} levels, and they stay here for whenever you want them.`,
    ),
    list,
  );
  stagger(Array.from(list.children), 30, 60);

  if (openId) {
    const l = LETTERS.find((x) => x.id === openId);
    if (l && p.levels[letterLevel(l.id)]) setTimeout(() => read(l, !p.opened.includes(l.id)), 260);
  }
  return { el };
}

/** Full-screen letter. The first time, the envelope opens before the page appears. */
function openReader(l: Letter, ceremony: boolean, onOpened: () => void): void {
  const paragraphs = l.body.split(/\n\s*\n/).map((t) => h('p', null, t.trim()));
  const sheet = h(
    'article',
    { class: 'paper' },
    h('p', { class: 'paper-no' }, `Letter ${l.id}`),
    h('h2', null, l.title),
    ...paragraphs,
    h('p', { class: 'signature' }, '— ', SIGNATURE, svg(ICON.heart, 'heart')),
  );
  const closeBtn = h('button', { class: 'icon-btn reader-close', type: 'button', 'aria-label': 'Close letter' }, svg(ICON.close));
  const scroller = h('div', { class: 'reader-scroll' }, sheet);
  const reader = h('div', { class: 'reader', role: 'dialog', 'aria-modal': 'true', 'aria-label': l.title }, closeBtn, scroller);

  const close = () => {
    reader.classList.remove('open');
    setTimeout(() => reader.remove(), motionReduced() ? 0 : 260);
  };
  closeBtn.addEventListener('click', close);
  document.body.append(reader);

  const reveal = () => {
    reader.classList.add('open', 'show-paper');
    onOpened();
  };

  if (!ceremony || motionReduced()) {
    requestAnimationFrame(() => requestAnimationFrame(reveal));
    if (ceremony) sfx.letter();
    return;
  }

  // The little ceremony: seal breaks, flap lifts, the page slides out.
  const stage = h(
    'div',
    { class: 'stage' },
    h('div', { class: 'big-envelope' }, h('i', { class: 'page' }), h('i', { class: 'back' }), h('i', { class: 'front' }), h('i', { class: 'flap' }), h('i', { class: 'seal' })),
    h('p', null, 'For Emily'),
  );
  reader.append(stage);
  requestAnimationFrame(() => requestAnimationFrame(() => reader.classList.add('open')));
  setTimeout(() => {
    stage.classList.add('break');
    tick('firm');
    sfx.paper();
  }, 520);
  setTimeout(() => stage.classList.add('lift'), 820);
  setTimeout(() => {
    stage.classList.add('out');
    sfx.letter();
  }, 1300);
  setTimeout(() => {
    stage.classList.add('gone');
    reveal();
  }, 2000);
  setTimeout(() => stage.remove(), 2500);
}
