/**
 * Chrome extension i18n helpers.
 */

export function t(key, substitutions) {
  const message = chrome.i18n.getMessage(key, substitutions);
  return message || key;
}

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