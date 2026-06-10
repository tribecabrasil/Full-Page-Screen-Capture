/**
 * Draw decorative browser chrome around a screenshot.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x
 * @param {number} y
 * @param {number} width
 * @param {number} height
 * @param {string} frameType
 * @param {string} [url]
 */
export function drawBrowserFrame(ctx, x, y, width, height, frameType, url = '') {
  const chromeHeight = frameType === 'none' ? 0 : 42;
  const padding = frameType === 'none' ? 0 : 14;

  if (frameType === 'none') {
    return { offsetX: 0, offsetY: 0 };
  }

  const totalWidth = width + padding * 2;
  const totalHeight = height + padding * 2 + chromeHeight;
  const left = x - padding;
  const top = y - padding - chromeHeight;

  ctx.save();
  ctx.fillStyle = '#e7e7e7';
  ctx.strokeStyle = '#c8c8c8';
  ctx.lineWidth = 1;
  ctx.fillRect(left, top, totalWidth, totalHeight);
  ctx.strokeRect(left, top, totalWidth, totalHeight);

  if (frameType === 'mac') {
    ['#ff5f57', '#febc2e', '#28c840'].forEach((color, index) => {
      ctx.beginPath();
      ctx.fillStyle = color;
      ctx.arc(left + 18 + index * 16, top + 20, 5, 0, Math.PI * 2);
      ctx.fill();
    });
  } else {
    ctx.fillStyle = '#f3f3f3';
    ctx.fillRect(left + 8, top + 10, totalWidth - 16, 20);
  }

  if (url) {
    ctx.fillStyle = '#666';
    ctx.font = '12px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText(url, left + 70, top + 24);
  }

  ctx.restore();
  return { offsetX: padding, offsetY: padding + chromeHeight };
}