import { applyI18n, initI18n } from '../shared/i18n.js';

(async () => {
  await initI18n();
  applyI18n();
})();