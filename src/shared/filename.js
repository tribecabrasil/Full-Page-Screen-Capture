/**
 * Build a sanitized filename from a page URL and timestamp.
 * @param {string} contentURL
 * @param {string} [extension='png']
 * @returns {string}
 */
export function getFilename(contentURL, extension = 'png') {
  let name = contentURL.split('?')[0].split('#')[0];

  if (name) {
    name = name
      .replace(/^https?:\/\//, '')
      .replace(/[^A-Za-z0-9]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^[_-]+/, '')
      .replace(/[_-]+$/, '');
    name = name ? `-${name}` : '';
  } else {
    name = '';
  }

  return `screencapture${name}-${Date.now()}.${extension}`;
}

/**
 * Add part suffix for split captures.
 * @param {string} filename
 * @param {number} index
 * @returns {string}
 */
export function addPartSuffix(filename, index) {
  if (!index) {
    return filename;
  }
  const parts = filename.split('.');
  const ext = parts.pop();
  return `${parts.join('.')}-${index + 1}.${ext}`;
}