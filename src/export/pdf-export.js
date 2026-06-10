import { t } from '../shared/i18n.js';

const PAPER_SIZES_MM = {
  a4: [210, 297],
  letter: [215.9, 279.4],
  legal: [215.9, 355.6],
  a3: [297, 420],
};

const MAX_PDF_IMAGE_WIDTH = 1400;
const MAX_PDF_PAGES = 200;
const PDF_JPEG_QUALITY = 0.72;

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (window.jspdf?.jsPDF) {
      resolve(window.jspdf.jsPDF);
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve(window.jspdf.jsPDF);
    script.onerror = () => reject(new Error('jspdf-load-failed'));
    document.head.appendChild(script);
  });
}

function yieldToBrowser() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

function estimatePageCount(imageHeight, sliceHeight, overlap) {
  if (imageHeight <= sliceHeight) {
    return 1;
  }
  const step = Math.max(1, sliceHeight - overlap);
  return Math.ceil((imageHeight - sliceHeight) / step) + 1;
}

async function renderSlice(image, y, sliceHeight, scaledWidth, scale) {
  const canvas = document.createElement('canvas');
  canvas.width = scaledWidth;
  canvas.height = Math.max(1, Math.round(sliceHeight * scale));
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(
    image,
    0,
    y,
    image.width,
    sliceHeight,
    0,
    0,
    scaledWidth,
    canvas.height
  );
  return {
    dataUrl: canvas.toDataURL('image/jpeg', PDF_JPEG_QUALITY),
    renderHeightPx: canvas.height,
  };
}

/**
 * Export image data URL to PDF without blocking the UI thread.
 * @param {string} dataUrl
 * @param {string} filename
 * @param {object} options
 * @param {(progress: {page: number, total: number}) => void} [onProgress]
 */
export async function exportToPdf(dataUrl, filename, options = {}, onProgress) {
  const jsPDF = await loadScript(chrome.runtime.getURL('src/vendor/jspdf.umd.min.js'));
  const orientation = options.pdfOrientation === 'landscape' ? 'landscape' : 'portrait';
  const sizeKey = options.pdfPaperSize || 'a4';
  const [wMm, hMm] = PAPER_SIZES_MM[sizeKey] || PAPER_SIZES_MM.a4;
  const pageWidth = orientation === 'landscape' ? hMm : wMm;
  const pageHeight = orientation === 'landscape' ? wMm : hMm;

  const blob = await (await fetch(dataUrl)).blob();
  const image = await createImageBitmap(blob);

  try {
    const scale = image.width > MAX_PDF_IMAGE_WIDTH ? MAX_PDF_IMAGE_WIDTH / image.width : 1;
    const scaledWidth = Math.max(1, Math.round(image.width * scale));

    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format: sizeKey,
    });

    const margin = 8;
    const printableWidth = pageWidth - margin * 2;
    const printableHeight = pageHeight - margin * 2;
    const mmPerScaledPx = printableWidth / scaledWidth;
    const scaledSliceHeight = Math.max(1, Math.floor(printableHeight / mmPerScaledPx));
    const sourceSliceHeight = Math.max(1, Math.floor(scaledSliceHeight / scale));
    const smartSplit = options.pdfSmartSplit !== false;
    const overlap = smartSplit
      ? Math.min(Math.max(1, Math.floor(sourceSliceHeight * 0.02)), sourceSliceHeight - 1)
      : 0;
    const totalPages = Math.min(
      estimatePageCount(image.height, sourceSliceHeight, overlap),
      MAX_PDF_PAGES
    );

    let y = 0;
    let page = 0;

    while (y < image.height && page < MAX_PDF_PAGES) {
      if (page > 0) {
        await yieldToBrowser();
      }

      const remaining = image.height - y;
      const sliceHeight = Math.min(sourceSliceHeight, remaining);
      const isLastSlice = remaining <= sourceSliceHeight;

      const { dataUrl: sliceUrl, renderHeightPx } = await renderSlice(
        image,
        y,
        sliceHeight,
        scaledWidth,
        scale
      );
      const renderHeightMm = renderHeightPx * mmPerScaledPx;

      if (page > 0) {
        pdf.addPage(sizeKey, orientation);
      }

      if (options.urlPlacement === 'top' && options.pageUrl) {
        pdf.setFontSize(8);
        pdf.text(options.pageUrl, margin, margin - 2);
      }

      pdf.addImage(sliceUrl, 'JPEG', margin, margin, printableWidth, renderHeightMm);

      if (options.urlPlacement === 'bottom' && options.pageUrl) {
        pdf.setFontSize(8);
        pdf.text(options.pageUrl, margin, pageHeight - margin + 4);
      }

      if (options.showDateStamp) {
        pdf.setFontSize(8);
        pdf.text(new Date().toLocaleString(), pageWidth - margin - 40, margin - 2);
      }

      page += 1;
      if (onProgress) {
        onProgress({ page, total: totalPages });
      }

      if (isLastSlice) {
        y = image.height;
        break;
      }

      y += Math.max(1, sliceHeight - overlap);
    }

    if (y < image.height) {
      throw new Error(t('pdfTooManyPages', [String(MAX_PDF_PAGES)]));
    }

    await yieldToBrowser();
    pdf.save(filename.replace(/\.[^.]+$/, '.pdf'));
  } finally {
    image.close();
  }
}