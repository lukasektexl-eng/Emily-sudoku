import { app, type Screen } from '../../app';
import { prefetch } from '../../engine/client';
import { DIFFICULTY_LABEL, levelDifficulty, levelSeed } from '../../engine/generator';
import { nextHint } from '../../engine/grader';
import { UNITS, bit } from '../../engine/grid';
import { formatTime, recordWin } from '../../game/progress';
import { remaining } from '../../game/rules';
import { autoNotes, correctValues, erase, isGiven, isWrong, placeDigit, toggleNote, undo, type Game } from '../../game/state';
import { goHome, replay } from '../../nav';
import { createBoard } from '../board';
import { h, svg } from '../dom';
import * as fx from '../fx';
import { tick } from '../haptics';
import { ICON } from '../icons';
import { openSheet } from '../sheet';
import { sfx, unlockAudio } from '../sound';
import { showWin } from './win';

const MISTAKE_LIMIT = 3;

export function gameTitle(g: Game): string {
  if (g.kind === 'level') return `Level ${g.level}`;
  if (g.kind === 'daily') {
    const d = new Date(g.date + 'T12:00:00');
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });
  }
  return 'Free play';
}

export function gameScreen(g: Game): Screen {
  let selected = -1;
  let notesMode = false;
  let lockedDigit = 0;
  let paused = false;
  let finished = g.done;
  let lastTick = performance.now();
  let lastSave = 0;
  let hintTimer = 0;

  const settings = () => app.progress.settings;

  // ---- header --------------------------------------------------------------
  const timeEl = h('span', { class: 'time' }, formatTime(g.elapsedMs));
  const pauseBtn = h('button', { class: 'pause-btn', type: 'button', 'aria-label': 'Pause', onclick: () => setPaused(true) }, timeEl, svg(ICON.pause));
  const mistakesEl = h('span', { class: 'mistakes' });
  const top = h(
    'header',
    { class: 'game-top' },
    h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Back', onclick: leave }, svg(ICON.back)),
    h('div', { class: 'game-title' }, h('h1', null, gameTitle(g)), h('p', null, DIFFICULTY_LABEL[g.difficulty], h('span', { class: 'sep' }, ' · '), mistakesEl)),
    pauseBtn,
  );

  // ---- board ---------------------------------------------------------------
  const board = createBoard(onCell);
  const pausedCover = h(
    'div',
    { class: 'paused-cover' },
    h('p', { class: 'paused-title' }, 'Paused'),
    h('p', { class: 'paused-sub' }, "Take your time, there's no rush."),
    h('button', { class: 'btn primary', type: 'button', onclick: () => setPaused(false) }, 'Continue'),
    h('button', { class: 'btn quiet', type: 'button', onclick: fillNotes }, 'Fill in all notes'),
    h('button', { class: 'btn quiet', type: 'button', onclick: confirmRestart }, 'Start over'),
  );
  const boardWrap = h('div', { class: 'board-wrap' }, board.el, pausedCover);

  // ---- hint line -----------------------------------------------------------
  const hintBar = h('p', { class: 'hint-bar', role: 'status' });

  // ---- tools ---------------------------------------------------------------
  const tool = (icon: string, label: string, onclick: () => void) =>
    h('button', { class: 'tool', type: 'button', onclick }, svg(icon), h('span', null, label));
  const notesBtn = tool(ICON.pencil, 'Notes', () => {
    notesMode = !notesMode;
    sfx.tap();
    render();
  });
  const notesBadge = h('em', { class: 'badge' }, 'off');
  notesBtn.append(notesBadge);
  const tools = h(
    'div',
    { class: 'tools' },
    tool(ICON.undo, 'Undo', doUndo),
    tool(ICON.eraser, 'Erase', doErase),
    notesBtn,
    tool(ICON.bulb, 'Hint', doHint),
  );

  // ---- number pad ----------------------------------------------------------
  const padBtns: HTMLButtonElement[] = [];
  const padLeft: HTMLElement[] = [];
  const pad = h('div', { class: 'pad' });
  for (let d = 1; d <= 9; d++) {
    const left = h('small', null, '9');
    const btn = h('button', { class: 'num', type: 'button', 'aria-label': `Number ${d}` }, h('b', null, String(d)), left);
    let pressTimer = 0;
    let longPressed = false;
    btn.addEventListener('pointerdown', () => {
      unlockAudio();
      longPressed = false;
      pressTimer = window.setTimeout(() => {
        longPressed = true;
        lockedDigit = lockedDigit === d ? 0 : d;
        tick('firm');
        sfx.tap();
        render();
      }, 420);
    });
    const cancel = () => clearTimeout(pressTimer);
    btn.addEventListener('pointerleave', cancel);
    btn.addEventListener('pointercancel', cancel);
    btn.addEventListener('pointerup', () => {
      cancel();
      if (!longPressed) onNumber(d);
    });
    btn.addEventListener('contextmenu', (e) => e.preventDefault());
    padBtns.push(btn);
    padLeft.push(left);
    pad.append(btn);
  }

  const el = h('div', { class: 'screen game' }, top, boardWrap, hintBar, tools, pad);

  // ---- rendering -----------------------------------------------------------
  function focusDigit(): number {
    if (lockedDigit) return lockedDigit;
    return selected >= 0 ? g.values[selected] : 0;
  }

  function render(): void {
    board.render(g, selected, focusDigit(), settings().highlightSame);
    const left = remaining(g.values, g.solution);
    for (let d = 1; d <= 9; d++) {
      const btn = padBtns[d - 1];
      padLeft[d - 1].textContent = String(left[d]);
      btn.classList.toggle('done', left[d] === 0);
      btn.classList.toggle('locked', lockedDigit === d);
      btn.disabled = left[d] === 0;
    }
    notesBtn.classList.toggle('on', notesMode);
    notesBadge.textContent = notesMode ? 'on' : 'off';
    el.classList.toggle('notes-on', notesMode);
    const limited = settings().mistakeLimit && !g.limitWaived;
    mistakesEl.textContent = g.mistakes === 0 && !limited ? 'No mistakes' : limited ? `Mistakes ${g.mistakes}/${MISTAKE_LIMIT}` : `Mistakes ${g.mistakes}`;
    timeEl.hidden = !settings().showTimer;
  }

  function persist(): void {
    app.saveGame(g);
    lastSave = performance.now();
  }

  function clearHint(): void {
    clearTimeout(hintTimer);
    hintBar.classList.remove('show');
  }

  // ---- input ---------------------------------------------------------------
  function onCell(i: number): void {
    if (paused || finished) return;
    unlockAudio();
    clearHint();
    selected = i;
    if (lockedDigit && !isGiven(g, i) && (!g.values[i] || isWrong(g, i))) {
      act(i, lockedDigit);
      return;
    }
    sfx.tap();
    render();
  }

  function onNumber(d: number): void {
    if (paused || finished) return;
    clearHint();
    if (lockedDigit) {
      lockedDigit = lockedDigit === d ? 0 : d;
      sfx.tap();
      render();
      return;
    }
    if (selected < 0) {
      // Nothing selected: just show where this number already is.
      lockedDigit = d;
      sfx.tap();
      render();
      return;
    }
    act(selected, d);
  }

  function act(i: number, d: number): void {
    if (notesMode) {
      const had = (g.notes[i] & bit(d)) !== 0;
      if (toggleNote(g, i, d)) {
        sfx.note();
        render();
        if (!had) fx.noteIn(board.cells[i].notes[d - 1]);
        persist();
      } else render();
      return;
    }
    const result = placeDigit(g, i, d);
    render();
    if (result.kind === 'ignored') return;
    const cell = board.cells[i];
    if (result.kind === 'wrong') {
      fx.shake(cell);
      sfx.wrong();
      tick('firm');
      persist();
      if (settings().mistakeLimit && !g.limitWaived && g.mistakes >= MISTAKE_LIMIT) setTimeout(limitReached, 420);
      return;
    }
    fx.pop(cell);
    tick();
    if (result.solved) {
      win(i);
      return;
    }
    if (result.units.length) {
      const seen = new Set<number>();
      for (const u of result.units) for (const j of UNITS[u]) seen.add(j);
      const idx = [...seen];
      fx.sweep(idx.map((j) => board.cells[j]), idx, i);
      sfx.unit(result.units.length);
      tick('firm');
    } else {
      sfx.place();
    }
    if (result.digitDone) {
      const same = g.values.map((v, j) => (v === d ? j : -1)).filter((j) => j >= 0);
      setTimeout(() => {
        fx.pulse(same.map((j) => board.cells[j]));
        fx.retire(padBtns[d - 1]);
        if (!result.units.length) sfx.digitDone();
      }, result.units.length ? 380 : 120);
      if (lockedDigit === d) lockedDigit = 0;
      render();
    }
    persist();
  }

  function doUndo(): void {
    if (paused || finished) return;
    clearHint();
    const cells = undo(g);
    if (!cells) return;
    sfx.erase();
    if (cells.length === 1) selected = cells[0];
    render();
    persist();
  }

  function doErase(): void {
    if (paused || finished || selected < 0) return;
    clearHint();
    if (erase(g, selected)) {
      sfx.erase();
      render();
      persist();
    }
  }

  function doHint(): void {
    if (paused || finished) return;
    const hint = nextHint(correctValues(g), g.solution, selected);
    if (!hint) return;
    lockedDigit = 0;
    notesMode = false;
    selected = hint.cell;
    render();
    fx.hintGlow(board.cells[hint.cell]);
    hintBar.textContent = hint.text;
    hintBar.classList.add('show');
    sfx.tap();
    clearTimeout(hintTimer);
    // Let her read the reason first; then the digit arrives.
    hintTimer = window.setTimeout(() => {
      if (finished || g.values[hint.cell] === hint.digit) return;
      g.hints++;
      act(hint.cell, hint.digit);
      hintTimer = window.setTimeout(() => hintBar.classList.remove('show'), 4200);
    }, fx.motionReduced() ? 300 : 950);
  }

  function fillNotes(): void {
    autoNotes(g);
    setPaused(false);
    render();
    persist();
  }

  // ---- pause / timer -------------------------------------------------------
  function setPaused(on: boolean): void {
    if (finished) return;
    paused = on;
    lastTick = performance.now();
    el.classList.toggle('paused', on);
    if (on) persist();
  }

  const timer = window.setInterval(() => {
    const now = performance.now();
    if (!paused && !finished && !document.hidden) {
      g.elapsedMs += Math.min(1000, now - lastTick);
      timeEl.textContent = formatTime(g.elapsedMs);
      if (now - lastSave > 5000) persist();
    }
    lastTick = now;
  }, 250);

  // ---- mistakes limit ------------------------------------------------------
  function limitReached(): void {
    if (finished) return;
    paused = true;
    const sheet = openSheet(
      h(
        'div',
        { class: 'sheet-body' },
        h('h2', null, 'Three slips.'),
        h('p', null, 'It happens. You can keep going with this board or start it fresh.'),
        h(
          'button',
          {
            class: 'btn primary',
            type: 'button',
            onclick: () => {
              g.limitWaived = true;
              void sheet.close();
            },
          },
          'Keep going',
        ),
        h('button', { class: 'btn quiet', type: 'button', onclick: () => void sheet.close().then(restart) }, 'Start over'),
      ),
      {
        dismissible: false,
        onClose: () => {
          paused = false;
          lastTick = performance.now();
          render();
          persist();
        },
      },
    );
  }

  function confirmRestart(): void {
    const sheet = openSheet(
      h(
        'div',
        { class: 'sheet-body' },
        h('h2', null, 'Start this one over?'),
        h('p', null, 'The board is cleared and the timer goes back to zero.'),
        h('button', { class: 'btn primary', type: 'button', onclick: () => void sheet.close().then(restart) }, 'Start over'),
        h('button', { class: 'btn quiet', type: 'button', onclick: () => void sheet.close() }, 'Never mind'),
      ),
    );
  }

  function restart(): void {
    finished = true;
    app.clearGame(g);
    replay(g);
  }

  // ---- winning -------------------------------------------------------------
  function win(lastCell: number): void {
    finished = true;
    clearHint();
    selected = -1;
    lockedDigit = 0;
    render();
    app.saveGame(g); // clears the slot, the game is done
    const summary = recordWin(app.progress, g);
    app.commit();
    if (g.kind === 'level' && g.level) prefetch(levelSeed(g.level + 1), levelDifficulty(g.level + 1));

    const all = Array.from({ length: 81 }, (_, i) => i);
    const wait = fx.motionReduced() ? 200 : fx.sweep(all.map((i) => board.cells[i]), all, lastCell, 'sea', 38);
    sfx.unit(2);
    tick('firm');
    setTimeout(() => {
      sfx.win();
      fx.petals();
      showWin(g, summary);
    }, Math.min(wait, 900));
  }

  // ---- leaving -------------------------------------------------------------
  function leave(): void {
    if (!finished) persist();
    goHome('back');
  }

  // ---- keyboard (handy on a laptop) ----------------------------------------
  function onKey(e: KeyboardEvent): void {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key >= '1' && e.key <= '9') onNumber(+e.key);
    else if (e.key === 'Backspace' || e.key === 'Delete') doErase();
    else if (e.key === 'n') notesBtn.click();
    else if (e.key === 'z') doUndo();
    else if (e.key.startsWith('Arrow') && !paused && !finished) {
      const cur = selected < 0 ? 40 : selected;
      const r = Math.floor(cur / 9);
      const c = cur % 9;
      const [nr, nc] =
        e.key === 'ArrowUp' ? [Math.max(0, r - 1), c] : e.key === 'ArrowDown' ? [Math.min(8, r + 1), c] : e.key === 'ArrowLeft' ? [r, Math.max(0, c - 1)] : [r, Math.min(8, c + 1)];
      selected = nr * 9 + nc;
      render();
      e.preventDefault();
    }
  }
  document.addEventListener('keydown', onKey);

  render();
  if (g.kind === 'level' && g.level) prefetch(levelSeed(g.level + 1), levelDifficulty(g.level + 1));

  return {
    el,
    onHide: () => {
      if (!finished) {
        persist();
        if (g.elapsedMs > 0) setPaused(true);
      }
    },
    destroy: () => {
      clearInterval(timer);
      clearTimeout(hintTimer);
      document.removeEventListener('keydown', onKey);
    },
  };
}
