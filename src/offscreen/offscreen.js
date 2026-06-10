import { CanvasStitcher } from '../stitch/canvas-stitcher.js';
import { MSG } from '../shared/messaging.js';

const stitcher = new CanvasStitcher();

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.target !== 'offscreen') {
    return false;
  }

  (async () => {
    try {
      if (message.msg === MSG.STITCH_INIT) {
        stitcher.reset();
        sendResponse({ ok: true });
        return;
      }

      if (message.msg === MSG.STITCH_TILE) {
        const meta = await stitcher.drawTile(message.data, message.dataURI);
        sendResponse({ ok: true, ...meta });
        return;
      }

      if (message.msg === MSG.STITCH_FINISH) {
        const result = await stitcher.finish(message.format, message.quality);
        sendResponse({ ok: true, result });
        return;
      }

      sendResponse({ ok: false, error: 'unknown-message' });
    } catch (error) {
      sendResponse({ ok: false, error: error.message });
    }
  })();

  return true;
});