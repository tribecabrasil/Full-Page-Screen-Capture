import { startCapture } from '../background/capture-orchestrator.js';
import { applyI18n, initI18n, t } from '../shared/i18n.js';
import { initTheme } from '../shared/theme.js';
import { MSG } from '../shared/messaging.js';
import { getOptions } from '../shared/storage.js';
import { validateCaptureUrl } from '../shared/url-validator.js';

const $ = (id) => document.getElementById(id);

let activeTab = null;
let captureStarted = false;

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

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function setupMessageListener() {
  chrome.runtime.onMessage.addListener((message) => {
    if (!activeTab || message.tabId !== activeTab.id) {
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
}

async function runCountdown(seconds) {
  showPanel('countdown');
  for (let remaining = seconds; remaining > 0; remaining -= 1) {
    $('countdown-text').textContent = t('popupCountdown', [String(remaining)]);
    await sleep(1000);
  }
}

async function runCapture(mode) {
  if (captureStarted || !activeTab) {
    return;
  }
  captureStarted = true;

  const options = await getOptions();
  const delay = Number(options.captureDelay || 0);
  if (delay > 0) {
    await runCountdown(delay);
  }

  showPanel('loading');
  setProgress(0);
  $('split-image').classList.remove('active');

  try {
    await startCapture(activeTab, {
      mode,
      captureVisibleTab: (windowId) =>
        chrome.tabs.captureVisibleTab(windowId, { format: 'png' }),
    });
  } catch (error) {
    showError(error?.message || t('popupUnknownError'));
  }
}

async function init() {
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

  activeTab = tab;
  setupMessageListener();
  showPanel('choose');

  $('capture-full').addEventListener('click', () => runCapture('full'));
  $('capture-visible').addEventListener('click', () => runCapture('visible'));
}

(async () => {
  await Promise.all([initI18n(), initTheme()]);
  applyI18n();
  await init();
})();