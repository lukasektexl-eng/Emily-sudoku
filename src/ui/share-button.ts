import { app } from '../app';
import { shareText } from '../game/share';
import { h, svg } from './dom';
import { ICON } from './icons';
import { openSheet, toast } from './sheet';

/**
 * Opens the phone's share sheet (Messages, WhatsApp…) with her progress.
 * Read-only: nothing here writes to her saved progress.
 */
export function shareButton(): HTMLElement {
  return h(
    'button',
    {
      class: 'btn quiet share-btn',
      type: 'button',
      onclick: () => void share(),
    },
    svg(ICON.share),
    h('span', null, 'Share my progress'),
  );
}

async function share(): Promise<void> {
  const text = shareText(app.progress);
  if (typeof navigator.share === 'function') {
    try {
      await navigator.share({ text });
      return;
    } catch (e) {
      // She closed the share sheet: that's fine, do nothing.
      if (e instanceof DOMException && e.name === 'AbortError') return;
    }
  }
  try {
    await navigator.clipboard.writeText(text);
    toast('Copied. Paste it in a message.');
    return;
  } catch {
    /* fall through to showing the text */
  }
  const area = h('textarea', { class: 'code', readonly: true, rows: '6' });
  area.value = text;
  openSheet(h('div', { class: 'sheet-body' }, h('h2', null, 'Your progress'), h('p', null, 'Select it and copy it into a message.'), area));
  area.select();
}
