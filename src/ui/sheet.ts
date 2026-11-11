import { h } from './dom';
import { motionReduced } from './fx';

export interface SheetHandle {
  close: () => Promise<void>;
  el: HTMLElement;
}

/** A panel that slides up from the bottom, inside the thumb zone. */
export function openSheet(content: HTMLElement, opts: { dismissible?: boolean; onClose?: () => void; tall?: boolean } = {}): SheetHandle {
  const dismissible = opts.dismissible ?? true;
  const panel = h('div', { class: 'sheet-panel' + (opts.tall ? ' tall' : ''), role: 'dialog', 'aria-modal': 'true' }, content);
  const backdrop = h('div', { class: 'sheet' }, panel);
  let closed = false;

  const close = (): Promise<void> =>
    new Promise((resolve) => {
      if (closed) return resolve();
      closed = true;
      backdrop.classList.remove('open');
      const done = () => {
        backdrop.remove();
        opts.onClose?.();
        resolve();
      };
      if (motionReduced()) done();
      else setTimeout(done, 240);
    });

  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop && dismissible) void close();
  });
  document.body.append(backdrop);
  // Next frame so the transition runs.
  requestAnimationFrame(() => requestAnimationFrame(() => backdrop.classList.add('open')));
  return { close, el: panel };
}

/** Brief message at the bottom of the screen. */
export function toast(text: string): void {
  document.querySelector('.toast')?.remove();
  const el = h('div', { class: 'toast', role: 'status' }, text);
  document.body.append(el);
  requestAnimationFrame(() => el.classList.add('open'));
  setTimeout(() => {
    el.classList.remove('open');
    setTimeout(() => el.remove(), 300);
  }, 2200);
}
