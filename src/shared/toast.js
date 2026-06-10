let hideTimer = null;

/**
 * Show a short-lived toast message.
 * @param {string} message
 * @param {number} [durationMs]
 */
export function showToast(message, durationMs = 2400) {
  let toast = document.getElementById('fpsc-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'fpsc-toast';
    toast.className = 'fpsc-toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.classList.add('visible');

  if (hideTimer) {
    clearTimeout(hideTimer);
  }
  hideTimer = setTimeout(() => {
    toast.classList.remove('visible');
  }, durationMs);
}