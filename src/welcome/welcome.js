import { applyI18n, initI18n } from '../shared/i18n.js';
import { initTheme } from '../shared/theme.js';

(async () => {
  await Promise.all([initI18n(), initTheme()]);
  applyI18n();
})();