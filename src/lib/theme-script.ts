/**
 * Inline script injected into <head> by next/script (strategy="beforeInteractive").
 * Runs before first paint to apply the saved theme, preventing a flash of the
 * wrong theme (FOUC). Because it runs via next/script it does not trigger
 * React's "Encountered a script tag while rendering React component" warning.
 */
export const THEME_INIT_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem('theme') || 'system';
    var dark =
      stored === 'dark' ||
      (stored === 'system' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches);
    var el = document.documentElement;
    if (dark) el.classList.add('dark');
    else el.classList.remove('dark');
    el.style.colorScheme = dark ? 'dark' : 'light';
  } catch (e) {}
})();
`;
