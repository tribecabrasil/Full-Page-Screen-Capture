# Chrome Web Store — Listing Checklist

Use this guide when publishing **Full Page Screen Capture**.

## Required assets

| Asset | Size | Notes |
|:---|:---|:---|
| Extension icon | 128×128 | `icons/icon128.png` |
| Screenshots | 1280×800 or 640×400 | Minimum 1, recommended 5 |
| Promo tile (optional) | 440×280 | Marketing banner |
| Small promo tile (optional) | 140×140 | |

## Suggested screenshots

1. **Popup** — capture mode chooser (full page vs visible area)
2. **Result tab** — toolbar with download, PDF, edit
3. **Editor** — sidebar tools, blur/pixelate, formatting panel
4. **Options** — theme, language, capture settings
5. **Dark mode** — result or editor in dark theme

## Short description (132 chars max)

```
Capture full pages or visible areas. Edit, blur, export PNG/JPEG/PDF. No ads, minimal permissions.
```

## Detailed description (starter)

Full Page Screen Capture lets you screenshot an entire web page or only the visible viewport — reliably, with minimal Chrome permissions.

**Capture**
- Full-page scroll-and-stitch
- Visible area (no scrolling)
- Optional 3s / 5s delay before capture

**Result tab**
- Download PNG or JPEG
- Export PDF
- Copy to clipboard
- Open built-in editor

**Editor**
- Crop, shapes, text, emojis
- Blur and pixelate sensitive regions
- Undo/redo with optimized history
- Light / dark theme toggle

**Privacy**
- No analytics or remote servers
- Captures stored locally in your browser
- See [PRIVACY.md](../PRIVACY.md)

## Privacy practices (Chrome Web Store form)

- **Single purpose:** Full-page and viewport screen capture with local editing/export
- **Data usage:** No data sold; no remote collection
- **Permissions justification:** Documented in [SECURITY.md](../SECURITY.md)

## Version sync

Keep `manifest.json` version aligned with [README.md](../README.md) changelog before each store upload.