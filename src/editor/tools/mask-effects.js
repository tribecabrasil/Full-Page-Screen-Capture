/**
 * Apply a Gaussian-style blur to a canvas region.
 * @param {CanvasRenderingContext2D} ctx
 * @param {HTMLCanvasElement} canvas
 * @param {{ x: number, y: number, width: number, height: number }} rect
 * @param {number} [radius]
 */
export function applyBlurRegion(ctx, canvas, rect, radius = 14) {
  const pad = Math.ceil(radius * 1.5);
  const sx = Math.max(0, Math.floor(rect.x - pad));
  const sy = Math.max(0, Math.floor(rect.y - pad));
  const sw = Math.min(canvas.width - sx, Math.ceil(rect.width + pad * 2));
  const sh = Math.min(canvas.height - sy, Math.ceil(rect.height + pad * 2));

  if (sw <= 0 || sh <= 0) {
    return;
  }

  const temp = document.createElement('canvas');
  temp.width = sw;
  temp.height = sh;
  const tempCtx = temp.getContext('2d');
  tempCtx.filter = `blur(${radius}px)`;
  tempCtx.drawImage(canvas, sx, sy, sw, sh, 0, 0, sw, sh);
  tempCtx.filter = 'none';
  ctx.drawImage(temp, sx, sy);
}

/**
 * Pixelate a canvas region.
 * @param {CanvasRenderingContext2D} ctx
 * @param {{ x: number, y: number, width: number, height: number }} rect
 * @param {number} [blockSize]
 */
export function applyPixelateRegion(ctx, rect, blockSize = 12) {
  const x = Math.max(0, Math.floor(rect.x));
  const y = Math.max(0, Math.floor(rect.y));
  const width = Math.max(1, Math.floor(rect.width));
  const height = Math.max(1, Math.floor(rect.height));
  const imageData = ctx.getImageData(x, y, width, height);
  const { data } = imageData;

  for (let row = 0; row < height; row += blockSize) {
    for (let col = 0; col < width; col += blockSize) {
      const sampleX = Math.min(col + Math.floor(blockSize / 2), width - 1);
      const sampleY = Math.min(row + Math.floor(blockSize / 2), height - 1);
      const sampleIndex = (sampleY * width + sampleX) * 4;
      const r = data[sampleIndex];
      const g = data[sampleIndex + 1];
      const b = data[sampleIndex + 2];
      const a = data[sampleIndex + 3];

      for (let dy = 0; dy < blockSize && row + dy < height; dy += 1) {
        for (let dx = 0; dx < blockSize && col + dx < width; dx += 1) {
          const index = ((row + dy) * width + (col + dx)) * 4;
          data[index] = r;
          data[index + 1] = g;
          data[index + 2] = b;
          data[index + 3] = a;
        }
      }
    }
  }

  ctx.putImageData(imageData, x, y);
}