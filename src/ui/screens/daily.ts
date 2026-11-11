import { app, type Screen } from '../../app';
import { DIFFICULTY_LABEL, dailyDifficulty } from '../../engine/generator';
import { dateKey, formatTime, streak } from '../../game/progress';
import { goHome, playDaily } from '../../nav';
import { h, svg } from '../dom';
import { ICON } from '../icons';
import { unlockAudio } from '../sound';

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export function dailyScreen(): Screen {
  const p = app.progress;
  const today = dateKey();
  const now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth();

  const run = streak(p, today);
  const todayResult = p.daily[today];
  const saved = app.loadGame('daily');
  const resumable = saved && saved.date === today;

  const grid = h('div', { class: 'cal-grid' });
  const monthLabel = h('h2', null);
  const prevBtn = h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Previous month', onclick: () => shift(-1) }, svg(ICON.back));
  const nextBtn = h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Next month', onclick: () => shift(1) }, svg(ICON.chevron));

  function shift(by: number): void {
    month += by;
    if (month < 0) {
      month = 11;
      year--;
    } else if (month > 11) {
      month = 0;
      year++;
    }
    draw();
  }

  function draw(): void {
    monthLabel.textContent = new Date(year, month, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    nextBtn.disabled = year === now.getFullYear() && month === now.getMonth();
    const first = new Date(year, month, 1);
    const offset = (first.getDay() + 6) % 7; // Monday first
    const days = new Date(year, month + 1, 0).getDate();
    const cells: HTMLElement[] = WEEKDAYS.map((d) => h('span', { class: 'cal-wd' }, d));
    for (let i = 0; i < offset; i++) cells.push(h('span'));
    for (let d = 1; d <= days; d++) {
      const key = dateKey(new Date(year, month, d));
      const result = p.daily[key];
      const future = key > today;
      cells.push(
        h(
          'button',
          {
            class: 'cal-day' + (result ? ' done' : '') + (key === today ? ' today' : ''),
            type: 'button',
            disabled: future,
            'aria-label': `${d}${result ? ', done' : ''}`,
            onclick: () => {
              unlockAudio();
              void playDaily(key);
            },
          },
          String(d),
        ),
      );
    }
    grid.replaceChildren(...cells);
  }
  draw();

  const el = h(
    'div',
    { class: 'screen daily' },
    h(
      'header',
      { class: 'page-head' },
      h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Back', onclick: () => goHome() }, svg(ICON.back)),
      h('h1', null, "Today's puzzle"),
    ),
    h(
      'section',
      { class: 'daily-hero' },
      h('p', { class: 'streak-big' }, h('b', null, String(run)), h('span', null, run === 1 ? 'day in a row' : 'days in a row')),
      h(
        'p',
        { class: 'hero-meta' },
        todayResult
          ? `Today is done in ${formatTime(todayResult.timeMs)}. See you tomorrow.`
          : `${DIFFICULTY_LABEL[dailyDifficulty(today)]} today${p.stats.longestStreak > run ? ` · longest run ${p.stats.longestStreak}` : ''}`,
      ),
      h(
        'button',
        {
          class: 'btn primary big',
          type: 'button',
          onclick: () => {
            unlockAudio();
            void playDaily(today);
          },
        },
        todayResult ? 'Play it again' : resumable ? 'Continue' : 'Play today’s',
      ),
    ),
    h('section', { class: 'cal' }, h('div', { class: 'cal-head' }, prevBtn, monthLabel, nextBtn), grid, h('p', { class: 'cal-note' }, 'Missed a day? Tap it to catch up.')),
  );
  return { el };
}
