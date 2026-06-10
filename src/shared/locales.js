/** @typedef {{ code: string, nativeName: string }} LocaleOption */

/** @type {LocaleOption[]} */
export const SUPPORTED_LOCALES = [
  { code: 'en', nativeName: 'English' },
  { code: 'pt_BR', nativeName: 'Português (Brasil)' },
  { code: 'es', nativeName: 'Español' },
  { code: 'hi', nativeName: 'हिन्दी' },
  { code: 'fr', nativeName: 'Français' },
  { code: 'it', nativeName: 'Italiano' },
  { code: 'de', nativeName: 'Deutsch' },
  { code: 'ja', nativeName: '日本語' },
  { code: 'zh_CN', nativeName: '简体中文' },
];

export const LOCALE_AUTO = '';