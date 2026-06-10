import { OFFSCREEN_JUSTIFICATION, OFFSCREEN_REASON } from '../shared/constants.js';
import { MSG } from '../shared/messaging.js';

let creating = null;

async function hasOffscreenDocument() {
  if (!chrome.offscreen) {
    return false;
  }
  const contexts = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT'],
    documentUrls: [chrome.runtime.getURL('src/offscreen/offscreen.html')],
  });
  return contexts.length > 0;
}

export async function ensureOffscreenDocument() {
  if (await hasOffscreenDocument()) {
    return;
  }

  if (creating) {
    await creating;
    return;
  }

  creating = chrome.offscreen.createDocument({
    url: 'src/offscreen/offscreen.html',
    reasons: [OFFSCREEN_REASON],
    justification: OFFSCREEN_JUSTIFICATION,
  });

  await creating;
  creating = null;
}

function sendToOffscreen(message) {
  return chrome.runtime.sendMessage({ ...message, target: 'offscreen' });
}

async function waitForOffscreenReady(maxAttempts = 30) {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const response = await sendToOffscreen({ msg: MSG.STITCH_INIT });
    if (response?.ok) {
      return response;
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error('offscreen-not-ready');
}

function assertOk(response, fallbackError) {
  if (!response?.ok) {
    throw new Error(response?.error || fallbackError);
  }
  return response;
}

export async function initStitcher() {
  await ensureOffscreenDocument();
  return waitForOffscreenReady();
}

export async function stitchTile(data, dataURI) {
  await ensureOffscreenDocument();
  const response = await sendToOffscreen({ msg: MSG.STITCH_TILE, data, dataURI });
  return assertOk(response, 'stitch-tile-failed');
}

export async function finishStitch(format, quality) {
  await ensureOffscreenDocument();
  const response = await sendToOffscreen({ msg: MSG.STITCH_FINISH, format, quality });
  return assertOk(response, 'stitch-finish-failed');
}