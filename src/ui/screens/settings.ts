import { app, type Screen } from '../../app';
import { exportCode, importCode, type Settings, type Theme } from '../../game/progress';
import { goHome } from '../../nav';
import { h, svg } from '../dom';
import { tick } from '../haptics';
import { ICON } from '../icons';
import { installState, manualSteps, promptInstall } from '../install';
import { madeWithLove } from '../made';
import { openSheet, toast } from '../sheet';
import { sfx, unlockAudio } from '../sound';

type Flag = { [K in keyof Settings]: Settings[K] extends boolean ? K : never }[keyof Settings];

export function settingsScreen(): Screen {
  const s = app.progress.settings;

  const toggle = (key: Flag, title: string, sub: string) => {
    const input = h('input', { type: 'checkbox', class: 'switch', role: 'switch' });
    input.checked = s[key];
    input.addEventListener('change', () => {
      s[key] = input.checked;
      app.commit();
      app.applySettings();
      unlockAudio();
      sfx.tap();
      tick();
    });
    return h('label', { class: 'setting' }, h('span', { class: 'row-text' }, h('b', null, title), h('small', null, sub)), input);
  };

  const themes: [Theme, string][] = [
    ['auto', 'Auto'],
    ['light', 'Paper'],
    ['dark', 'Evening'],
  ];
  const seg = h('div', { class: 'seg', role: 'radiogroup', 'aria-label': 'Look' });
  const drawSeg = () =>
    seg.replaceChildren(
      ...themes.map(([value, label]) =>
        h(
          'button',
          {
            type: 'button',
            role: 'radio',
            'aria-checked': String(s.theme === value),
            class: s.theme === value ? 'on' : '',
            onclick: () => {
              s.theme = value;
              app.commit();
              app.applySettings();
              drawSeg();
            },
          },
          label,
        ),
      ),
    );
  drawSeg();

  const el = h(
    'div',
    { class: 'screen settings' },
    h(
      'header',
      { class: 'page-head' },
      h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Back', onclick: () => goHome() }, svg(ICON.back)),
      h('h1', null, 'Settings'),
    ),
    h(
      'section',
      { class: 'group' },
      h('h2', null, 'Playing'),
      toggle('mistakeLimit', 'Three-mistake check', 'Pauses after three slips and asks what you want to do'),
      toggle('highlightSame', 'Highlight matching numbers', 'Lights up every 5 when you tap a 5'),
      toggle('showTimer', 'Show the timer', 'Time is still kept for your best times'),
    ),
    h(
      'section',
      { class: 'group' },
      h('h2', null, 'Feel'),
      toggle('sound', 'Sound', 'Soft notes when things click into place'),
      toggle('haptics', 'Taps you can feel', 'Works on most phones'),
      toggle('reduceMotion', 'Calmer animations', 'Keeps movement to a minimum'),
      h('div', { class: 'setting' }, h('span', { class: 'row-text' }, h('b', null, 'Look'), h('small', null, 'Auto follows your phone')), seg),
    ),
    homeScreenGroup(),
    h(
      'section',
      { class: 'group' },
      h('h2', null, 'Good to know'),
      h(
        'ul',
        { class: 'tips' },
        h('li', null, 'Hold a number to lock it, then tap cells to drop it in. Tap the number again to let go.'),
        h('li', null, 'With Notes on, numbers go in small. They tidy themselves up as you solve.'),
        h('li', null, 'Pause has “Fill in all notes” if you’d rather skip the pencil work.'),
        h('li', null, 'Hints explain the move before they make it.'),
      ),
    ),
    h(
      'section',
      { class: 'group' },
      h('h2', null, 'Backup'),
      h('p', { class: 'group-note' }, 'Everything is saved on this phone only. If you ever change phones, copy your code here and paste it on the new one.'),
      h('button', { class: 'btn quiet left', type: 'button', onclick: copyCode }, 'Copy my progress code'),
      h('button', { class: 'btn quiet left', type: 'button', onclick: restoreSheet }, 'Restore from a code'),
    ),
    h('p', { class: 'about' }, 'Emily’s Sudoku. No ads, no accounts, works without internet.'),
    madeWithLove(),
  );
  return { el };
}

function homeScreenGroup(): HTMLElement | null {
  const st = installState();
  if (st.kind === 'installed') return null;
  const body =
    st.kind === 'prompt'
      ? h(
          'button',
          {
            class: 'btn primary',
            type: 'button',
            onclick: async () => {
              if (await promptInstall()) toast('Added. Look for the little blue grid.');
            },
          },
          'Add to home screen',
        )
      : h('p', { class: 'group-note' }, manualSteps(st.platform));
  return h('section', { class: 'group' }, h('h2', null, 'Home screen'), body);
}

async function copyCode(): Promise<void> {
  const code = exportCode(app.progress);
  try {
    await navigator.clipboard.writeText(code);
    toast('Copied. Keep it somewhere safe.');
  } catch {
    const area = h('textarea', { class: 'code', readonly: true, rows: '5' });
    area.value = code;
    openSheet(h('div', { class: 'sheet-body' }, h('h2', null, 'Your progress code'), h('p', null, 'Select it all and copy.'), area));
    area.select();
  }
}

function restoreSheet(): void {
  const area = h('textarea', { class: 'code', rows: '5', placeholder: 'Paste the code here', autocapitalize: 'off', autocomplete: 'off', spellcheck: 'false' });
  const error = h('p', { class: 'error', hidden: true }, 'That code doesn’t look right. Check that all of it was copied.');
  const sheet = openSheet(
    h(
      'div',
      { class: 'sheet-body' },
      h('h2', null, 'Restore from a code'),
      h('p', null, 'This replaces the progress on this phone with what’s in the code.'),
      area,
      error,
      h(
        'button',
        {
          class: 'btn primary',
          type: 'button',
          onclick: () => {
            const restored = importCode(area.value);
            if (!restored) {
              error.hidden = false;
              return;
            }
            app.progress = restored;
            app.commit();
            app.applySettings();
            void sheet.close();
            toast('Progress restored.');
            goHome();
          },
        },
        'Restore',
      ),
      h('button', { class: 'btn quiet', type: 'button', onclick: () => void sheet.close() }, 'Never mind'),
    ),
  );
}
