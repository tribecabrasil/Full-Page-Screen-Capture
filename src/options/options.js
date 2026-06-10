import { applyI18n, t } from '../shared/i18n.js';
import { DEFAULT_OPTIONS, getOptions, saveOptions } from '../shared/storage.js';

applyI18n();

const fields = [
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
  await saveOptions(next);
  $('status').textContent = t('optionsSaved');
  setTimeout(() => {
    $('status').textContent = '';
  }, 2000);
}

$('jpegQuality').addEventListener('input', (event) => {
  $('jpegQualityValue').textContent = event.target.value;
});

$('save').addEventListener('click', persist);
renderCredit();
load();