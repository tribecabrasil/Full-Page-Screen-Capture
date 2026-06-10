import { MIN_CAPTURE_INTERVAL_MS } from './constants.js';

let lastCaptureAt = 0;
let queue = Promise.resolve();

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isQuotaError(error) {
  const message = error?.message || String(error);
  return message.includes('MAX_CAPTURE_VISIBLE_TAB_CALLS_PER_SECOND');
}

/**
 * Serialize captureVisibleTab calls to respect Chrome's per-second quota.
 * @param {() => Promise<string|undefined>} captureFn
 * @returns {Promise<string>}
 */
export function captureWithRateLimit(captureFn) {
  const run = async () => {
    const elapsed = Date.now() - lastCaptureAt;
    if (elapsed < MIN_CAPTURE_INTERVAL_MS) {
      await sleep(MIN_CAPTURE_INTERVAL_MS - elapsed);
    }

    const maxRetries = 6;
    for (let attempt = 0; attempt < maxRetries; attempt += 1) {
      try {
        const dataUrl = await captureFn();
        if (!dataUrl) {
          throw new Error('capture-visible-failed');
        }
        lastCaptureAt = Date.now();
        return dataUrl;
      } catch (error) {
        if (!isQuotaError(error) || attempt === maxRetries - 1) {
          throw error;
        }
        await sleep(MIN_CAPTURE_INTERVAL_MS * (attempt + 1));
      }
    }

    throw new Error('capture-visible-failed');
  };

  const next = queue.then(run, run);
  queue = next.catch(() => {});
  return next;
}