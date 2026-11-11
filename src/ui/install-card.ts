import { h, svg } from './dom';
import { ICON } from './icons';
import { installState, manualSteps, onInstallChange, promptInstall } from './install';
import { toast } from './sheet';

/**
 * The card on the home screen that gets the app onto her home screen.
 * On Android it is a real button; on iPhone it explains the two taps.
 * Dismissing the instructions hides them for good; the Android button
 * comes back whenever the phone says installing is possible.
 */
export function installCard(onDismiss: () => void, dismissed: boolean): { el: HTMLElement; destroy: () => void } {
  const el = h('aside', { class: 'install' });

  const draw = () => {
    const s = installState();
    if (s.kind === 'installed' || (s.kind === 'manual' && (dismissed || s.platform === 'other'))) {
      el.hidden = true;
      el.replaceChildren();
      return;
    }
    el.hidden = false;
    if (s.kind === 'prompt') {
      el.className = 'install can';
      el.replaceChildren(
        svg(ICON.download),
        h('p', null, h('b', null, 'Keep me on your home screen.'), ' One tap, and I sit next to your other apps.'),
        h(
          'button',
          {
            class: 'btn primary small',
            type: 'button',
            onclick: async () => {
              const ok = await promptInstall();
              if (ok) toast('Added. Look for the little blue grid.');
            },
          },
          'Add',
        ),
      );
      return;
    }
    el.className = 'install';
    el.replaceChildren(
      svg(s.platform === 'android' ? ICON.download : ICON.share),
      h('p', null, h('b', null, 'Keep me on your home screen.'), ' ', manualSteps(s.platform)),
      h(
        'button',
        {
          class: 'icon-btn',
          type: 'button',
          'aria-label': 'Dismiss',
          onclick: () => {
            dismissed = true;
            onDismiss();
            draw();
          },
        },
        svg(ICON.close),
      ),
    );
  };

  draw();
  const off = onInstallChange(draw);
  return { el, destroy: off };
}
