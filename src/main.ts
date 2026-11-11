import './styles/tokens.css';
import './styles/base.css';
import './styles/board.css';
import './styles/screens.css';
import './styles/letters.css';
import { app } from './app';
import { goHome } from './nav';
import { initInstall } from './ui/install';
import { unlockAudio } from './ui/sound';

initInstall();
app.mount(document.getElementById('app')!);
goHome('none');

// iOS only lets audio start from inside a touch, so wake it on the first few.
for (const type of ['pointerdown', 'touchend', 'click'] as const) {
  document.addEventListener(type, unlockAudio, { passive: true });
}

// Follow the phone when it switches between light and dark.
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => app.applySettings());

// Stop Safari's pinch zoom from fighting the board.
document.addEventListener('gesturestart', (e) => e.preventDefault());

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {});
  });
}
