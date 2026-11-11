/**
 * Haptics are a bonus, never something the game relies on.
 * - Android: navigator.vibrate.
 * - iPhone (iOS 17.4+): toggling a native switch control gives a light tick,
 *   which is the only way a web app can reach the Taptic Engine.
 */
let enabled = true;
let label: HTMLLabelElement | null = null;

export function setHapticsEnabled(on: boolean): void {
  enabled = on;
}

function ensureSwitch(): HTMLLabelElement {
  if (label) return label;
  label = document.createElement('label');
  label.setAttribute('aria-hidden', 'true');
  label.style.cssText = 'position:fixed;left:-99px;top:-99px;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none';
  const input = document.createElement('input');
  input.type = 'checkbox';
  input.setAttribute('switch', '');
  input.tabIndex = -1;
  label.append(input);
  document.body.append(label);
  return label;
}

export function tick(strength: 'light' | 'firm' = 'light'): void {
  if (!enabled) return;
  try {
    if (typeof navigator.vibrate === 'function') {
      navigator.vibrate(strength === 'firm' ? [12, 40, 12] : 8);
      return;
    }
    ensureSwitch().click();
    if (strength === 'firm') setTimeout(() => label?.click(), 70);
  } catch {
    /* no haptics here, that's fine */
  }
}
