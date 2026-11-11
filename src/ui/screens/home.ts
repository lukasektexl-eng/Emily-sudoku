import { app, type Screen } from '../../app';
import { LETTERS } from '../../content/letters';
import { prefetch } from '../../engine/client';
import { DIFFICULTIES, DIFFICULTY_LABEL, dailyDifficulty, levelDifficulty, levelSeed, type Difficulty } from '../../engine/generator';
import { currentLevel, dateKey, formatTime, letterLevel, streak, totalStars, unlockedLetters, unreadLetters } from '../../game/progress';
import { goDaily, goLetters, goLevels, goSettings, goStats, playFree, playLevel } from '../../nav';
import { h, svg } from '../dom';
import { stagger } from '../fx';
import { ICON } from '../icons';
import { madeWithLove } from '../made';
import { openSheet } from '../sheet';
import { unlockAudio } from '../sound';

function greeting(): string {
  const hr = new Date().getHours();
  if (hr < 5) return 'Still up, Emily?';
  if (hr < 12) return 'Good morning, Emily.';
  if (hr < 18) return 'Good afternoon, Emily.';
  return 'Good evening, Emily.';
}

const DIFFICULTY_NOTE: Record<Difficulty, string> = {
  gentle: 'Plenty of numbers to start from',
  easy: 'Steady, nothing sneaky',
  medium: 'Needs a few notes',
  hard: 'Pairs and patience',
  expert: 'Bring tea',
};

function isIosSafariTab(): boolean {
  const ua = navigator.userAgent;
  const ios = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  const standalone = matchMedia('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone === true;
  return ios && !standalone;
}

export function homeScreen(): Screen {
  const p = app.progress;
  const level = currentLevel(p);
  const difficulty = levelDifficulty(level);
  const saved = app.loadGame('level');
  const inProgress = saved && saved.level === level ? saved : null;
  prefetch(levelSeed(level), difficulty);

  const today = dateKey();
  const dailyDone = !!p.daily[today];
  const run = streak(p, today);
  const unread = unreadLetters(p);
  const unlocked = unlockedLetters(p);
  const nextLetter = LETTERS.find((l) => !p.levels[letterLevel(l.id)]);

  const mark = h('span', { class: 'mark', 'aria-hidden': 'true' }, ...Array.from({ length: 9 }, () => h('i')));

  const head = h(
    'header',
    { class: 'home-head' },
    h('div', null, h('p', { class: 'kicker' }, new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })), h('h1', null, greeting())),
    mark,
  );

  const hero = h(
    'section',
    { class: 'hero' },
    h('p', { class: 'hero-label' }, inProgress ? 'You left off at' : level === 1 ? 'Start here' : 'Up next'),
    h('p', { class: 'hero-level' }, h('span', null, 'Level'), h('b', null, String(level))),
    h(
      'p',
      { class: 'hero-meta' },
      DIFFICULTY_LABEL[difficulty],
      h('span', { class: 'sep' }, ' · '),
      inProgress ? `${formatTime(inProgress.elapsedMs)} so far` : DIFFICULTY_NOTE[difficulty],
    ),
    h(
      'button',
      {
        class: 'btn primary big',
        type: 'button',
        onclick: () => {
          unlockAudio();
          void playLevel(level);
        },
      },
      inProgress ? 'Continue' : 'Play',
    ),
  );

  const row = (icon: string, title: string, sub: string, onclick: () => void, flag?: HTMLElement | null) =>
    h(
      'button',
      {
        class: 'row',
        type: 'button',
        onclick: () => {
          unlockAudio();
          onclick();
        },
      },
      svg(icon),
      h('span', { class: 'row-text' }, h('b', null, title), h('small', null, sub)),
      flag ?? null,
      svg(ICON.chevron, 'icon chev'),
    );

  const lettersSub = unread.length
    ? unread.length === 1
      ? 'One is waiting, still sealed'
      : `${unread.length} are waiting, still sealed`
    : nextLetter
      ? `The next one opens after level ${letterLevel(nextLetter.id)}`
      : `All ${unlocked.length} opened`;

  const dailySub = dailyDone
    ? `Done for today${run > 1 ? ` · ${run} days in a row` : ''}`
    : `${DIFFICULTY_LABEL[dailyDifficulty(today)]}${run > 0 ? ` · keep your ${run}-day run going` : ''}`;

  const list = h(
    'nav',
    { class: 'rows' },
    row(ICON.calendar, "Today's puzzle", dailySub, goDaily, dailyDone ? svg(ICON.check, 'icon done-tick') : null),
    row(ICON.envelope, 'Letters', lettersSub, () => goLetters(), unread.length ? h('span', { class: 'dot', 'aria-label': 'new' }) : null),
    row(ICON.path, 'All levels', `${level - 1} done · ${totalStars(p)} stars`, goLevels),
    row(ICON.dice, 'Free play', 'Any difficulty, no strings', freePlaySheet),
    row(ICON.chart, 'Your numbers', 'Best times and streaks', goStats),
    row(ICON.gear, 'Settings', 'Sound, look, backup', goSettings),
  );

  let install: HTMLElement | null = null;
  if (!p.installHintSeen && isIosSafariTab()) {
    install = h(
      'aside',
      { class: 'install' },
      svg(ICON.share),
      h('p', null, h('b', null, 'Keep me on your home screen.'), ' Tap the share button below, then “Add to Home Screen”.'),
      h(
        'button',
        {
          class: 'icon-btn',
          type: 'button',
          'aria-label': 'Dismiss',
          onclick: () => {
            p.installHintSeen = true;
            app.commit();
            install?.remove();
          },
        },
        svg(ICON.close),
      ),
    );
  }

  const el = h('div', { class: 'screen home' }, head, hero, install, list, madeWithLove());
  stagger([hero, ...(install ? [install] : []), ...Array.from(list.children)], 35, 40);
  return { el };
}

function freePlaySheet(): void {
  const saved = app.loadGame('free');
  const go = (d: Difficulty | null) => () => {
    void sheet.close();
    void playFree(d);
  };
  const sheet = openSheet(
    h(
      'div',
      { class: 'sheet-body' },
      h('h2', null, 'Free play'),
      h('p', null, 'A fresh puzzle each time. It doesn’t touch your levels.'),
      saved
        ? h(
            'button',
            { class: 'btn primary', type: 'button', onclick: go(null) },
            `Continue ${DIFFICULTY_LABEL[saved.difficulty].toLowerCase()} · ${formatTime(saved.elapsedMs)}`,
          )
        : null,
      h(
        'div',
        { class: 'choices' },
        ...DIFFICULTIES.map((d) =>
          h('button', { class: 'choice', type: 'button', onclick: go(d) }, h('b', null, DIFFICULTY_LABEL[d]), h('small', null, DIFFICULTY_NOTE[d])),
        ),
      ),
    ),
  );
}
