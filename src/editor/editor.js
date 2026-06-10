import { drawBrowserFrame } from './overlays/browser-frame.js';
import { HistoryStack } from './tools/history.js';
import { downloadImage } from '../export/png-jpeg.js';
import { applyI18n, initI18n, t } from '../shared/i18n.js';
import { initTheme } from '../shared/theme.js';
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

const EMOJIS = ['😀', '😎', '👍', '🔥', '✅', '❤️', '🎉', '📌', '⭐', '💡', '🚀', '📷'];
const SHAPE_TOOLS = new Set(['rect', 'arrow', 'ellipse', 'freehand', 'highlight', 'text']);
const DRAW_TOOLS = new Set(['rect', 'arrow', 'ellipse', 'freehand', 'highlight', 'text']);
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
  return {
    x: ((event.clientX - rect.left) / rect.width) * overlayCanvas.width,
    y: ((event.clientY - rect.top) / rect.height) * overlayCanvas.height,
  };
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
  overlayCanvas.style.cursor = nextTool === 'select' ? 'default' : 'crosshair';
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
  setTool('select', { keepSelection: true });
  syncFormatFromSelection();
  redrawOverlay();
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

function serializeEditorState() {
  return JSON.stringify({
    v: 2,
    annotations,
    baseDataUrl: baseCanvas.toDataURL('image/png'),
    width: baseCanvas.width,
    height: baseCanvas.height,
  });
}

function commitState() {
  history.push(serializeEditorState());
  document.getElementById('undo').disabled = !history.canUndo();
  document.getElementById('redo').disabled = !history.canRedo();
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

  if (!parsed.baseDataUrl) {
    redrawOverlay();
    updateFormatPanelHighlight();
    return;
  }

  const image = new Image();
  image.onload = () => {
    const width = parsed.width || image.width;
    const height = parsed.height || image.height;
    baseCanvas.width = width;
    baseCanvas.height = height;
    overlayCanvas.width = width;
    overlayCanvas.height = height;
    baseCtx.drawImage(image, 0, 0);
    redrawOverlay();
    updateFormatPanelHighlight();
  };
  image.src = parsed.baseDataUrl;
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
    commitState();
    redrawOverlay();
  };
  image.src = dataUrl;
}

function applyCrop(rect) {
  const baseData = baseCtx.getImageData(rect.x, rect.y, rect.width, rect.height);
  const overlayData = overlayCtx.getImageData(rect.x, rect.y, rect.width, rect.height);
  baseCanvas.width = rect.width;
  baseCanvas.height = rect.height;
  overlayCanvas.width = rect.width;
  overlayCanvas.height = rect.height;
  baseCtx.putImageData(baseData, 0, 0);
  overlayCtx.putImageData(overlayData, 0, 0);
  annotations = annotations
    .map((annotation) => {
      moveAnnotation(annotation, -rect.x, -rect.y);
      return annotation;
    })
    .filter((annotation) => {
      const bounds = boundsFor(annotation);
      return bounds.x + bounds.width > 0 && bounds.y + bounds.height > 0;
    });
  commitState();
}

async function exportImage() {
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

  exportCtx.drawImage(
    baseCanvas,
    padding + offsets.offsetX,
    padding + chromeHeight + (urlPlacement === 'top' ? urlHeight : 0) + offsets.offsetY
  );
  exportCtx.drawImage(
    overlayCanvas,
    padding + offsets.offsetX,
    padding + chromeHeight + (urlPlacement === 'top' ? urlHeight : 0) + offsets.offsetY
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

  const dataUrl = exportCanvas.toDataURL(
    options.imageFormat === 'jpeg' ? 'image/jpeg' : 'image/png',
    (options.jpegQuality || 92) / 100
  );
  await downloadImage(dataUrl, record.filename || 'screencapture-edited.png', options);
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
    const text = prompt(t('editorTextPrompt'));
    if (text) {
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
    return;
  }

  if (tool === 'crop') {
    interaction = { kind: 'crop', start: point };
    dragSnapshot = overlayCtx.getImageData(0, 0, overlayCanvas.width, overlayCanvas.height);
    return;
  }

  if (SHAPE_TOOLS.has(tool)) {
    interaction = { kind: 'draw', start: point, points: [point] };
    dragSnapshot = overlayCtx.getImageData(0, 0, overlayCanvas.width, overlayCanvas.height);
  }
});

overlayCanvas.addEventListener('mousemove', (event) => {
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

  if (interaction.kind === 'crop') {
    overlayCtx.putImageData(dragSnapshot, 0, 0);
    const rect = {
      x: Math.min(interaction.start.x, point.x),
      y: Math.min(interaction.start.y, point.y),
      width: Math.abs(point.x - interaction.start.x),
      height: Math.abs(point.y - interaction.start.y),
    };
    overlayCtx.setLineDash([8, 6]);
    overlayCtx.strokeStyle = '#3d84ff';
    overlayCtx.lineWidth = 2;
    overlayCtx.strokeRect(rect.x, rect.y, rect.width, rect.height);
    overlayCtx.setLineDash([]);
    interaction.preview = rect;
    return;
  }

  if (interaction.kind === 'draw') {
    overlayCtx.putImageData(dragSnapshot, 0, 0);
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
    drawPreviewShape(interaction.start, point);
  }
});

overlayCanvas.addEventListener('mouseup', (event) => {
  if (!interaction) {
    return;
  }

  const point = canvasPoint(event);

  if (interaction.kind === 'move') {
    commitState();
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
    const minDistance = 4;
    const distance = Math.hypot(point.x - interaction.start.x, point.y - interaction.start.y);
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
          x2: point.x,
          y2: point.y,
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
});

overlayCanvas.addEventListener('mouseleave', () => {
  if (interaction?.kind === 'draw' || interaction?.kind === 'crop') {
    redrawOverlay();
    interaction = null;
    dragSnapshot = null;
  }
});

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

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    hideAnnotationMenu();
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

document.getElementById('undo').addEventListener('click', () => {
  const state = history.undo();
  if (state) {
    restoreState(state);
  }
  document.getElementById('undo').disabled = !history.canUndo();
  document.getElementById('redo').disabled = !history.canRedo();
});

document.getElementById('redo').addEventListener('click', () => {
  const state = history.redo();
  if (state) {
    restoreState(state);
  }
  document.getElementById('undo').disabled = !history.canUndo();
  document.getElementById('redo').disabled = !history.canRedo();
});

document.getElementById('zoom-in').addEventListener('click', () => setZoom(zoom + 0.25));
document.getElementById('zoom-out').addEventListener('click', () => setZoom(zoom - 0.25));
document.getElementById('export').addEventListener('click', exportImage);

const emojiGrid = document.getElementById('emoji-grid');
EMOJIS.forEach((emoji) => {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = emoji;
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
}

(async () => {
  await Promise.all([initI18n(), initTheme()]);
  applyI18n();
  await init();
})();