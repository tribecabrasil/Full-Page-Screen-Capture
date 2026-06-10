/**
 * Download or copy image data.
 * @param {string} dataUrl
 * @param {string} filename
 * @param {object} options
 */
export async function downloadImage(dataUrl, filename, options = {}) {
  const hasDownloads = await chrome.permissions.contains({ permissions: ['downloads'] });

  if (hasDownloads) {
    await chrome.downloads.download({
      url: dataUrl,
      filename,
      saveAs: options.saveAsDialog !== false,
    });
    return;
  }

  const anchor = document.createElement('a');
  anchor.href = dataUrl;
  anchor.download = filename;
  anchor.click();
}

export async function copyImageToClipboard(dataUrl) {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
}

export function dataUrlWithFormat(dataUrl, format, quality = 0.92) {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = image.width;
      canvas.height = image.height;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image, 0, 0);
      const mime = format === 'jpeg' ? 'image/jpeg' : 'image/png';
      resolve(canvas.toDataURL(mime, quality));
    };
    image.src = dataUrl;
  });
}