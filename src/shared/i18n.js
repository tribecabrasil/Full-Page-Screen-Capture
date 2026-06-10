/**
 * Chrome extension i18n helpers with optional user-selected locale override.
 */

import { getOptions } from './storage.js';

/** @type {Record<string, { message: string, placeholders?: Record<string, { content: string }> }> | null} */
let messages = null;

/** @type {string | null} */
let activeLocale = null;

/**
 * @param {{ message?: string, placeholders?: Record<string, { content: string }> }} entry
 * @param {string[]} [substitutions]
 * @returns {string}
 */
function formatMessage(entry, substitutions) {
  let message = entry.message || '';
  if (!substitutions?.length || !entry.placeholders) {
    return message;
  }

  Object.entries(entry.placeholders).forEach(([name, spec]) => {
    const match = spec.content.match(/^\$(\d+)$/);
    if (!match) {
      return;
    }
    const value = substitutions[Number(match[1]) - 1] ?? '';
    message = message.replaceAll(`$${name.toUpperCase()}$`, value);
    message = message.replaceAll(`$${name}$`, value);
  });

  return message;
}

/**
 * @param {string} locale
 */
export async function loadLocale(locale) {
  if (!locale) {
    messages = null;
    activeLocale = null;
    return;
  }

  const url = chrome.runtime.getURL(`_locales/${locale}/messages.json`);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`locale-load-failed:${locale}`);
  }

  messages = await response.json();
  activeLocale = locale;
}

/**
 * Load messages for the locale saved in extension options.
 */
export async function initI18n() {
  try {
    const options = await getOptions();
    await loadLocale(options.locale || '');
  } catch {
    messages = null;
    activeLocale = null;
  }
}

/**
 * @returns {string | null}
 */
export function getActiveLocale() {
  return activeLocale;
}

/**
 * @param {string} key
 * @param {string[]} [substitutions]
 * @returns {string}
 */
export function t(key, substitutions) {
  if (messages?.[key]) {
    return formatMessage(messages[key], substitutions) || key;
  }

  const message = chrome.i18n.getMessage(key, substitutions);
  return message || key;
}

/**
 * @param {ParentNode} [root]
 */
export function applyI18n(root = document) {
  const titleKey = document.documentElement.dataset.i18nTitle;
  if (titleKey) {
    document.title = t(titleKey);
  }

  root.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.dataset.i18n;
    const attr = el.dataset.i18nAttr;
    const message = t(key);
    if (attr) {
      el.setAttribute(attr, message);
    } else {
      el.textContent = message;
    }
  });

  root.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });

  root.querySelectorAll('[data-i18n-html]').forEach((el) => {
    el.innerHTML = t(el.dataset.i18nHtml);
  });
}