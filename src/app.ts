import { normalize, type Progress } from './game/progress';
import type { Game, GameKind } from './game/state';
import { load, remove, resetIfOutdated, save } from './game/storage';
import { screenIn, setReduceMotion } from './ui/fx';
import { setHapticsEnabled } from './ui/haptics';
import { setSoundEnabled } from './ui/sound';

/** A screen is an element plus an optional teardown. */
export interface Screen {
  el: HTMLElement;
  destroy?: () => void;
  /** Called when the app goes to the background / returns. */
  onHide?: () => void;
}

const HISTORY_CAP = 400;

// Runs before any progress is read, so a reset is never half-applied.
resetIfOutdated();

class App {
  progress: Progress = normalize(load<Progress | null>('progress', null));
  private root!: HTMLElement;
  private current: Screen | null = null;

  mount(root: HTMLElement): void {
    this.root = root;
    this.applySettings();
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.current?.onHide?.();
    });
    window.addEventListener('pagehide', () => this.current?.onHide?.());
  }

  show(screen: Screen, dir: 'forward' | 'back' | 'none' = 'forward'): void {
    this.current?.destroy?.();
    this.current = screen;
    this.root.replaceChildren(screen.el);
    window.scrollTo(0, 0);
    screenIn(screen.el, dir);
  }

  commit(): void {
    save('progress', this.progress);
  }

  applySettings(): void {
    const s = this.progress.settings;
    setReduceMotion(s.reduceMotion);
    setSoundEnabled(s.sound);
    setHapticsEnabled(s.haptics);
    const dark = s.theme === 'dark' || (s.theme === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#0e2130' : '#f7f3ec');
  }

  // --- saved games -------------------------------------------------------
  // One slot each for the level she's on, a replayed older level, the daily
  // puzzle and free play, so starting one never throws another away.
  slotOf(g: Game): string {
    if (g.kind === 'level' && g.level && this.progress.levels[g.level]) return 'replay';
    return g.kind;
  }

  loadGame(slot: GameKind | 'replay'): Game | null {
    const g = load<Game | null>(`save:${slot}`, null);
    if (!g || !Array.isArray(g.values) || g.values.length !== 81 || g.done) return null;
    return g;
  }

  saveGame(g: Game): void {
    const slot = this.slotOf(g);
    if (g.done) {
      remove(`save:${slot}`);
      return;
    }
    if (g.history.length > HISTORY_CAP) g.history.splice(0, g.history.length - HISTORY_CAP);
    save(`save:${slot}`, g);
  }

  clearGame(g: Game): void {
    remove(`save:${this.slotOf(g)}`);
  }
}

export const app = new App();
