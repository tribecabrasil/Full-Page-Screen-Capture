import { drawBrowserFrame } from './overlays/browser-frame.js';
import { applyBlurRegion, applyPixelateRegion } from './tools/mask-effects.js';
import { HistoryStack } from './tools/history.js';
import { copyImageToClipboard, downloadImage } from '../export/png-jpeg.js';
import { applyI18n, initI18n, t } from '../shared/i18n.js';
import {
  cycleTheme,
  initTheme,
  updateThemeToggleButton,
} from '../shared/theme.js';
import { showToast } from '../shared/toast.js';
import { getCapture, getOptions } from '../shared/storage.js';

const params = new URLSearchParams(location.search);
const captureId = params.get('id');

const baseCanvas = document.getElementById('base-canvas');
const overlayCanvas = document.getElementById('overlay-canvas');
const baseCtx = baseCanvas.getContext('2d');
const overlayCtx = overlayCanvas.getContext('2d');
const history = new HistoryStack();

let record = null;
let options = null;
let zoom = 1;
let tool = 'select';
let pendingEmoji = null;
let annotations = [];
let selectedId = null;
let dragSnapshot = null;
let interaction = null;
let pendingTextPoint = null;

const textDialog = document.getElementById('text-dialog');
const textDialogInput = document.getElementById('text-dialog-input');

const EMOJIS = ['😀', '😎', '👍', '🔥', '✅', '❤️', '🎉', '📌', '⭐', '💡', '🚀', '📷'];
const SHAPE_TOOLS = new Set(['rect', 'arrow', 'ellipse', 'freehand', 'highlight', 'text']);
const DRAW_TOOLS = new Set(['rect', 'arrow', 'ellipse', 'freehand', 'highlight', 'text']);
const MASK_TOOLS = new Set(['blur', 'pixelate']);
const FORMATTABLE_TYPES = new Set(['rect', 'arrow', 'ellipse', 'freehand', 'highlight', 'text']);
const HIT_PADDING = 10;
const MIN_HIT_SIZE = 28;

const TOOL_STATUS_KEYS = {
  select: 'editorSelectHint',
  crop: 'editorCropHint',
  highlight: 'editorHighlightHint',
  text: 'editorTextHint',
  rect: 'editorShapesHint',
  arrow: 'editorShapesHint',
  ellipse: 'editorShapesHint',
  freehand: 'editorShapesHint',
  blur: 'editorBlurHint',
  pixelate: 'editorPixelateHint',
};

const TOOL_CURSORS = {
  select: 'default',
  crop: 'crosshair',
  blur: 'crosshair',
  pixelate: 'crosshair',
};

function uid() {
  return `ann-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function getStrokeColor() {
  return document.getElementById('stroke-color').value;
}

function getStrokeSize() {
  return Number(document.getElementById('stroke-size').value);
}

function getSelectedAnnotation() {
  return annotations.find((annotation) => annotation.id === selectedId);
}

function isFormattable(annotation) {
  return annotation && FORMATTABLE_TYPES.has(annotation.type);
}

function updateFormatPreview() {
  const color = getStrokeColor();
  const size = getStrokeSize();
  const line = document.getElementById('format-preview-line');
  const shape = document.getElementById('format-preview-shape');
  const sizeValue = document.getElementById('stroke-size-value');

  if (line) {
    line.style.background = color;
    line.style.height = `${Math.max(2, size)}px`;
  }
  if (shape) {
    shape.style.borderColor = color;
    shape.style.borderWidth = `${Math.max(2, size)}px`;
  }
  if (sizeValue) {
    sizeValue.textContent = String(size);
  }

  document.querySelectorAll('.swatch').forEach((swatch) => {
    swatch.classList.toggle('active', swatch.dataset.color === color);
  });
}

function updateToolStatus() {
  const status = document.getElementById('tool-status');
  if (!status) {
    return;
  }
  const key = TOOL_STATUS_KEYS[tool] || 'editorSelectHint';
  status.textContent = t(key);
}

function updateFormatPanelHighlight() {
  const panel = document.getElementById('format-panel');
  const selected = getSelectedAnnotation();
  const isRelevant = DRAW_TOOLS.has(tool) || isFormattable(selected);
  panel?.classList.toggle('is-active', isRelevant);
}

function syncFormatFromSelection() {
  const annotation = getSelectedAnnotation();
  if (!isFormattable(annotation)) {
    updateFormatPreview();
    updateFormatPanelHighlight();
    return;
  }

  const colorInput = document.getElementById('stroke-color');
  const sizeInput = document.getElementById('stroke-size');

  if (annotation.color) {
    colorInput.value = annotation.color;
  }
  if (annotation.type === 'text' && annotation.fontSize) {
    sizeInput.value = String(Math.max(1, Math.round(annotation.fontSize / 4)));
  } else if (annotation.size) {
    sizeInput.value = String(annotation.size);
  }

  updateFormatPreview();
  updateFormatPanelHighlight();
}

function applyFormatToSelection() {
  const annotation = getSelectedAnnotation();
  if (!isFormattable(annotation)) {
    updateFormatPreview();
    return;
  }

  annotation.color = getStrokeColor();
  annotation.size = getStrokeSize();
  if (annotation.type === 'text') {
    annotation.fontSize = getStrokeSize() * 4;
  }
  redrawOverlay();
  commitState();
}

function setZoom(value) {
  zoom = Math.min(2, Math.max(0.25, value));
  const stage = document.getElementById('canvas-stage');
  stage.style.transform = `scale(${zoom})`;
  stage.style.transformOrigin = 'top left';
  document.getElementById('zoom-label').textContent = `${Math.round(zoom * 100)}%`;
}

function canvasPoint(event) {
  const rect = overlayCanvas.getBoundingClientRect();
  if (!rect.width || !rect.height || !overlayCanvas.width || !overlayCanvas.height) {
    return { x: 0, y: 0 };
  }
  return {
    x: ((event.clientX - rect.left) / rect.width) * overlayCanvas.width,
    y: ((event.clientY - rect.top) / rect.height) * overlayCanvas.height,
  };
}

function clampCropRect(rect) {
  const x = Math.max(0, Math.floor(rect.x));
  const y = Math.max(0, Math.floor(rect.y));
  const width = Math.min(
    baseCanvas.width - x,
    Math.max(1, Math.ceil(rect.width))
  );
  const height = Math.min(
    baseCanvas.height - y,
    Math.max(1, Math.ceil(rect.height))
  );
  return { x, y, width, height };
}

function copyCanvasRegion(sourceCanvas, rect) {
  const target = document.createElement('canvas');
  target.width = rect.width;
  target.height = rect.height;
  target.getContext('2d').drawImage(
    sourceCanvas,
    rect.x,
    rect.y,
    rect.width,
    rect.height,
    0,
    0,
    rect.width,
    rect.height
  );
  return target;
}

function setTool(nextTool, options = {}) {
  tool = nextTool;
  pendingEmoji = null;
  if (!options.keepSelection) {
    selectedId = null;
  }
  document.querySelectorAll('.tool-card').forEach((el) => {
    el.classList.toggle('active', el.dataset.tool === nextTool);
  });
  overlayCanvas.style.cursor = TOOL_CURSORS[nextTool] || 'crosshair';
  updateToolStatus();
  updateFormatPanelHighlight();
  updateFormatPreview();
}

function focusAnnotation(annotationId) {
  selectedId = annotationId;
  setTool('select', { keepSelection: true });
  syncFormatFromSelection();
  redrawOverlay();
}

function beginMove(target, point) {
  selectedId = target.id;
  interaction = { kind: 'move', target, start: point };
  dragSnapshot = JSON.stringify(annotations);
  overlayCanvas.style.cursor = 'grabbing';
  setTool('select', { keepSelection: true });
  syncFormatFromSelection();
  redrawOverlay();
}

function snapPoint(from, to, enabled) {
  if (!enabled) {
    return to;
  }
  const angle = Math.atan2(to.y - from.y, to.x - from.x);
  const snappedAngle = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);
  const distance = Math.hypot(to.x - from.x, to.y - from.y);
  return {
    x: from.x + Math.cos(snappedAngle) * distance,
    y: from.y + Math.sin(snappedAngle) * distance,
  };
}

function applyMaskEffect(effectTool, rect) {
  if (effectTool === 'blur') {
    applyBlurRegion(baseCtx, baseCanvas, rect);
    return;
  }
  if (effectTool === 'pixelate') {
    applyPixelateRegion(baseCtx, rect);
  }
}

function getFrameType() {
  return document.querySelector('input[name="frame"]:checked')?.value || 'none';
}

function getUrlPlacement() {
  return document.querySelector('input[name="urlPlacement"]:checked')?.value || 'none';
}

function textBounds(annotation) {
  const fontSize = annotation.fontSize || 24;
  overlayCtx.font = `${fontSize}px sans-serif`;
  const width = Math.max(fontSize, overlayCtx.measureText(annotation.text || '').width);
  return {
    x: annotation.x,
    y: annotation.y - fontSize,
    width,
    height: fontSize,
  };
}

function expandHitBounds(bounds) {
  const width = Math.max(bounds.width, MIN_HIT_SIZE);
  const height = Math.max(bounds.height, MIN_HIT_SIZE);
  const extraX = (width - bounds.width) / 2;
  const extraY = (height - bounds.height) / 2;
  return {
    x: bounds.x - HIT_PADDING - extraX,
    y: bounds.y - HIT_PADDING - extraY,
    width: width + HIT_PADDING * 2,
    height: height + HIT_PADDING * 2,
  };
}

function boundsFor(annotation) {
  switch (annotation.type) {
    case 'emoji':
      return {
        x: annotation.x,
        y: annotation.y - (annotation.fontSize || 48),
        width: annotation.fontSize || 48,
        height: annotation.fontSize || 48,
      };
    case 'text':
      return textBounds(annotation);
    case 'rect':
    case 'highlight':
      return {
        x: Math.min(annotation.x1, annotation.x2),
        y: Math.min(annotation.y1, annotation.y2),
        width: Math.abs(annotation.x2 - annotation.x1),
        height: Math.abs(annotation.y2 - annotation.y1),
      };
    case 'ellipse':
    case 'arrow':
      return {
        x: Math.min(annotation.x1, annotation.x2) - 8,
        y: Math.min(annotation.y1, annotation.y2) - 8,
        width: Math.abs(annotation.x2 - annotation.x1) + 16,
        height: Math.abs(annotation.y2 - annotation.y1) + 16,
      };
    case 'freehand':
      return annotation.bounds;
    default:
      return { x: 0, y: 0, width: 0, height: 0 };
  }
}

function hitTest(point) {
  for (let i = annotations.length - 1; i >= 0; i -= 1) {
    const bounds = expandHitBounds(boundsFor(annotations[i]));
    if (
      point.x >= bounds.x &&
      point.x <= bounds.x + bounds.width &&
      point.y >= bounds.y &&
      point.y <= bounds.y + bounds.height
    ) {
      return annotations[i];
    }
  }
  return null;
}

function deleteAnnotation(id) {
  annotations = annotations.filter((annotation) => annotation.id !== id);
  if (selectedId === id) {
    selectedId = null;
    updateFormatPanelHighlight();
  }
  redrawOverlay();
  commitState();
}

function hideAnnotationMenu() {
  const menu = document.getElementById('annotation-menu');
  menu.hidden = true;
  menu.dataset.targetId = '';
}

function showAnnotationMenu(clientX, clientY, annotation) {
  const menu = document.getElementById('annotation-menu');
  selectedId = annotation.id;
  syncFormatFromSelection();
  redrawOverlay();
  menu.dataset.targetId = annotation.id;
  menu.style.left = `${clientX}px`;
  menu.style.top = `${clientY}px`;
  menu.hidden = false;
}

function drawAnnotation(ctx, annotation, isSelected = false) {
  const color = annotation.color || '#111111';
  const size = annotation.size || 4;
  ctx.strokeStyle = color;
  ctx.fillStyle = annotation.type === 'highlight' ? 'rgba(255, 230, 0, 0.35)' : color;
  ctx.lineWidth = size;

  if (annotation.type === 'emoji') {
    ctx.font = `${annotation.fontSize || 48}px serif`;
    ctx.fillText(annotation.emoji, annotation.x, annotation.y);
    return;
  }

  if (annotation.type === 'text') {
    ctx.fillStyle = color;
    ctx.font = `${annotation.fontSize || 24}px sans-serif`;
    ctx.fillText(annotation.text, annotation.x, annotation.y);
    return;
  }

  if (annotation.type === 'rect' || annotation.type === 'highlight') {
    const width = annotation.x2 - annotation.x1;
    const height = annotation.y2 - annotation.y1;
    ctx.fillRect(annotation.x1, annotation.y1, width, height);
    if (annotation.type === 'rect') {
      ctx.strokeRect(annotation.x1, annotation.y1, width, height);
    }
    return;
  }

  if (annotation.type === 'ellipse') {
    const rx = Math.abs(annotation.x2 - annotation.x1) / 2;
    const ry = Math.abs(annotation.y2 - annotation.y1) / 2;
    const cx = annotation.x1 + (annotation.x2 - annotation.x1) / 2;
    const cy = annotation.y1 + (annotation.y2 - annotation.y1) / 2;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.stroke();
    return;
  }

  if (annotation.type === 'arrow') {
    ctx.beginPath();
    ctx.moveTo(annotation.x1, annotation.y1);
    ctx.lineTo(annotation.x2, annotation.y2);
    ctx.stroke();
    const angle = Math.atan2(annotation.y2 - annotation.y1, annotation.x2 - annotation.x1);
    const head = Math.max(10, size * 3);
    ctx.beginPath();
    ctx.moveTo(annotation.x2, annotation.y2);
    ctx.lineTo(
      annotation.x2 - head * Math.cos(angle - Math.PI / 6),
      annotation.y2 - head * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      annotation.x2 - head * Math.cos(angle + Math.PI / 6),
      annotation.y2 - head * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fill();
    return;
  }

  if (annotation.type === 'freehand') {
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    annotation.points.forEach((point, index) => {
      if (index === 0) {
        ctx.moveTo(point.x, point.y);
      } else {
        ctx.lineTo(point.x, point.y);
      }
    });
    ctx.stroke();
    return;
  }

  if (isSelected) {
    const bounds = boundsFor(annotation);
    ctx.save();
    ctx.strokeStyle = '#3d84ff';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(bounds.x - 4, bounds.y - 4, bounds.width + 8, bounds.height + 8);
    ctx.restore();
  }
}

function drawPreviewShape(from, to) {
  const preview = {
    type: tool,
    x1: from.x,
    y1: from.y,
    x2: to.x,
    y2: to.y,
    color: getStrokeColor(),
    size: getStrokeSize(),
  };
  drawAnnotation(overlayCtx, preview);
}

function redrawOverlay() {
  overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
  annotations.forEach((annotation) => {
    drawAnnotation(overlayCtx, annotation, annotation.id === selectedId);
  });
}

function serializeEditorState(includeCanvas = false) {
  const state = {
    v: 3,
    annotations,
    width: baseCanvas.width,
    height: baseCanvas.height,
  };
  if (includeCanvas) {
    try {
      state.hasCanvas = true;
      state.baseDataUrl = baseCanvas.toDataURL('image/png');
    } catch (error) {
      console.warn('[FPSC editor] canvas snapshot failed:', error);
    }
  }
  return JSON.stringify(state);
}

function commitState(options = {}) {
  history.push(serializeEditorState(Boolean(options.includeCanvas)));
  document.getElementById('undo').disabled = !history.canUndo();
  document.getElementById('redo').disabled = !history.canRedo();
}

function restoreCanvasFromDataUrl(baseDataUrl, width, height) {
  const image = new Image();
  image.onload = () => {
    const nextWidth = width || image.width;
    const nextHeight = height || image.height;
    baseCanvas.width = nextWidth;
    baseCanvas.height = nextHeight;
    overlayCanvas.width = nextWidth;
    overlayCanvas.height = nextHeight;
    baseCtx.drawImage(image, 0, 0);
    redrawOverlay();
    updateFormatPanelHighlight();
  };
  image.src = baseDataUrl;
}

function restoreState(serialized) {
  const parsed = JSON.parse(serialized);

  if (Array.isArray(parsed)) {
    annotations = parsed;
    selectedId = null;
    redrawOverlay();
    updateFormatPanelHighlight();
    return;
  }

  annotations = parsed.annotations || [];
  selectedId = null;

  const baseDataUrl = parsed.baseDataUrl;
  const needsCanvas = Boolean(baseDataUrl) || parsed.hasCanvas;

  if (!needsCanvas) {
    redrawOverlay();
    updateFormatPanelHighlight();
    return;
  }

  if (!baseDataUrl) {
    redrawOverlay();
    updateFormatPanelHighlight();
    return;
  }

  restoreCanvasFromDataUrl(baseDataUrl, parsed.width, parsed.height);
}

function moveAnnotation(annotation, dx, dy) {
  if (annotation.type === 'emoji' || annotation.type === 'text') {
    annotation.x += dx;
    annotation.y += dy;
    return;
  }
  if (annotation.type === 'freehand') {
    annotation.points.forEach((point) => {
      point.x += dx;
      point.y += dy;
    });
    annotation.bounds.x += dx;
    annotation.bounds.y += dy;
    return;
  }
  annotation.x1 += dx;
  annotation.y1 += dy;
  annotation.x2 += dx;
  annotation.y2 += dy;
}

function renderBaseImage(dataUrl) {
  const image = new Image();
  image.onload = () => {
    baseCanvas.width = image.width;
    baseCanvas.height = image.height;
    overlayCanvas.width = image.width;
    overlayCanvas.height = image.height;
    baseCtx.drawImage(image, 0, 0);
    annotations = [];
    commitState({ includeCanvas: true });
    redrawOverlay();
  };
  image.src = dataUrl;
}

function applyCrop(rect) {
  const crop = clampCropRect(rect);
  const croppedBase = copyCanvasRegion(baseCanvas, crop);
  const croppedOverlay = copyCanvasRegion(overlayCanvas, crop);

  baseCanvas.width = crop.width;
  baseCanvas.height = crop.height;
  overlayCanvas.width = crop.width;
  overlayCanvas.height = crop.height;
  baseCtx.drawImage(croppedBase, 0, 0);
  overlayCtx.drawImage(croppedOverlay, 0, 0);
  annotations = annotations
    .map((annotation) => {
      moveAnnotation(annotation, -crop.x, -crop.y);
      return annotation;
    })
    .filter((annotation) => {
      const bounds = boundsFor(annotation);
      return bounds.x + bounds.width > 0 && bounds.y + bounds.height > 0;
    });
  redrawOverlay();
  commitState({ includeCanvas: true });
}

function isTypingTarget(element) {
  if (!element) {
    return false;
  }
  const tag = element.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || element.isContentEditable;
}

function openTextDialog(point) {
  pendingTextPoint = point;
  textDialogInput.value = '';
  textDialog.showModal();
  textDialogInput.focus();
}

function addTextAnnotation(text, point) {
  const annotation = {
    id: uid(),
    type: 'text',
    text,
    x: point.x,
    y: point.y,
    color: getStrokeColor(),
    fontSize: getStrokeSize() * 4,
  };
  annotations.push(annotation);
  focusAnnotation(annotation.id);
  commitState();
}

function buildExportCanvas() {
  redrawOverlay();
  const exportCanvas = document.createElement('canvas');
  const exportCtx = exportCanvas.getContext('2d');
  const frameType = getFrameType();
  const urlPlacement = getUrlPlacement();
  const showDate = document.getElementById('show-date').checked;
  const padding = frameType === 'none' ? 0 : 14;
  const chromeHeight = frameType === 'none' ? 0 : 42;
  const urlHeight = urlPlacement === 'none' ? 0 : 24;

  exportCanvas.width = baseCanvas.width + padding * 2;
  exportCanvas.height =
    baseCanvas.height + padding * 2 + chromeHeight + (urlPlacement === 'bottom' ? urlHeight : 0);

  exportCtx.fillStyle = '#ffffff';
  exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

  const offsets = drawBrowserFrame(
    exportCtx,
    padding,
    padding + chromeHeight + (urlPlacement === 'top' ? urlHeight : 0),
    baseCanvas.width,
    baseCanvas.height,
    frameType,
    record.pageUrl
  );

  const imageTop = padding + chromeHeight + (urlPlacement === 'top' ? urlHeight : 0);
  exportCtx.drawImage(
    baseCanvas,
    padding + offsets.offsetX,
    imageTop + offsets.offsetY
  );
  exportCtx.drawImage(
    overlayCanvas,
    padding + offsets.offsetX,
    imageTop + offsets.offsetY
  );

  if (urlPlacement === 'top') {
    exportCtx.fillStyle = '#444';
    exportCtx.font = '14px sans-serif';
    exportCtx.fillText(record.pageUrl, padding, padding + 16);
  }

  if (urlPlacement === 'bottom') {
    exportCtx.fillStyle = '#444';
    exportCtx.font = '14px sans-serif';
    exportCtx.fillText(record.pageUrl, padding, exportCanvas.height - 8);
  }

  if (showDate) {
    exportCtx.fillStyle = '#444';
    exportCtx.font = '14px sans-serif';
    exportCtx.fillText(
      new Date(record.createdAt || Date.now()).toLocaleString(),
      exportCanvas.width - 280,
      padding + chromeHeight + 20
    );
  }

  return exportCanvas;
}

function getExportDataUrl() {
  const exportCanvas = buildExportCanvas();
  return exportCanvas.toDataURL(
    options.imageFormat === 'jpeg' ? 'image/jpeg' : 'image/png',
    (options.jpegQuality || 92) / 100
  );
}

async function exportImage() {
  const dataUrl = getExportDataUrl();
  await downloadImage(dataUrl, record.filename || 'screencapture-edited.png', options);
  showToast(t('toastExported'));
}

async function copyImage() {
  try {
    const dataUrl = getExportDataUrl();
    await copyImageToClipboard(dataUrl);
    showToast(t('toastCopied'));
  } catch (error) {
    console.error('[FPSC editor] copy failed:', error);
    showToast(t('toastCopyFailed'));
  }
}

overlayCanvas.addEventListener('mousedown', (event) => {
  if (event.button !== 0) {
    return;
  }
  hideAnnotationMenu();
  const point = canvasPoint(event);

  if (pendingEmoji) {
    const annotation = {
      id: uid(),
      type: 'emoji',
      emoji: pendingEmoji,
      x: point.x,
      y: point.y,
      fontSize: 48,
    };
    annotations.push(annotation);
    pendingEmoji = null;
    focusAnnotation(annotation.id);
    commitState();
    return;
  }

  if (MASK_TOOLS.has(tool)) {
    interaction = { kind: 'mask', start: point, effectTool: tool };
    return;
  }

  if (tool !== 'crop') {
    const target = hitTest(point);
    if (target) {
      beginMove(target, point);
      return;
    }
  }

  if (tool === 'select') {
    selectedId = null;
    updateFormatPanelHighlight();
    redrawOverlay();
    return;
  }

  if (tool === 'text') {
    openTextDialog(point);
    return;
  }

  if (tool === 'crop') {
    interaction = { kind: 'crop', start: point };
    return;
  }

  if (SHAPE_TOOLS.has(tool)) {
    interaction = { kind: 'draw', start: point, points: [point] };
  }
});

function handlePointerMove(event) {
  if (!interaction) {
    return;
  }

  const point = canvasPoint(event);

  if (interaction.kind === 'move') {
    const dx = point.x - interaction.start.x;
    const dy = point.y - interaction.start.y;
    annotations = JSON.parse(dragSnapshot);
    const target = annotations.find((item) => item.id === interaction.target.id);
    if (target) {
      moveAnnotation(target, dx, dy);
      selectedId = target.id;
      redrawOverlay();
    }
    return;
  }

  if (interaction.kind === 'mask' || interaction.kind === 'crop') {
    redrawOverlay();
    const rect = {
      x: Math.min(interaction.start.x, point.x),
      y: Math.min(interaction.start.y, point.y),
      width: Math.abs(point.x - interaction.start.x),
      height: Math.abs(point.y - interaction.start.y),
    };
    overlayCtx.setLineDash([8, 6]);
    overlayCtx.strokeStyle = interaction.kind === 'mask' ? '#a855f7' : '#3d84ff';
    overlayCtx.lineWidth = 2;
    overlayCtx.strokeRect(rect.x, rect.y, rect.width, rect.height);
    overlayCtx.setLineDash([]);
    interaction.preview = rect;
    return;
  }

  if (interaction.kind === 'draw') {
    redrawOverlay();
    if (tool === 'freehand') {
      interaction.points.push(point);
      drawAnnotation(overlayCtx, {
        type: 'freehand',
        points: interaction.points,
        color: getStrokeColor(),
        size: getStrokeSize(),
        bounds: { x: 0, y: 0, width: 0, height: 0 },
      });
      return;
    }
    const previewPoint = snapPoint(interaction.start, point, event.shiftKey && tool === 'arrow');
    drawPreviewShape(interaction.start, previewPoint);
  }
}

function handlePointerUp(event) {
  if (!interaction || event.button !== 0) {
    return;
  }

  const point = canvasPoint(event);

  if (interaction.kind === 'move') {
    commitState();
    overlayCanvas.style.cursor = TOOL_CURSORS[tool] || 'crosshair';
    interaction = null;
    dragSnapshot = null;
    return;
  }

  if (interaction.kind === 'mask') {
    if (interaction.preview?.width > 4 && interaction.preview?.height > 4) {
      applyMaskEffect(interaction.effectTool, interaction.preview);
      commitState({ includeCanvas: true });
    }
    redrawOverlay();
    interaction = null;
    dragSnapshot = null;
    return;
  }

  if (interaction.kind === 'crop') {
    if (interaction.preview?.width > 4 && interaction.preview?.height > 4) {
      applyCrop(interaction.preview);
    } else {
      redrawOverlay();
    }
    interaction = null;
    dragSnapshot = null;
    return;
  }

  if (interaction.kind === 'draw') {
    const endPoint = snapPoint(interaction.start, point, event.shiftKey && tool === 'arrow');
    const minDistance = 4;
    const distance = Math.hypot(endPoint.x - interaction.start.x, endPoint.y - interaction.start.y);
    if (tool === 'freehand' || distance >= minDistance) {
      let annotation;
      if (tool === 'freehand') {
        const xs = interaction.points.map((p) => p.x);
        const ys = interaction.points.map((p) => p.y);
        annotation = {
          id: uid(),
          type: 'freehand',
          points: interaction.points,
          color: getStrokeColor(),
          size: getStrokeSize(),
          bounds: {
            x: Math.min(...xs),
            y: Math.min(...ys),
            width: Math.max(...xs) - Math.min(...xs),
            height: Math.max(...ys) - Math.min(...ys),
          },
        };
      } else {
        annotation = {
          id: uid(),
          type: tool,
          x1: interaction.start.x,
          y1: interaction.start.y,
          x2: endPoint.x,
          y2: endPoint.y,
          color: getStrokeColor(),
          size: getStrokeSize(),
        };
      }
      annotations.push(annotation);
      focusAnnotation(annotation.id);
      commitState();
    } else {
      redrawOverlay();
    }
  }

  interaction = null;
  dragSnapshot = null;
}

document.addEventListener('mousemove', handlePointerMove);
document.addEventListener('mouseup', handlePointerUp);

overlayCanvas.addEventListener('contextmenu', (event) => {
  event.preventDefault();
  const point = canvasPoint(event);
  const target = hitTest(point);
  if (target) {
    showAnnotationMenu(event.clientX, event.clientY, target);
    return;
  }
  hideAnnotationMenu();
});

document.getElementById('menu-delete').addEventListener('click', () => {
  const menu = document.getElementById('annotation-menu');
  const targetId = menu.dataset.targetId;
  if (targetId) {
    deleteAnnotation(targetId);
  }
  hideAnnotationMenu();
});

document.addEventListener('click', (event) => {
  const menu = document.getElementById('annotation-menu');
  if (!menu.hidden && !menu.contains(event.target)) {
    hideAnnotationMenu();
  }
});

function performUndo() {
  const state = history.undo();
  if (state) {
    restoreState(state);
  }
  document.getElementById('undo').disabled = !history.canUndo();
  document.getElementById('redo').disabled = !history.canRedo();
}

function performRedo() {
  const state = history.redo();
  if (state) {
    restoreState(state);
  }
  document.getElementById('undo').disabled = !history.canUndo();
  document.getElementById('redo').disabled = !history.canRedo();
}

document.getElementById('text-dialog-form').addEventListener('close', () => {
  if (textDialog.returnValue !== 'add' || !pendingTextPoint) {
    pendingTextPoint = null;
    return;
  }
  const text = textDialogInput.value.trim();
  if (text) {
    addTextAnnotation(text, pendingTextPoint);
  }
  pendingTextPoint = null;
});

document.addEventListener('keydown', (event) => {
  if (textDialog.open) {
    return;
  }

  const mod = event.metaKey || event.ctrlKey;

  if (event.key === 'Escape') {
    hideAnnotationMenu();
    if (textDialog.open) {
      textDialog.close('cancel');
    }
    return;
  }

  if (isTypingTarget(document.activeElement)) {
    return;
  }

  if (mod && !event.shiftKey && event.key.toLowerCase() === 'z') {
    event.preventDefault();
    performUndo();
    return;
  }

  if (
    (mod && event.shiftKey && event.key.toLowerCase() === 'z') ||
    (mod && event.key.toLowerCase() === 'y')
  ) {
    event.preventDefault();
    performRedo();
    return;
  }

  if (!mod && !event.altKey) {
    const toolKeys = {
      v: 'select',
      c: 'crop',
      h: 'highlight',
      t: 'text',
      b: 'blur',
      p: 'pixelate',
    };
    const nextTool = toolKeys[event.key.toLowerCase()];
    if (nextTool) {
      setTool(nextTool);
      return;
    }
  }

  if (event.key === '=' || event.key === '+') {
    setZoom(zoom + 0.25);
    return;
  }

  if (event.key === '-') {
    setZoom(zoom - 0.25);
    return;
  }

  if ((event.key === 'Delete' || event.key === 'Backspace') && selectedId) {
    deleteAnnotation(selectedId);
    hideAnnotationMenu();
  }
});

document.querySelectorAll('.tool-card').forEach((button) => {
  button.addEventListener('click', () => {
    setTool(button.dataset.tool);
  });
});

document.getElementById('stroke-color').addEventListener('input', () => {
  if (selectedId) {
    applyFormatToSelection();
    return;
  }
  updateFormatPreview();
});

document.getElementById('stroke-size').addEventListener('input', () => {
  if (selectedId) {
    const annotation = getSelectedAnnotation();
    if (isFormattable(annotation)) {
      annotation.color = getStrokeColor();
      annotation.size = getStrokeSize();
      if (annotation.type === 'text') {
        annotation.fontSize = getStrokeSize() * 4;
      }
      redrawOverlay();
    }
    updateFormatPreview();
    return;
  }
  updateFormatPreview();
});

document.getElementById('stroke-size').addEventListener('change', () => {
  if (selectedId && isFormattable(getSelectedAnnotation())) {
    commitState();
  }
});

document.querySelectorAll('.swatch').forEach((swatch) => {
  swatch.addEventListener('click', () => {
    document.getElementById('stroke-color').value = swatch.dataset.color;
    if (selectedId) {
      applyFormatToSelection();
      return;
    }
    updateFormatPreview();
  });
});

document.getElementById('undo').addEventListener('click', performUndo);
document.getElementById('redo').addEventListener('click', performRedo);

document.getElementById('zoom-in').addEventListener('click', () => setZoom(zoom + 0.25));
document.getElementById('zoom-out').addEventListener('click', () => setZoom(zoom - 0.25));
document.getElementById('export').addEventListener('click', exportImage);
document.getElementById('copy').addEventListener('click', copyImage);

document.getElementById('theme-toggle').addEventListener('click', async () => {
  const next = await cycleTheme();
  updateThemeToggleButton(document.getElementById('theme-toggle'), next);
});

const emojiGrid = document.getElementById('emoji-grid');
EMOJIS.forEach((emoji) => {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = emoji;
  button.dataset.i18nTooltip = 'tooltipEditorEmoji';
  button.addEventListener('click', () => {
    pendingEmoji = emoji;
    tool = 'select';
    selectedId = null;
    document.querySelectorAll('.tool-card').forEach((el) => {
      el.classList.toggle('active', el.dataset.tool === 'select');
    });
    tool = 'select';
    updateToolStatus();
    updateFormatPanelHighlight();
    overlayCanvas.style.cursor = 'copy';
  });
  emojiGrid.appendChild(button);
});

async function init() {
  if (!captureId) {
    return;
  }
  record = await getCapture(captureId);
  options = await getOptions();
  if (!record?.parts?.[0]?.dataUrl) {
    return;
  }
  renderBaseImage(record.parts[0].dataUrl);
  setZoom(1);
  setTool('select');
  updateFormatPreview();
  updateThemeToggleButton(
    document.getElementById('theme-toggle'),
    options.theme || 'system'
  );
}

(async () => {
  await Promise.all([initI18n(), initTheme()]);
  applyI18n(document);
  await init();
})();