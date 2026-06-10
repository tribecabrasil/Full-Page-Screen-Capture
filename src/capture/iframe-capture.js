/**
 * Collect same-origin iframe metadata for capture composition.
 */
(function () {
  if (window.__fpscIframe) {
    return;
  }
  window.__fpscIframe = true;

  window.FpscIframe = {
    collect() {
      const frames = [];
      document.querySelectorAll('iframe').forEach((iframe) => {
        try {
          const rect = iframe.getBoundingClientRect();
          if (rect.width < 2 || rect.height < 2) {
            return;
          }
          const doc = iframe.contentDocument;
          if (!doc) {
            return;
          }
          frames.push({
            src: iframe.src,
            top: rect.top + window.scrollY,
            left: rect.left + window.scrollX,
            width: rect.width,
            height: rect.height,
            scrollHeight: Math.max(
              doc.documentElement.scrollHeight,
              doc.body ? doc.body.scrollHeight : 0
            ),
          });
        } catch (_err) {
          // Cross-origin iframe — cannot access.
        }
      });
      return frames;
    },
  };
})();