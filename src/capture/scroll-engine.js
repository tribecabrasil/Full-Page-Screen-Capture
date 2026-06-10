/**
 * Full page scroll-and-capture content script.
 * Ported from mrcoles/full-page-screen-capture-chrome-extension (MIT).
 */
(function () {
  if (window.__fpscScrollEngine) {
    return;
  }
  window.__fpscScrollEngine = true;

  const CAPTURE_DELAY = 300;
  const SCROLL_PAD = 200;

  function max(nums) {
    return Math.max.apply(
      Math,
      nums.filter((x) => x)
    );
  }

  function onMessage(data, _sender, sendResponse) {
    if (data.msg === 'scrollPage') {
      getPositions(sendResponse);
      return true;
    }
    return false;
  }

  chrome.runtime.onMessage.addListener(onMessage);

  function getScrollRoot() {
    const candidates = [
      document.scrollingElement,
      document.documentElement,
      document.body,
      document.querySelector('main'),
      document.querySelector('[role="main"]'),
      document.querySelector('.overflow-y-auto'),
      document.querySelector('[data-testid="conversation-turns"]'),
    ].filter(Boolean);

    for (const el of candidates) {
      if (el.scrollHeight > el.clientHeight + 20) {
        return el;
      }
    }
    return document.scrollingElement || document.documentElement;
  }

  function getPositions(callback) {
    const body = document.body;
    const scrollRoot = getScrollRoot();
    const originalBodyOverflowY = body ? body.style.overflowY : '';
    const originalRootOverflow = scrollRoot ? scrollRoot.style.overflow : '';
    const originalHtmlOverflow = document.documentElement.style.overflow;
    const originalScrollBehavior = document.documentElement.style.scrollBehavior;
    const originalX = window.scrollX;
    const originalY = window.scrollY;
    const originalRootScrollTop = scrollRoot ? scrollRoot.scrollTop : 0;

    if (body) {
      body.style.overflowY = 'visible';
    }
    if (scrollRoot && scrollRoot !== document.documentElement) {
      scrollRoot.style.overflow = 'visible';
    }
    document.documentElement.style.overflow = 'hidden';
    document.documentElement.style.scrollBehavior = 'auto';

    if (window.FpscFixed) {
      window.FpscFixed.prepare();
    }

    const widths = [
      document.documentElement.clientWidth,
      body ? body.scrollWidth : 0,
      document.documentElement.scrollWidth,
      body ? body.offsetWidth : 0,
      document.documentElement.offsetWidth,
      scrollRoot ? scrollRoot.scrollWidth : 0,
    ];
    const heights = [
      document.documentElement.clientHeight,
      body ? body.scrollHeight : 0,
      document.documentElement.scrollHeight,
      body ? body.offsetHeight : 0,
      document.documentElement.offsetHeight,
      scrollRoot ? scrollRoot.scrollHeight : 0,
    ];

    let fullWidth = max(widths);
    let fullHeight = max(heights);
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const arrangements = [];
    const yDelta = windowHeight - (windowHeight > SCROLL_PAD ? SCROLL_PAD : 0);
    const xDelta = windowWidth;
    let yPos = fullHeight - windowHeight;
    let xPos;

    if (fullWidth <= xDelta + 1) {
      fullWidth = xDelta;
    }

    while (yPos > -yDelta) {
      xPos = 0;
      while (xPos < fullWidth) {
        arrangements.push([xPos, yPos]);
        xPos += xDelta;
      }
      yPos -= yDelta;
    }

    const numArrangements = arrangements.length;
    const scrollableRegions = window.FpscScrollable
      ? window.FpscScrollable.findRegions()
      : [];
    const iframeMeta = window.FpscIframe ? window.FpscIframe.collect() : [];

    function cleanUp() {
      document.documentElement.style.overflow = originalHtmlOverflow;
      document.documentElement.style.scrollBehavior = originalScrollBehavior;
      if (scrollRoot) {
        scrollRoot.style.overflow = originalRootOverflow;
        if (scrollRoot !== document.documentElement) {
          scrollRoot.scrollTop = originalRootScrollTop;
        }
      }
      if (body) {
        body.style.overflowY = originalBodyOverflowY;
      }
      window.scrollTo(originalX, originalY);
      if (window.FpscFixed) {
        window.FpscFixed.restore();
      }
    }

    (function processArrangements() {
      if (!arrangements.length) {
        cleanUp();
        if (callback) {
          callback({ ok: true });
        }
        return;
      }

      const next = arrangements.shift();
      const x = next[0];
      const y = next[1];

      window.scrollTo(x, y);
      if (scrollRoot && scrollRoot !== document.documentElement) {
        scrollRoot.scrollTop = y;
      }

      if (window.FpscFixed) {
        window.FpscFixed.hideForTile(y, windowHeight);
      }

      const payload = {
        msg: 'capture',
        x: window.scrollX,
        y: window.scrollY,
        complete: (numArrangements - arrangements.length) / numArrangements,
        windowWidth,
        windowHeight,
        totalWidth: fullWidth,
        totalHeight: fullHeight,
        devicePixelRatio: window.devicePixelRatio,
        pageUrl: location.href,
        pageTitle: document.title,
        scrollableRegions,
        iframeMeta,
      };

      window.setTimeout(() => {
        const cleanUpTimeout = window.setTimeout(cleanUp, 2000);

        chrome.runtime.sendMessage(payload, (captured) => {
          window.clearTimeout(cleanUpTimeout);
          if (chrome.runtime.lastError || !captured) {
            cleanUp();
            if (callback) {
              callback({ ok: false, error: 'capture-failed' });
            }
            return;
          }
          processArrangements();
        });
      }, CAPTURE_DELAY);
    })();
  }
})();