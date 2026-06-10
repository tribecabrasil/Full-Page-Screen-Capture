import { captureWithRateLimit } from '../shared/capture-rate-limiter.js';
import { getFilename } from '../shared/filename.js';
import { MSG } from '../shared/messaging.js';
import { getCapture, getOptions, saveCapture } from '../shared/storage.js';
import { validateCaptureUrl } from '../shared/url-validator.js';
import { keepAliveDuringCapture } from './keepalive.js';
import { finishStitch, initStitcher, stitchTile } from './offscreen-manager.js';

const CAPTURE_FILES = [
  'src/capture/fixed-elements.js',
  'src/capture/scrollable-regions.js',
  'src/capture/iframe-capture.js',
  'src/capture/scroll-engine.js',
];

/** @type {Map<number, object>} */
const activeCaptures = new Map();

function mimeForFormat(format) {
  return format === 'jpeg' ? 'image/jpeg' : 'image/png';
}

function qualityForFormat(format, options) {
  if (format === 'jpeg') {
    return (options.jpegQuality || 92) / 100;
  }
  return undefined;
}

async function injectCaptureScripts(tabId) {
  await chrome.scripting.executeScript({
    target: { tabId, allFrames: false },
    files: CAPTURE_FILES,
  });
}

function broadcastProgress(tabId, progress, extra = {}) {
  chrome.runtime.sendMessage({
    msg: MSG.CAPTURE_PROGRESS,
    tabId,
    progress,
    ...extra,
  }).catch(() => {});
}

function broadcastError(tabId, error) {
  console.error('[FPSC] capture failed:', error);
  chrome.runtime.sendMessage({
    msg: MSG.CAPTURE_ERROR,
    tabId,
    error: error?.message || String(error),
  }).catch(() => {});
}

async function openResultTabs(captureIds, sourceTab, split) {
  const base = chrome.runtime.getURL('src/result/result.html');
  let resultWindowId = null;

  for (let i = 0; i < captureIds.length; i++) {
    const id = captureIds[i];
    const url = `${base}?id=${encodeURIComponent(id)}&part=${i + 1}&parts=${captureIds.length}`;
    const isLast = i === captureIds.length - 1;

    if (sourceTab.incognito && i === 0) {
      const win = await chrome.windows.create({
        url,
        incognito: false,
        focused: isLast,
      });
      resultWindowId = win.id;
    } else {
      await chrome.tabs.create({
        url,
        active: isLast,
        windowId: resultWindowId || undefined,
        openerTabId: sourceTab.id,
        index: (sourceTab.incognito ? 0 : sourceTab.index) + 1 + i,
      });
    }
  }

  if (split) {
    broadcastProgress(sourceTab.id, 1, { split: true, parts: captureIds.length });
  }
}

async function maybeAutoDownload(captureId, filename, options) {
  if (!options.autoDownload) {
    return;
  }

  const record = await getCapture(captureId);
  if (!record || !record.parts?.[0]?.dataUrl) {
    return;
  }

  const hasDownloads = await chrome.permissions.contains({ permissions: ['downloads'] });
  if (hasDownloads) {
    await chrome.downloads.download({
      url: record.parts[0].dataUrl,
      filename,
      saveAs: options.saveAsDialog,
    });
  }
}

/**
 * Run a full-page capture.
 * Must be called from a context that still holds activeTab (popup or command handler).
 * @param {chrome.tabs.Tab} tab
 * @param {object} [hooks]
 * @param {Function} [hooks.captureVisibleTab]
 */
export async function startCapture(tab, hooks = {}) {
  const validation = validateCaptureUrl(tab.url);
  if (!validation.valid) {
    throw new Error(validation.reason || 'invalid-url');
  }

  if (!tab?.id) {
    throw new Error('missing-tab');
  }

  if (activeCaptures.has(tab.id)) {
    throw new Error('capture-in-progress');
  }

  const captureVisibleTab =
    hooks.captureVisibleTab ||
    ((windowId) => chrome.tabs.captureVisibleTab(windowId, { format: 'png' }));

  const state = {
    tab,
    split: false,
    splitCount: 1,
    pageUrl: tab.url,
    pageTitle: tab.title,
  };
  activeCaptures.set(tab.id, state);
  keepAliveDuringCapture(true);

  try {
    const options = await getOptions();
    await initStitcher();
    await injectCaptureScripts(tab.id);

    const stitchResult = await new Promise((resolve, reject) => {
      const onMessage = (request, sender, sendResponse) => {
        if (sender.tab?.id !== tab.id) {
          return false;
        }

        if (request.msg === MSG.CAPTURE) {
          (async () => {
            try {
              broadcastProgress(tab.id, request.complete, {
                split: state.split,
                splitCount: state.splitCount,
              });

              const dataURI = await captureWithRateLimit(() =>
                captureVisibleTab(tab.windowId)
              );

              const stitchResponse = await stitchTile(request, dataURI);
              if (stitchResponse.split && !state.split) {
                state.split = true;
                state.splitCount = stitchResponse.count;
                broadcastProgress(tab.id, request.complete, {
                  split: true,
                  splitCount: stitchResponse.count,
                });
              }

              sendResponse(true);
            } catch (error) {
              reject(error);
              sendResponse(false);
            }
          })();
          return true;
        }

        return false;
      };

      chrome.runtime.onMessage.addListener(onMessage);

      chrome.tabs.sendMessage(tab.id, { msg: MSG.SCROLL_PAGE }, async (response) => {
        chrome.runtime.onMessage.removeListener(onMessage);

        if (chrome.runtime.lastError) {
          reject(new Error(`scroll-message-failed: ${chrome.runtime.lastError.message}`));
          return;
        }

        if (!response?.ok) {
          reject(new Error('scroll-failed'));
          return;
        }

        try {
          const format = mimeForFormat(options.imageFormat);
          const quality = qualityForFormat(options.imageFormat, options);
          const finished = await finishStitch(format, quality);
          const result = finished.result || finished;
          if (!result?.parts?.length) {
            throw new Error('stitch-empty-result');
          }
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
    });

    const filename = getFilename(tab.url, options.imageFormat === 'jpeg' ? 'jpg' : 'png');
    const captureIds = [];

    for (const part of stitchResult.parts) {
      const id = await saveCapture({
        pageUrl: tab.url,
        pageTitle: tab.title,
        filename,
        split: stitchResult.split,
        partIndex: part.index,
        partCount: stitchResult.parts.length,
        totalWidth: stitchResult.totalWidth,
        totalHeight: stitchResult.totalHeight,
        parts: [part],
        options,
      });
      captureIds.push(id);
      await maybeAutoDownload(id, filename, options);
    }

    await openResultTabs(captureIds, tab, stitchResult.split);

    chrome.runtime.sendMessage({
      msg: MSG.CAPTURE_COMPLETE,
      tabId: tab.id,
      captureIds,
    }).catch(() => {});

    return captureIds;
  } catch (error) {
    broadcastError(tab.id, error);
    throw error;
  } finally {
    activeCaptures.delete(tab.id);
    keepAliveDuringCapture(false);
  }
}

export function getCaptureState(tabId) {
  return activeCaptures.get(tabId) || null;
}