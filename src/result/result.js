import { copyImageToClipboard, dataUrlWithFormat, downloadImage } from '../export/png-jpeg.js';
import { exportToPdf } from '../export/pdf-export.js';
import { addPartSuffix } from '../shared/filename.js';
import { applyI18n, initI18n, t } from '../shared/i18n.js';
import {
  cycleTheme,
  initTheme,
  updateThemeToggleButton,
} from '../shared/theme.js';
import { showToast } from '../shared/toast.js';
import { deleteCapture, getCapture, getOptions } from '../shared/storage.js';

const params = new URLSearchParams(location.search);
const captureId = params.get('id');
const part = Number(params.get('part') || 1);
const parts = Number(params.get('parts') || 1);

const imageEl = document.getElementById('capture-image');
const metaEl = document.getElementById('meta');
const menuEl = document.getElementById('menu');
const reportDialog = document.getElementById('report-dialog');

let record = null;
let options = null;

async function loadCapture() {
  if (!captureId) {
    metaEl.textContent = t('resultMissingId');
    return;
  }

  record = await getCapture(captureId);
  options = await getOptions();

  if (!record?.parts?.[0]?.dataUrl) {
    metaEl.textContent = t('resultNotFound');
    return;
  }

  const dataUrl = record.parts[0].dataUrl;
  imageEl.src = dataUrl;
  document.title =
    parts > 1
      ? t('resultTitlePart', [String(part), String(parts)])
      : t('resultTitle');

  metaEl.textContent = [
    record.pageTitle || t('resultUntitled'),
    record.pageUrl,
    parts > 1 ? t('resultPartMeta', [String(part), String(parts)]) : null,
    `${record.parts[0].width}×${record.parts[0].height}px`,
  ]
    .filter(Boolean)
    .join(' · ');
}

function filenameForRecord() {
  const ext = options.imageFormat === 'jpeg' ? 'jpg' : 'png';
  const base = record.filename || `screencapture-${Date.now()}.${ext}`;
  return addPartSuffix(base, record.partIndex || 0);
}

async function handleDownload() {
  let dataUrl = record.parts[0].dataUrl;
  if (options.imageFormat === 'jpeg') {
    dataUrl = await dataUrlWithFormat(dataUrl, 'jpeg', (options.jpegQuality || 92) / 100);
  }
  await downloadImage(dataUrl, filenameForRecord(), options);
}

document.getElementById('btn-download').addEventListener('click', handleDownload);

const pdfButton = document.getElementById('btn-pdf');
const pdfStatus = document.getElementById('pdf-status');

pdfButton.addEventListener('click', async () => {
  if (pdfButton.disabled) {
    return;
  }

  pdfButton.disabled = true;
  pdfStatus.hidden = false;
  pdfStatus.textContent = t('pdfPreparing');

  try {
    await exportToPdf(
      record.parts[0].dataUrl,
      filenameForRecord(),
      { ...options, pageUrl: record.pageUrl },
      ({ page, total }) => {
        pdfStatus.textContent = t('pdfGenerating', [String(page), String(total)]);
      }
    );
    pdfStatus.textContent = t('pdfSaved');
  } catch (error) {
    console.error('[FPSC] PDF export failed:', error);
    pdfStatus.textContent = error?.message || t('pdfFailed');
  } finally {
    pdfButton.disabled = false;
    setTimeout(() => {
      pdfStatus.hidden = true;
      pdfStatus.textContent = '';
    }, 4000);
  }
});

document.getElementById('btn-edit').addEventListener('click', () => {
  const url = chrome.runtime.getURL(
    `src/editor/editor.html?id=${encodeURIComponent(captureId)}`
  );
  chrome.tabs.create({ url });
});

document.getElementById('btn-delete').addEventListener('click', async () => {
  await deleteCapture(captureId);
  window.close();
});

document.getElementById('btn-settings').addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

document.getElementById('btn-open-options').addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

document.getElementById('btn-menu').addEventListener('click', () => {
  menuEl.hidden = !menuEl.hidden;
});

document.getElementById('btn-copy').addEventListener('click', async () => {
  try {
    await copyImageToClipboard(record.parts[0].dataUrl);
    showToast(t('toastCopied'));
  } catch (error) {
    console.error('[FPSC] copy failed:', error);
    showToast(t('toastCopyFailed'));
  }
  menuEl.hidden = true;
});

document.getElementById('theme-toggle').addEventListener('click', async () => {
  const next = await cycleTheme();
  updateThemeToggleButton(document.getElementById('theme-toggle'), next);
});

document.getElementById('btn-report').addEventListener('click', () => {
  reportDialog.showModal();
});

reportDialog.addEventListener('close', () => {
  if (reportDialog.returnValue !== 'send') {
    return;
  }
  const text = document.getElementById('report-text').value.trim();
  const subject = encodeURIComponent(t('reportSubject'));
  const body = encodeURIComponent(
    [
      text,
      '',
      `${t('reportBodyUrl')}: ${record.pageUrl}`,
      `${t('reportBodyExtension')}: ${chrome.runtime.getManifest().version}`,
      `${t('reportBodyUserAgent')}: ${navigator.userAgent}`,
    ].join('\n')
  );
  window.location.href = `mailto:flvp@me.com?subject=${subject}&body=${body}`;
});

document.addEventListener('keydown', (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
    event.preventDefault();
    handleDownload();
  }
});

(async () => {
  await Promise.all([initI18n(), initTheme()]);
  applyI18n();
  await loadCapture();
  const themeOptions = options || (await getOptions());
  updateThemeToggleButton(
    document.getElementById('theme-toggle'),
    themeOptions.theme || 'system'
  );
})();