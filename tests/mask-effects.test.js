import assert from 'node:assert/strict';
import test from 'node:test';

import { applyPixelateRegion } from '../src/editor/tools/mask-effects.js';

/**
 * @param {number} width
 * @param {number} height
 * @param {(x: number, y: number) => [number, number, number, number]} colorAt
 */
function createMockCtx(width, height, colorAt) {
  const pixels = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const [r, g, b, a] = colorAt(x, y);
      const index = (y * width + x) * 4;
      pixels[index] = r;
      pixels[index + 1] = g;
      pixels[index + 2] = b;
      pixels[index + 3] = a;
    }
  }

  return {
    getImageData(x, y, w, h) {
      const data = new Uint8ClampedArray(w * h * 4);
      for (let row = 0; row < h; row += 1) {
        for (let col = 0; col < w; col += 1) {
          const source = ((y + row) * width + (x + col)) * 4;
          const target = (row * w + col) * 4;
          data[target] = pixels[source];
          data[target + 1] = pixels[source + 1];
          data[target + 2] = pixels[source + 2];
          data[target + 3] = pixels[source + 3];
        }
      }
      return { data, width: w, height: h };
    },
    putImageData(imageData, x, y) {
      const { data, width: w, height: h } = imageData;
      for (let row = 0; row < h; row += 1) {
        for (let col = 0; col < w; col += 1) {
          const source = (row * w + col) * 4;
          const target = ((y + row) * width + (x + col)) * 4;
          pixels[target] = data[source];
          pixels[target + 1] = data[source + 1];
          pixels[target + 2] = data[source + 2];
          pixels[target + 3] = data[source + 3];
        }
      }
    },
    sample(x, y) {
      const index = (y * width + x) * 4;
      return [...pixels.slice(index, index + 4)];
    },
  };
}

test('applyPixelateRegion homogenizes pixels inside each block', () => {
  const ctx = createMockCtx(8, 8, (x) => [x * 10, 0, 0, 255]);
  applyPixelateRegion(ctx, { x: 0, y: 0, width: 8, height: 8 }, 4);

  const topLeft = ctx.sample(0, 0);
  const topRightInBlock = ctx.sample(3, 0);
  assert.deepEqual(topLeft, topRightInBlock);

  const nextBlock = ctx.sample(4, 0);
  assert.notDeepEqual(topLeft, nextBlock);
});

test('applyPixelateRegion leaves pixels outside the rect unchanged', () => {
  const ctx = createMockCtx(10, 10, (x, y) => [x, y, 0, 255]);
  const before = ctx.sample(9, 9);
  applyPixelateRegion(ctx, { x: 0, y: 0, width: 4, height: 4 }, 2);
  assert.deepEqual(ctx.sample(9, 9), before);
});