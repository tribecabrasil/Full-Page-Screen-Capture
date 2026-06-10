/**
 * Detect inner scrollable regions for advanced capture.
 */
(function () {
  if (window.__fpscScrollable) {
    return;
  }
  window.__fpscScrollable = true;

  function isScrollable(el) {
    const style = window.getComputedStyle(el);
    const overflowY = style.overflowY;
    const canScroll =
      overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay';
    return canScroll && el.scrollHeight > el.clientHeight + 4;
  }

  window.FpscScrollable = {
    findRegions() {
      const regions = [];
      document.querySelectorAll('*').forEach((el) => {
        if (!isScrollable(el)) {
          return;
        }
        const rect = el.getBoundingClientRect();
        if (rect.width < 40 || rect.height < 40) {
          return;
        }
        regions.push({
          el,
          top: rect.top + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width,
          height: rect.height,
          scrollHeight: el.scrollHeight,
        });
      });
      return regions;
    },
  };
})();