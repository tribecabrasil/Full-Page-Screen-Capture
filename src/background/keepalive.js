let captureKeepAlive = null;

export function keepAliveDuringCapture(active) {
  if (active) {
    if (captureKeepAlive) {
      return;
    }
    captureKeepAlive = setInterval(() => {
      chrome.runtime.getPlatformInfo(() => {});
    }, 20000);
    return;
  }
  if (captureKeepAlive) {
    clearInterval(captureKeepAlive);
    captureKeepAlive = null;
  }
}