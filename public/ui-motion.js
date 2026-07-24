/**
 * Shared motion vocabulary for study + list surfaces.
 */

export const MOTION = Object.freeze({
  /** Card face leave duration (ms) — keep in sync with CSS --dur-reveal */
  faceLeaveMs: 220,
  faceEnterMs: 360,
  themeWashMs: 320,
  expandMs: 420,
  spring: 'cubic-bezier(0.34, 1.4, 0.64, 1)',
  outExpo: 'cubic-bezier(0.16, 1, 0.3, 1)',
  soft: 'cubic-bezier(0.22, 1, 0.36, 1)',
});

/** @returns {boolean} */
export function prefersReducedMotion() {
  if (typeof matchMedia !== 'function') return false;
  return matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Duration helper: collapses to ~0 under reduced motion.
 * @param {number} ms
 */
export function motionMs(ms) {
  return prefersReducedMotion() ? 1 : ms;
}

/**
 * Temporarily enable CSS theme-wash class for smooth theme transitions.
 * @param {number} [ms]
 */
export function runThemeTransition(ms = MOTION.themeWashMs) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.classList.add('theme-switching');
  const dur = motionMs(ms);
  window.setTimeout(() => root.classList.remove('theme-switching'), dur + 40);
}
