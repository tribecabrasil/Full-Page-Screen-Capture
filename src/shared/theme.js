import { getOptions, saveOptions } from './storage.js';

const THEME_CYCLE = ['system', 'light', 'dark'];

/** @type {MediaQueryList | null} */
let colorSchemeQuery = null;

/** @param {(event: MediaQueryListEvent) => void} listener */
let colorSchemeListener = null;

/**
 * @param {string} [preference]
 * @returns {'light' | 'dark'}
 */
export function resolveTheme(preference) {
  if (preference === 'light' || preference === 'dark') {
    return preference;
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * @param {string} [preference]
 * @returns {'light' | 'dark'}
 */
export function applyTheme(preference) {
  const resolved = resolveTheme(preference);
  document.documentElement.dataset.theme = resolved;
  document.documentElement.dataset.themePreference = preference || 'system';
  return resolved;
}

function watchSystemTheme() {
  if (colorSchemeQuery && colorSchemeListener) {
    colorSchemeQuery.removeEventListener('change', colorSchemeListener);
  }

  colorSchemeQuery = window.matchMedia('(prefers-color-scheme: dark)');
  colorSchemeListener = async () => {
    const options = await getOptions();
    if ((options.theme || 'system') === 'system') {
      applyTheme('system');
    }
  };
  colorSchemeQuery.addEventListener('change', colorSchemeListener);
}

let storageListenerAttached = false;

function attachStorageListener() {
  if (storageListenerAttached) {
    return;
  }
  storageListenerAttached = true;

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'sync' || !changes.fpscOptions?.newValue) {
      return;
    }
    const theme = changes.fpscOptions.newValue.theme;
    if (theme !== undefined) {
      applyTheme(theme || 'system');
    }
  });
}

export async function initTheme() {
  const options = await getOptions();
  applyTheme(options.theme || 'system');
  watchSystemTheme();
  attachStorageListener();
}

/**
 * Cycle theme preference: system → light → dark → system.
 * @returns {Promise<string>}
 */
export async function cycleTheme() {
  const options = await getOptions();
  const current = options.theme || 'system';
  const index = THEME_CYCLE.indexOf(current);
  const next = THEME_CYCLE[(index + 1 + THEME_CYCLE.length) % THEME_CYCLE.length];
  await saveOptions({ ...options, theme: next });
  applyTheme(next);
  return next;
}

/**
 * @param {HTMLButtonElement} button
 * @param {string} preference
 */
export function updateThemeToggleButton(button, preference) {
  if (!button) {
    return;
  }
  const icons = { system: '◐', light: '☀', dark: '☾' };
  button.textContent = icons[preference] || icons.system;
  button.dataset.themePreference = preference || 'system';
}