/**
 * Icons drawn for this app: one stroke weight, round caps, slightly loose
 * curves so they feel inked rather than stamped from a kit.
 */
const wrap = (d: string, extra = '') =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" ${extra}>${d}</svg>`;

export const ICON = {
  back: wrap('<path d="M14.5 5.5 8 12l6.5 6.5"/>'),
  chevron: wrap('<path d="m9.5 6 6 6-6 6"/>'),
  undo: wrap('<path d="M8.5 5.5 4.5 9.6l4 4"/><path d="M5 9.6h9.2a5 5 0 0 1 0 10H9"/>'),
  eraser: wrap('<path d="m13.6 4.6 5.8 5.8a1.5 1.5 0 0 1 0 2.1l-6.2 6.2H8.4l-3.8-3.8a1.5 1.5 0 0 1 0-2.1l6.9-8.2a1.5 1.5 0 0 1 2.1 0Z"/><path d="m8.6 9.9 6 6"/><path d="M13 18.7h7"/>'),
  pencil: wrap('<path d="M15.2 5.3a2 2 0 0 1 2.9 0l.6.6a2 2 0 0 1 0 2.9L9.2 18.3l-4.4 1 .9-4.5 9.5-9.5Z"/><path d="m13.6 7 3.4 3.4"/>'),
  bulb: wrap('<path d="M8.6 14.6A6 6 0 1 1 15.4 14.6c-.7.6-1 1.3-1 2.1H9.6c0-.8-.3-1.5-1-2.1Z"/><path d="M9.8 19.8h4.4"/><path d="M12 9v3"/>'),
  pause: wrap('<path d="M9 6.5v11M15 6.5v11"/>'),
  play: wrap('<path d="M8.5 6.2v11.6L18 12 8.5 6.2Z"/>'),
  gear: wrap('<circle cx="12" cy="12" r="2.8"/><path d="M12 3.8v2.2M12 18v2.2M3.8 12H6M18 12h2.2M6.2 6.2l1.6 1.6M16.2 16.2l1.6 1.6M17.8 6.2l-1.6 1.6M7.8 16.2l-1.6 1.6"/>'),
  close: wrap('<path d="m6.5 6.5 11 11M17.5 6.5l-11 11"/>'),
  check: wrap('<path d="m5.5 12.6 4.2 4.2 8.8-9.4"/>'),
  lock: wrap('<rect x="6" y="10.5" width="12" height="9" rx="2"/><path d="M8.8 10.5V8a3.2 3.2 0 0 1 6.4 0v2.5"/>'),
  share: wrap('<path d="M12 14.5V4M8.3 7.3 12 3.6l3.7 3.7"/><path d="M7.5 10.5H6.3a1.3 1.3 0 0 0-1.3 1.3v7a1.3 1.3 0 0 0 1.3 1.3h11.4a1.3 1.3 0 0 0 1.3-1.3v-7a1.3 1.3 0 0 0-1.3-1.3h-1.2"/>'),
  envelope: wrap('<rect x="3.5" y="6" width="17" height="12.5" rx="1.8"/><path d="m4 7 8 6.3L20 7"/>'),
  calendar: wrap('<rect x="4" y="5.5" width="16" height="14.5" rx="2"/><path d="M4 10h16M8.5 3.5v3.5M15.5 3.5v3.5"/>'),
  path: wrap('<circle cx="6" cy="18" r="2"/><circle cx="18" cy="6" r="2"/><path d="M8 18h5.5a3 3 0 0 0 0-6h-3a3 3 0 0 1 0-6H16"/>'),
  chart: wrap('<path d="M5 19.5V10M12 19.5v-15M19 19.5v-6.5"/>'),
  dice: wrap('<rect x="4.5" y="4.5" width="15" height="15" rx="3"/><circle cx="9" cy="9" r=".6" fill="currentColor"/><circle cx="15" cy="15" r=".6" fill="currentColor"/><circle cx="12" cy="12" r=".6" fill="currentColor"/>'),
  /** Hand-drawn heart: deliberately a touch uneven. */
  heart: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12.1 20.3c-.3 0-.6-.1-.8-.3-3.9-3.1-7.7-6.3-7.8-10.4C3.4 6.9 5.3 4.7 7.9 4.6c1.7 0 3.1.9 4.1 2.4.9-1.6 2.5-2.6 4.3-2.5 2.6.2 4.4 2.5 4.2 5.3-.3 4-3.9 7.1-7.6 10.2-.2.2-.5.3-.8.3Z"/></svg>`,
  star: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3.2c.4 0 .8.2 1 .7l2 4.3 4.6.6c1 .1 1.3 1.3.6 1.9l-3.4 3.2.9 4.7c.2 1-.8 1.7-1.6 1.2L12 17.5l-4.1 2.3c-.8.5-1.8-.2-1.6-1.2l.9-4.7-3.4-3.2c-.7-.6-.4-1.8.6-1.9l4.6-.6 2-4.3c.2-.5.6-.7 1-.7Z"/></svg>`,
};
