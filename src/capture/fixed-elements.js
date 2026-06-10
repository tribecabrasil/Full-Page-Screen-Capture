/**
 * Handle fixed and sticky elements during full-page capture.
 * Injected before scroll-engine.js
 */
(function () {
  if (window.__fpscFixedElements) {
    return;
  }
  window.__fpscFixedElements = true;

  const hidden = [];

  function isFixedLike(el) {
    const style = window.getComputedStyle(el);
    return style.position === 'fixed' || style.position === 'sticky';
  }

  window.FpscFixed = {
    prepare() {
      hidden.length = 0;
      document.querySelectorAll('*').forEach((el) => {
        if (!isFixedLike(el)) {
          return;
        }
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) {
          return;
        }
        hidden.push({
          el,
          visibility: el.style.visibility,
          opacity: el.style.opacity,
        });
      });
    },

    hideForTile(y, windowHeight) {
      hidden.forEach(({ el, visibility, opacity }) => {
        const rect = el.getBoundingClientRect();
        const inView = rect.top < windowHeight && rect.bottom > 0;
        if (y > 0 && inView) {
          el.style.visibility = 'hidden';
          el.style.opacity = '0';
        } else {
          el.style.visibility = visibility;
          el.style.opacity = opacity;
        }
      });
    },

    restore() {
      hidden.forEach(({ el, visibility, opacity }) => {
        el.style.visibility = visibility;
        el.style.opacity = opacity;
      });
      hidden.length = 0;
    },
  };
})();