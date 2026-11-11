import { PEERS, bit } from '../engine/grid';
import { isGiven, isWrong, type Game } from '../game/state';
import { h } from './dom';
import type { CellEls } from './fx';

export interface BoardView {
  el: HTMLElement;
  cells: (CellEls & { notes: HTMLElement[] })[];
  render: (g: Game, selected: number, focusDigit: number, highlightSame: boolean) => void;
}

/**
 * The grid is nine boxes of nine cells, so the thick box lines are simply
 * the gaps between boxes. Each cell is built once and only updated after.
 */
export function createBoard(onTap: (cell: number) => void): BoardView {
  const cells: BoardView['cells'] = new Array(81);
  const el = h('div', { class: 'board', role: 'grid', 'aria-label': 'Sudoku board' });

  for (let b = 0; b < 9; b++) {
    const box = h('div', { class: 'box' });
    for (let k = 0; k < 9; k++) {
      const r = Math.floor(b / 3) * 3 + Math.floor(k / 3);
      const c = (b % 3) * 3 + (k % 3);
      const i = r * 9 + c;
      const glow = h('span', { class: 'glow' });
      const digit = h('span', { class: 'digit' });
      const notesWrap = h('span', { class: 'notes' });
      const notes = Array.from({ length: 9 }, () => h('i'));
      notesWrap.append(...notes);
      const root = h('button', { class: 'cell', type: 'button', dataset: { i: String(i) } }, glow, digit, notesWrap);
      cells[i] = { root, digit, glow, notes };
      box.append(root);
    }
    el.append(box);
  }

  // One listener for the whole board; pointerdown feels instant on a phone.
  el.addEventListener('pointerdown', (e) => {
    const cell = (e.target as HTMLElement).closest<HTMLElement>('.cell');
    if (cell) onTap(+cell.dataset.i!);
  });

  const render: BoardView['render'] = (g, selected, focusDigit, highlightSame) => {
    const peers = selected >= 0 ? new Set(PEERS[selected]) : null;
    for (let i = 0; i < 81; i++) {
      const c = cells[i];
      const v = g.values[i];
      const given = isGiven(g, i);
      const wrong = isWrong(g, i);
      let cls = 'cell';
      if (given) cls += ' given';
      if (wrong) cls += ' wrong';
      if (i === selected) cls += ' sel';
      else if (peers?.has(i)) cls += ' peer';
      if (highlightSame && focusDigit && v === focusDigit && i !== selected) cls += ' same';
      if (c.root.className !== cls) c.root.className = cls;

      const text = v ? String(v) : '';
      if (c.digit.textContent !== text) c.digit.textContent = text;

      const mask = v ? 0 : g.notes[i];
      for (let d = 1; d <= 9; d++) {
        const on = (mask & bit(d)) !== 0;
        const n = c.notes[d - 1];
        const t = on ? String(d) : '';
        if (n.textContent !== t) n.textContent = t;
        const hot = on && highlightSame && d === focusDigit;
        if (n.classList.contains('hot') !== hot) n.classList.toggle('hot', hot);
      }
      const r = Math.floor(i / 9) + 1;
      const col = (i % 9) + 1;
      c.root.setAttribute('aria-label', `Row ${r}, column ${col}, ${v ? (given ? `given ${v}` : String(v)) : 'empty'}`);
    }
  };

  return { el, cells, render };
}
