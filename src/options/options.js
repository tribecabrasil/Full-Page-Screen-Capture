import { applyI18n, initI18n, loadLocale, t } from '../shared/i18n.js';
import { LOCALE_AUTO, SUPPORTED_LOCALES } from '../shared/locales.js';
import { applyTheme, initTheme } from '../shared/theme.js';
import { DEFAULT_OPTIONS, getOptions, saveOptions } from '../shared/storage.js';

const fields = [
  'theme',
  'locale',
  'defaultCaptureMode',
  'captureDelay',
  'imageFormat',
  'jpegQuality',
  'autoDownload',
  'saveAsDialog',
  'pdfPaperSize',
  'pdfOrientation',
  'pdfSmartSplit',
  'browserFrame',
  'urlPlacement',
  'showDateStamp',
  'showWelcome',
];

function $(id) {
  return document.getElementById(id);
}

function populateLocaleSelect(selected = LOCALE_AUTO) {
  const select = $('locale');
  select.innerHTML = '';

  const autoOption = document.createElement('option');
  autoOption.value = LOCALE_AUTO;
  autoOption.textContent = t('optionsLanguageAuto');
  select.appendChild(autoOption);

  SUPPORTED_LOCALES.forEach(({ code, nativeName }) => {
    const option = document.createElement('option');
    option.value = code;
    option.textContent = nativeName;
    select.appendChild(option);
  });

  select.value = selected || LOCALE_AUTO;
}

function renderCredit() {
  const credit = $('options-credit');
  const linkText = t('optionsCreditLink');
  const message = t('optionsCredit', [linkText]);
  const index = message.indexOf(linkText);
  credit.textContent = '';

  if (index < 0) {
    credit.textContent = message;
    return;
  }

  credit.append(document.createTextNode(message.slice(0, index)));
  const link = document.createElement('a');
  link.href = 'https://github.com/mrcoles/full-page-screen-capture-chrome-extension';
  link.target = '_blank';
  link.rel = 'noopener';
  link.textContent = linkText;
  credit.appendChild(link);
  credit.append(document.createTextNode(message.slice(index + linkText.length)));
}

async function applyLocaleFromSelect() {
  const locale = $('locale').value;
  try {
    await loadLocale(locale);
  } catch {
    await loadLocale(LOCALE_AUTO);
    $('locale').value = LOCALE_AUTO;
  }
  applyI18n();
  populateLocaleSelect($('locale').value);
  renderCredit();
}

async function load() {
  const options = await getOptions();
  fields.forEach((key) => {
    const el = $(key);
    if (!el) {
      return;
    }
    if (el.type === 'checkbox') {
      el.checked = Boolean(options[key]);
    } else {
      el.value = options[key] ?? DEFAULT_OPTIONS[key];
    }
  });
  $('jpegQualityValue').textContent = String(options.jpegQuality);
  populateLocaleSelect(options.locale || LOCALE_AUTO);
  applyTheme(options.theme || 'system');
}

async function persist() {
  const next = {};
  fields.forEach((key) => {
    const el = $(key);
    if (!el) {
      return;
    }
    next[key] = el.type === 'checkbox' ? el.checked : el.value;
  });
  next.jpegQuality = Number(next.jpegQuality);
  next.captureDelay = Number(next.captureDelay);
  await saveOptions(next);
  await loadLocale(next.locale || '');
  applyTheme(next.theme || 'system');
  $('status').textContent = t('optionsSaved');
  setTimeout(() => {
    $('status').textContent = '';
  }, 2000);
}

async function bootstrap() {
  await Promise.all([initI18n(), initTheme()]);
  applyI18n();
  populateLocaleSelect();
  renderCredit();
  await load();
}

$('jpegQuality').addEventListener('input', (event) => {
  $('jpegQualityValue').textContent = event.target.value;
});

$('theme').addEventListener('change', async () => {
  applyTheme($('theme').value);
  const options = await getOptions();
  await saveOptions({ ...options, theme: $('theme').value });
});

$('locale').addEventListener('change', async () => {
  await applyLocaleFromSelect();
  const options = await getOptions();
  await saveOptions({ ...options, locale: $('locale').value });
});

$('save').addEventListener('click', persist);
bootstrap();