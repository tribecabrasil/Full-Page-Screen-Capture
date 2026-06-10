const BLOCKED_PATTERNS = [
  /^chrome:\/\//,
  /^chrome-extension:\/\//,
  /^chrome-search:\/\//,
  /^chrome-devtools:\/\//,
  /^https?:\/\/chrome\.google\.com\/webstore/,
  /^https?:\/\/chromewebstore\.google\.com/,
  /^about:/,
  /^edge:\/\//,
  /^brave:\/\//,
  /^opera:\/\//,
  /^vivaldi:\/\//,
];

const ALLOWED_SCHEMES = /^(https?|ftp|file):/;

/**
 * Check whether a tab URL can be captured.
 * @param {string} url
 * @returns {{ valid: boolean, reason?: string }}
 */
export function validateCaptureUrl(url) {
  if (!url) {
    return { valid: false, reason: 'no-url' };
  }

  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(url)) {
      return { valid: false, reason: 'restricted' };
    }
  }

  if (!ALLOWED_SCHEMES.test(url)) {
    return { valid: false, reason: 'unsupported' };
  }

  return { valid: true };
}