import { startCapture } from './capture-orchestrator.js';
import { MSG } from '../shared/messaging.js';
import { getOptions } from '../shared/storage.js';

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

chrome.commands.onCommand.addListener(async (command) => {
  if (command !== '_execute_action') {
    return;
  }

  const tab = await getActiveTab();
  if (!tab?.id) {
    return;
  }

  try {
    const options = await getOptions();
    await startCapture(tab, { mode: options.defaultCaptureMode || 'full' });
  } catch (error) {
    console.error('[FPSC] shortcut capture failed:', error);
  }
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.target === 'offscreen') {
    return false;
  }

  if (message.msg === MSG.START_CAPTURE) {
    sendResponse({ ok: true, started: true });

    (async () => {
      try {
        const tab = message.tabId
          ? await chrome.tabs.get(message.tabId)
          : await getActiveTab();
        const options = await getOptions();
        const mode = message.mode || options.defaultCaptureMode || 'full';
        await startCapture(tab, { mode });
      } catch (error) {
        console.error('[FPSC] background capture failed:', error);
      }
    })();

    return false;
  }

  return false;
});

chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason !== 'install') {
    return;
  }
  const options = await getOptions();
  if (options.showWelcome) {
    chrome.tabs.create({
      url: chrome.runtime.getURL('src/welcome/welcome.html'),
    });
  }
});