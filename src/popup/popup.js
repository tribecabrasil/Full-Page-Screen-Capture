import { startCapture } from '../background/capture-orchestrator.js';
import { applyI18n, initI18n, t } from '../shared/i18n.js';
import { MSG } from '../shared/messaging.js';
import { validateCaptureUrl } from '../shared/url-validator.js';

const $ = (id) => document.getElementById(id);

function showPanel(id) {
  document.querySelectorAll('.panel').forEach((panel) => {
    panel.classList.toggle('active', panel.id === id);
  });
}

function setProgress(value) {
  $('bar').style.width = `${Math.round(value * 100)}%`;
}

function setSplitText(count) {
  const label = count || t('popupSplitMultiple');
  $('split-text').textContent = t('popupSplitWarning', [String(label)]);
}

function showError(message) {
  console.error('[FPSC popup]', message);
  const detail = $('error-detail');
  if (detail) {
    detail.textContent = message || t('popupUnknownError');
  }
  showPanel('uh-oh');
}

async function init() {
  await initI18n();
  applyI18n();

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) {
    showError(t('popupNoActiveTab'));
    return;
  }

  const validation = validateCaptureUrl(tab.url);
  if (!validation.valid) {
    showPanel('invalid');
    return;
  }

  showPanel('loading');
  setProgress(0);

  chrome.runtime.onMessage.addListener((message) => {
    if (message.tabId !== tab.id) {
      return;
    }

    if (message.msg === MSG.CAPTURE_PROGRESS) {
      setProgress(message.progress || 0);
      if (message.split) {
        setSplitText(message.splitCount);
        $('split-image').classList.add('active');
      }
    }

    if (message.msg === MSG.CAPTURE_COMPLETE) {
      setProgress(1);
      showPanel('done');
    }

    if (message.msg === MSG.CAPTURE_ERROR) {
      showError(message.error);
    }
  });

  try {
    await startCapture(tab, {
      captureVisibleTab: (windowId) =>
        chrome.tabs.captureVisibleTab(windowId, { format: 'png' }),
    });
  } catch (error) {
    showError(error?.message || t('popupUnknownError'));
  }
}

init();