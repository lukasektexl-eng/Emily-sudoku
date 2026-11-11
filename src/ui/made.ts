import { h, svg } from './dom';
import { beat } from './fx';
import { tick } from './haptics';
import { ICON } from './icons';
import { sfx, unlockAudio } from './sound';

/** The quiet line at the bottom. Tap the heart and it beats. */
export function madeWithLove(): HTMLElement {
  const heart = svg(ICON.heart, 'heart');
  const btn = h(
    'button',
    {
      class: 'made',
      type: 'button',
      'aria-label': 'Made with love, by Lukas',
      onclick: () => {
        unlockAudio();
        beat(heart);
        tick();
        sfx.paper();
      },
    },
    h('span', null, 'made with love, by Lukas'),
    heart,
  );
  return btn;
}
