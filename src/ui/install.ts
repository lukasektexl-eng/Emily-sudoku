/**
 * Getting the app onto the home screen, on every phone.
 *
 * - Android Chrome / Edge / Samsung Internet fire `beforeinstallprompt`;
 *   we keep it and show our own "Add to home screen" button that triggers
 *   the real system install dialog.
 * - iPhone Safari has no install API, so we show the two-tap instructions.
 * - Other Android browsers (Firefox) get short menu instructions.
 * - Once it runs from the home screen, none of this is shown.
 */

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferred: InstallPromptEvent | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((f) => f());

export function initInstall(): void {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); // keep Chrome's mini-bar away; we offer our own button
    deferred = e as InstallPromptEvent;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    installedThisSession = true;
    notify();
  });
}

let installedThisSession = false;

export function onInstallChange(f: () => void): () => void {
  listeners.add(f);
  return () => listeners.delete(f);
}

export function isStandalone(): boolean {
  return (
    matchMedia('(display-mode: standalone)').matches ||
    matchMedia('(display-mode: fullscreen)').matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

export type Platform = 'ios' | 'ios-other' | 'android' | 'other';

export function platform(): Platform {
  const ua = navigator.userAgent;
  const ios = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  if (ios) return /CriOS|FxiOS|EdgiOS|OPiOS/.test(ua) ? 'ios-other' : 'ios';
  if (/Android/.test(ua)) return 'android';
  return 'other';
}

export type InstallState =
  | { kind: 'installed' }
  | { kind: 'prompt' } // we can open the real install dialog
  | { kind: 'manual'; platform: Platform };

export function installState(): InstallState {
  if (isStandalone() || installedThisSession) return { kind: 'installed' };
  if (deferred) return { kind: 'prompt' };
  return { kind: 'manual', platform: platform() };
}

/** Opens the system install dialog. Resolves true if she accepted. */
export async function promptInstall(): Promise<boolean> {
  const e = deferred;
  if (!e) return false;
  deferred = null;
  await e.prompt();
  const choice = await e.userChoice.catch(() => ({ outcome: 'dismissed' as const }));
  notify();
  return choice.outcome === 'accepted';
}

/** One plain sentence for each situation where we can't press the button for her. */
export function manualSteps(p: Platform): string {
  switch (p) {
    case 'ios':
      return 'Tap the Share button at the bottom of Safari, then “Add to Home Screen”.';
    case 'ios-other':
      return 'Open this page in Safari, tap Share, then “Add to Home Screen”.';
    case 'android':
      return 'Open the browser menu (⋮) and tap “Add to Home screen” or “Install app”.';
    default:
      return 'Open this page on your phone to add it to your home screen.';
  }
}
