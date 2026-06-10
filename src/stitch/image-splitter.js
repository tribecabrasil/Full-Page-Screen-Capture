import {
  MAX_AREA,
  MAX_PRIMARY_DIMENSION,
  MAX_SECONDARY_DIMENSION,
} from '../shared/constants.js';

function createCanvas(width, height) {
  if (typeof document !== 'undefined') {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas;
  }
  return new OffscreenCanvas(width, height);
}

export function canvasToBlob(canvas, type, quality) {
  if (typeof canvas.convertToBlob === 'function') {
    return canvas.convertToBlob({ type, quality });
  }
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
        return;
      }
      reject(new Error('canvas-to-blob-failed'));
    }, type, quality);
  });
}

/**
 * Create screenshot canvas slots for a full-page image.
 * @param {number} totalWidth
 * @param {number} totalHeight
 * @returns {Array<object>}
 */
export function initScreenshots(totalWidth, totalHeight) {
  const badSize =
    totalHeight > MAX_PRIMARY_DIMENSION ||
    totalWidth > MAX_PRIMARY_DIMENSION ||
    totalHeight * totalWidth > MAX_AREA;

  const biggerWidth = totalWidth > totalHeight;
  const maxWidth = badSize
    ? biggerWidth
      ? MAX_PRIMARY_DIMENSION
      : MAX_SECONDARY_DIMENSION
    : totalWidth;
  const maxHeight = badSize
    ? biggerWidth
      ? MAX_SECONDARY_DIMENSION
      : MAX_PRIMARY_DIMENSION
    : totalHeight;

  const numCols = Math.ceil(totalWidth / maxWidth);
  const numRows = Math.ceil(totalHeight / maxHeight);
  const result = [];
  let canvasIndex = 0;

  for (let row = 0; row < numRows; row++) {
    for (let col = 0; col < numCols; col++) {
      const canvas = createCanvas(
        col === numCols - 1 ? totalWidth % maxWidth || maxWidth : maxWidth,
        row === numRows - 1 ? totalHeight % maxHeight || maxHeight : maxHeight
      );
      const left = col * maxWidth;
      const top = row * maxHeight;

      result.push({
        canvas,
        ctx: canvas.getContext('2d'),
        index: canvasIndex,
        left,
        right: left + canvas.width,
        top,
        bottom: top + canvas.height,
      });
      canvasIndex += 1;
    }
  }

  return result;
}

/**
 * Filter screenshot slots overlapping a tile.
 */
export function filterScreenshots(imgLeft, imgTop, imgWidth, imgHeight, screenshots) {
  const imgRight = imgLeft + imgWidth;
  const imgBottom = imgTop + imgHeight;

  return screenshots.filter(
    (screenshot) =>
      imgLeft < screenshot.right &&
      imgRight > screenshot.left &&
      imgTop < screenshot.bottom &&
      imgBottom > screenshot.top
  );
}

/**
 * Convert screenshot canvases to data URLs.
 * @param {Array<object>} screenshots
 * @param {string} format
 * @param {number} quality
 */
export async function screenshotsToDataUrls(screenshots, format = 'image/png', quality = 0.92) {
  const blobs = await Promise.all(
    screenshots.map((shot) => canvasToBlob(shot.canvas, format, quality))
  );

  return Promise.all(
    blobs.map(
      (blob) =>
        new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        })
    )
  );
}