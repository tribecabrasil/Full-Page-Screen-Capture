/** Message types used across extension contexts. */

export const MSG = {
  SCROLL_PAGE: 'scrollPage',
  CAPTURE: 'capture',
  CAPTURE_PROGRESS: 'captureProgress',
  CAPTURE_COMPLETE: 'captureComplete',
  CAPTURE_ERROR: 'captureError',
  CAPTURE_SPLIT: 'captureSplit',
  STITCH_TILE: 'stitchTile',
  STITCH_INIT: 'stitchInit',
  STITCH_FINISH: 'stitchFinish',
  START_CAPTURE: 'startCapture',
  GET_CAPTURE_STATUS: 'getCaptureStatus',
};

export function sendToTab(tabId, message) {
  return chrome.tabs.sendMessage(tabId, message).catch(() => null);
}

export function sendRuntime(message) {
  return chrome.runtime.sendMessage(message);
}