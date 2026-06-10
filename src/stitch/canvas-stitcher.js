import { filterScreenshots, initScreenshots, screenshotsToDataUrls } from './image-splitter.js';

export class CanvasStitcher {
  constructor() {
    this.screenshots = [];
    this.split = false;
  }

  reset() {
    this.screenshots = [];
    this.split = false;
  }

  /**
   * Draw one captured tile onto the stitched canvases.
   * @param {object} data
   * @param {string} dataURI
   */
  async drawTile(data, dataURI) {
    const image = await createImageBitmap(await (await fetch(dataURI)).blob());
    const tile = { ...data, image };

    if (data.windowWidth !== image.width) {
      const scale = image.width / data.windowWidth;
      tile.x *= scale;
      tile.y *= scale;
      tile.totalWidth *= scale;
      tile.totalHeight *= scale;
    }

    if (!this.screenshots.length) {
      this.screenshots = initScreenshots(tile.totalWidth, tile.totalHeight);
      this.split = this.screenshots.length > 1;
    }

    filterScreenshots(tile.x, tile.y, image.width, image.height, this.screenshots).forEach(
      (screenshot) => {
        screenshot.ctx.drawImage(image, tile.x - screenshot.left, tile.y - screenshot.top);
      }
    );

    image.close();
    return { split: this.split, count: this.screenshots.length };
  }

  /**
   * @param {string} format
   * @param {number} quality
   */
  async finish(format = 'image/png', quality = 0.92) {
    const dataUrls = await screenshotsToDataUrls(this.screenshots, format, quality);
    const result = {
      split: this.split,
      parts: dataUrls.map((dataUrl, index) => ({
        index,
        dataUrl,
        width: this.screenshots[index].canvas.width,
        height: this.screenshots[index].canvas.height,
      })),
      totalWidth: this.screenshots.reduce((max, s) => Math.max(max, s.right), 0),
      totalHeight: this.screenshots.reduce((max, s) => Math.max(max, s.bottom), 0),
    };
    this.reset();
    return result;
  }
}