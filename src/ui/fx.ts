/**
 * Every animation in the app lives here.
 * Rules: transform/opacity only, short, one celebration at a time,
 * and everything collapses to (almost) nothing when motion is reduced.
 */
import { colOf, rowOf } from '../engine/grid';

let reduced = false;
const media = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null;

export function setReduceMotion(setting: boolean): void {
  reduced = setting || !!media?.matches;
  document.documentElement.dataset.motion = reduced ? 'reduced' : 'full';
}
export const motionReduced = () => reduced;

const SPRING = 'cubic-bezier(.3,1.5,.5,1)';
const OUT = 'cubic-bezier(.2,.8,.2,1)';

function play(el: Element | null | undefined, frames: Keyframe[], opts: KeyframeAnimationOptions): Animation | null {
  if (!el || typeof el.animate !== 'function') return null;
  if (reduced) return null;
  return el.animate(frames, { fill: 'both', ...opts });
}

const dist = (a: number, b: number) => Math.hypot(rowOf(a) - rowOf(b), colOf(a) - colOf(b));

export interface CellEls {
  root: HTMLElement;
  digit: HTMLElement;
  glow: HTMLElement;
}

/** A digit landing in a cell. */
export function pop(c: CellEls): void {
  play(c.digit, [{ transform: 'scale(.55)', opacity: 0.2 }, { transform: 'scale(1)', opacity: 1 }], { duration: 260, easing: SPRING });
}

/** A wrong digit: quick shake, no drama. */
export function shake(c: CellEls): void {
  play(
    c.digit,
    [
      { transform: 'translateX(0)' },
      { transform: 'translateX(-14%)' },
      { transform: 'translateX(12%)' },
      { transform: 'translateX(-8%)' },
      { transform: 'translateX(5%)' },
      { transform: 'translateX(0)' },
    ],
    { duration: 340, easing: 'ease-out' },
  );
}

/** A pencil note appearing. */
export function noteIn(el: HTMLElement): void {
  play(el, [{ transform: 'scale(.4)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }], { duration: 160, easing: OUT });
}

/**
 * A row, column or box was completed: light runs outward from the cell
 * she just filled, and each digit lifts a little as it passes.
 */
export function sweep(cells: CellEls[], indices: number[], origin: number, tone: 'peony' | 'sea' = 'peony', step = 42): number {
  let longest = 0;
  indices.forEach((idx, k) => {
    const c = cells[k];
    const delay = dist(idx, origin) * step;
    longest = Math.max(longest, delay);
    c.glow.dataset.tone = tone;
    if (reduced) {
      c.glow.animate?.([{ opacity: 0 }, { opacity: 0.5 }, { opacity: 0 }], { duration: 500, delay: 0 });
      return;
    }
    play(
      c.glow,
      [
        { opacity: 0, transform: 'scale(.5)' },
        { opacity: 0.95, transform: 'scale(1)', offset: 0.35 },
        { opacity: 0, transform: 'scale(1)' },
      ],
      { duration: 620, delay, easing: OUT },
    );
    play(
      c.digit,
      [{ transform: 'translateY(0) scale(1)' }, { transform: 'translateY(-12%) scale(1.16)', offset: 0.4 }, { transform: 'translateY(0) scale(1)' }],
      { duration: 460, delay, easing: OUT },
    );
  });
  return longest + 620;
}

/** One soft pulse on every cell holding a digit that is now complete. */
export function pulse(cells: CellEls[]): void {
  for (const c of cells) {
    play(c.digit, [{ transform: 'scale(1)' }, { transform: 'scale(1.22)' }, { transform: 'scale(1)' }], { duration: 380, easing: OUT });
  }
}

/** The pad button of a finished digit bows out. */
export function retire(el: HTMLElement): void {
  play(el, [{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(.8)', opacity: 0.25 }], { duration: 300, easing: OUT });
}

export function hintGlow(c: CellEls): void {
  c.glow.dataset.tone = 'sea';
  play(c.glow, [{ opacity: 0 }, { opacity: 0.8 }, { opacity: 0 }, { opacity: 0.8 }, { opacity: 0 }], { duration: 900, easing: 'ease-in-out' });
}

/** New screen: short rise and fade. */
export function screenIn(el: HTMLElement, dir: 'forward' | 'back' | 'none' = 'forward'): void {
  if (dir === 'none') return;
  const from = dir === 'forward' ? 'translateY(10px)' : 'translateY(-6px)';
  play(el, [{ opacity: 0, transform: from }, { opacity: 1, transform: 'none' }], { duration: 220, easing: OUT })?.finished.then(
    (a) => a.cancel(),
    () => {},
  );
}

/** Staggered entrance for a list of things (rows, stars). */
export function stagger(els: Element[], gap = 45, start = 0): void {
  els.forEach((el, i) => {
    play(el, [{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 300, delay: start + i * gap, easing: OUT })?.finished.then(
      (a) => a.cancel(),
      () => {},
    );
  });
}

export function starIn(el: HTMLElement, i: number): void {
  if (reduced) {
    el.classList.add('on');
    return;
  }
  setTimeout(() => el.classList.add('on'), 350 + i * 260);
  play(el, [{ transform: 'scale(.2) rotate(-40deg)' }, { transform: 'scale(1) rotate(0)' }], { duration: 480, delay: 350 + i * 260, easing: SPRING });
}

export function beat(el: HTMLElement): void {
  play(el, [{ transform: 'scale(1)' }, { transform: 'scale(1.35)' }, { transform: 'scale(.95)' }, { transform: 'scale(1.15)' }, { transform: 'scale(1)' }], {
    duration: 620,
    easing: 'ease-out',
  });
}

export function bump(el: HTMLElement): void {
  play(el, [{ transform: 'scale(1)' }, { transform: 'scale(1.18)' }, { transform: 'scale(1)' }], { duration: 300, easing: OUT });
}

/** Count a number up (used for time on the win sheet). */
export function countUp(el: HTMLElement, to: number, format: (n: number) => string, duration = 700): void {
  if (reduced) {
    el.textContent = format(to);
    return;
  }
  const t0 = performance.now();
  const frame = (t: number) => {
    const k = Math.min(1, (t - t0) / duration);
    const eased = 1 - Math.pow(1 - k, 3);
    el.textContent = format(to * eased);
    if (k < 1) requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

/**
 * Petals, not rainbow squares: a brief fall of peony and ocean-coloured
 * petals from the top of the screen. Runs once, about two seconds.
 */
export function petals(): void {
  if (reduced) return;
  const canvas = document.createElement('canvas');
  canvas.className = 'petals';
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const W = window.innerWidth;
  const H = window.innerHeight;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  document.body.append(canvas);
  const g = canvas.getContext('2d');
  if (!g) {
    canvas.remove();
    return;
  }
  g.scale(dpr, dpr);
  const colours = ['#e7a3b1', '#f2c4cd', '#c96f84', '#cfe3ee', '#7fb1d1', '#2f6f9a', '#fbf7f0'];
  const N = 64;
  const parts = Array.from({ length: N }, (_, i) => ({
    x: W * (0.1 + 0.8 * Math.random()),
    y: -20 - Math.random() * H * 0.35,
    vx: (Math.random() - 0.5) * 60,
    vy: 120 + Math.random() * 170,
    size: 7 + Math.random() * 8,
    rot: Math.random() * Math.PI * 2,
    spin: (Math.random() - 0.5) * 5,
    sway: 1.5 + Math.random() * 2.5,
    phase: Math.random() * Math.PI * 2,
    colour: colours[i % colours.length],
  }));
  const life = 2600;
  const t0 = performance.now();
  let prev = t0;
  const frame = (now: number) => {
    const dt = Math.min(0.04, (now - prev) / 1000);
    prev = now;
    const age = now - t0;
    g.clearRect(0, 0, W, H);
    g.globalAlpha = age > life - 600 ? Math.max(0, (life - age) / 600) : 1;
    for (const p of parts) {
      p.vy += 60 * dt;
      p.x += (p.vx + Math.sin(age / 1000 * p.sway + p.phase) * 55) * dt;
      p.y += p.vy * dt;
      p.rot += p.spin * dt;
      const flip = Math.cos(age / 1000 * p.sway * 1.7 + p.phase);
      g.save();
      g.translate(p.x, p.y);
      g.rotate(p.rot);
      g.scale(1, 0.35 + 0.65 * Math.abs(flip));
      g.fillStyle = p.colour;
      g.beginPath();
      // petal: a teardrop
      g.moveTo(0, -p.size);
      g.bezierCurveTo(p.size * 0.9, -p.size * 0.5, p.size * 0.7, p.size * 0.8, 0, p.size);
      g.bezierCurveTo(-p.size * 0.7, p.size * 0.8, -p.size * 0.9, -p.size * 0.5, 0, -p.size);
      g.fill();
      g.restore();
    }
    if (age < life) requestAnimationFrame(frame);
    else canvas.remove();
  };
  requestAnimationFrame(frame);
}
