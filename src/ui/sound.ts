/**
 * All sounds are synthesised on the fly: soft sine/triangle notes, no files.
 * Notes come from a pentatonic scale so anything played together sounds fine.
 */
let ctx: AudioContext | null = null;
let enabled = true;

export function setSoundEnabled(on: boolean): void {
  enabled = on;
}

/** iOS only allows audio after a touch, so wake the context on the first one. */
export function unlockAudio(): void {
  if (!enabled) return;
  try {
    if (!ctx) {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') void ctx.resume();
  } catch {
    ctx = null;
  }
}

function note(freq: number, at: number, dur: number, gain: number, type: OscillatorType = 'sine'): void {
  if (!ctx || !enabled || ctx.state !== 'running') return;
  const t = ctx.currentTime + at;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

// C major pentatonic around C5.
const N = { C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99, A5: 880, C6: 1046.5, D6: 1174.66, E6: 1318.5, G6: 1568 };

export const sfx = {
  tap: () => note(N.E5, 0, 0.07, 0.035),
  place: () => note(N.G5, 0, 0.11, 0.06),
  note: () => note(N.C6, 0, 0.05, 0.02),
  erase: () => note(N.C5, 0, 0.08, 0.03, 'triangle'),
  wrong: () => {
    note(196, 0, 0.16, 0.07, 'triangle');
    note(185, 0.02, 0.16, 0.05, 'triangle');
  },
  unit: (count = 1) => {
    const seq = count > 1 ? [N.E5, N.G5, N.C6, N.E6] : [N.E5, N.G5, N.C6];
    seq.forEach((f, i) => note(f, i * 0.07, 0.28, 0.055));
  },
  digitDone: () => {
    note(N.A5, 0, 0.2, 0.05);
    note(N.D6, 0.08, 0.3, 0.05);
  },
  win: () => {
    [N.C5, N.E5, N.G5, N.C6, N.E6, N.G6].forEach((f, i) => note(f, i * 0.09, 0.6, 0.06));
    note(N.C5 / 2, 0.5, 1.1, 0.05, 'triangle');
  },
  star: (i: number) => note([N.G5, N.C6, N.E6][i] ?? N.E6, 0, 0.35, 0.05),
  letter: () => {
    [N.G5, N.D6, N.E6].forEach((f, i) => note(f, i * 0.16, 0.9, 0.045));
  },
  paper: () => note(N.D5, 0, 0.09, 0.025, 'triangle'),
};
