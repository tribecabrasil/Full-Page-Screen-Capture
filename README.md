<p align="center">
  <img src="icons/icon128.png" alt="Full Page Screen Capture" width="96" />
</p>

<h1 align="center">📷 Full Page Screen Capture</h1>

<p align="center">
  <strong>Capture full-page screenshots — reliably, with minimal permissions, and no ads.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Chrome-MV3-4285F4?style=for-the-badge&logo=googlechrome&logoColor=white" alt="Chrome MV3" />
  <img src="https://img.shields.io/badge/License-MIT-22C55E?style=for-the-badge" alt="MIT License" />
  <img src="https://img.shields.io/badge/Languages-9-F59E0B?style=for-the-badge" alt="9 Languages" />
  <img src="https://img.shields.io/badge/Theme-Light%20%2F%20Dark-111111?style=for-the-badge" alt="Light and Dark theme" />
  <img src="https://img.shields.io/badge/Font-Inter-000000?style=for-the-badge" alt="Inter font" />
  <img src="https://img.shields.io/badge/Permissions-Minimal-8B5CF6?style=for-the-badge" alt="Minimal Permissions" />
</p>

<p align="center">
  Click the extension icon (or press <code>Alt+Shift+P</code>), watch each part of the page get captured,<br/>
  and open a <strong>result tab</strong> where you can download <strong>PNG / JPEG / PDF</strong> or edit the screenshot.
</p>

---

## 👨‍💻 Developer

<table>
  <tr>
    <td width="48">👤</td>
    <td>
      <strong>Flavio Paulino</strong><br/>
      Founder, <a href="https://tripaulx.com">tripaulx.com</a><br/>
      ✉️ <a href="mailto:flvp@me.com">flvp@me.com</a>
    </td>
  </tr>
</table>

### 🤖 Built with

This extension was implemented using **Grok Build** and **Composer 2.5** as AI-assisted development tools during execution, under the direction of Flavio Paulino.

---

## ✨ Features

| | Feature |
|:---:|:---|
| 🖱️ | **One-click full-page capture** from the toolbar icon or keyboard shortcut |
| 🧩 | **Scroll-and-stitch engine** that assembles the entire page into a single image |
| 🎯 | **Advanced page handling** for fixed headers, inner scroll regions, and same-origin iframes |
| ✂️ | **Automatic image splitting** when a page exceeds Chrome canvas limits |
| 🖼️ | **Result tab** with download, PDF export, edit, delete, copy, and issue reporting |
| 🎨 | **Built-in editor** with crop, shapes, highlight, text, emojis, live formatting, undo/redo, and drag-to-move |
| 📤 | **Configurable exports** — PNG, JPEG, PDF (A4, Letter, Legal, A3), auto-download, smart PDF splitting |
| 🌓 | **Light / dark theme** with system preference support |
| 🌍 | **9 languages** with manual language picker in options |
| 🔒 | **Minimal permissions** — no `host_permissions`; uses `activeTab` only when you invoke the extension |

---

## 🎨 UI & UX

Modern, consistent interface across every screen — popup, result tab, editor, options, and welcome page.

### Design system

| | Detail |
|:---:|:---|
| 🔤 | **Inter** font across all extension pages |
| ⬛ | **Monochrome palette** — pure black (`#000000`) and near-black grays |
| 🌓 | **Themes** — System, Light, or Dark (saved in options, synced live across tabs) |
| 🧱 | **Shared components** — toolbars, cards, buttons, forms via `src/shared/theme.css` |
| 📐 | **Consistent spacing** — rounded corners, subtle shadows, clear visual hierarchy |

### Popup & result tab

- Gradient header with capture progress bar
- Sticky toolbar on the result tab with primary actions
- Status messages for PDF generation and errors
- Drag image to desktop or `Cmd/Ctrl+S` to save

### Options page

- Card-based layout with elevated surfaces
- **Theme** selector — System / Light / Dark *(auto-saves)*
- **Language** selector — Auto or any of the 9 supported locales *(auto-saves)*
- Grouped settings for image, PDF, editor defaults, and general preferences

### Editor UX highlights

The editor was redesigned for clarity — tools, shapes, and formatting are **always visible** in one sidebar (no hidden tabs).

| | Improvement |
|:---:|:---|
| 🧰 | **Unified sidebar** — Tools, Shapes, Formatting, Export options, and Emojis in a single scrollable panel |
| 🎯 | **Tool cards** — icon + label grid for Select, Crop, Highlight, Text, and all shapes |
| 🖌️ | **Live format panel** — color swatches, color picker, thickness slider, and live preview |
| 💡 | **Contextual hints** — toolbar shows what the active tool does |
| ✅ | **"Active" badge** — format panel highlights when a drawable tool or shape is selected |
| 🖱️ | **Smart drag** — click any existing item to drag it, from any tool except Crop |
| 🧲 | **Auto-select** — newly placed emojis, text, and shapes are selected immediately |
| ↩️ | **Full undo for crop** — history stores canvas image + annotations, so crop is fully reversible |
| ✏️ | **Edit selected shapes** — change color and thickness on an existing annotation in real time |
| 📦 | **Collapsible sections** — URL/browser frame and date stamp tucked in expandable panels |

---

## 🌐 Supported languages

<p align="center">
  <img src="https://img.shields.io/badge/🇺🇸_en-English-3B82F6?style=flat-square" alt="English" />
  <img src="https://img.shields.io/badge/🇧🇷_pt__BR-Português-22C55E?style=flat-square" alt="Português" />
  <img src="https://img.shields.io/badge/🇪🇸_es-Español-EF4444?style=flat-square" alt="Español" />
  <img src="https://img.shields.io/badge/🇮🇳_hi-हिन्दी-F59E0B?style=flat-square" alt="Hindi" />
  <img src="https://img.shields.io/badge/🇫🇷_fr-Français-8B5CF6?style=flat-square" alt="Français" />
  <img src="https://img.shields.io/badge/🇮🇹_it-Italiano-EC4899?style=flat-square" alt="Italiano" />
  <img src="https://img.shields.io/badge/🇩🇪_de-Deutsch-0EA5E9?style=flat-square" alt="Deutsch" />
  <img src="https://img.shields.io/badge/🇯🇵_ja-日本語-A855F7?style=flat-square" alt="日本語" />
  <img src="https://img.shields.io/badge/🇨🇳_zh__CN-简体中文-E11D48?style=flat-square" alt="简体中文" />
</p>

| 🏳️ Locale | 🗣️ Language | 📁 Folder |
|:---:|:---|:---|
| `en` | 🇺🇸 English *(default)* | `_locales/en/` |
| `pt_BR` | 🇧🇷 Português (Brasil) | `_locales/pt_BR/` |
| `es` | 🇪🇸 Español | `_locales/es/` |
| `hi` | 🇮🇳 हिन्दी (Hindi) | `_locales/hi/` |
| `fr` | 🇫🇷 Français | `_locales/fr/` |
| `it` | 🇮🇹 Italiano | `_locales/it/` |
| `de` | 🇩🇪 Deutsch | `_locales/de/` |
| `ja` | 🇯🇵 日本語 | `_locales/ja/` |
| `zh_CN` | 🇨🇳 简体中文 | `_locales/zh_CN/` |

> 💡 **Auto** follows Chrome's browser language. Pick a language manually in **Options → General → Language**. Changes apply instantly and persist across sessions.

---

## 📦 Installation (development)

```
1️⃣  Open chrome://extensions
2️⃣  Enable Developer mode
3️⃣  Click Load unpacked
4️⃣  Select this folder: full-page-screen-capture
```

✅ **No build step required.**

### 🧪 Tests

```bash
npm test
```

Runs unit tests for URL validation, i18n placeholder formatting, and mask pixelation.

---

## 🚀 Usage

### 📸 Capture a page

| Step | Action |
|:---:|:---|
| 1️⃣ | Open any normal web page (`http`, `https`, `ftp`, or `file`) |
| 2️⃣ | Click the **Full Page Screen Capture** icon in the toolbar |
| 3️⃣ | Or press **`Alt+Shift+P`** *(may vary by platform)* |
| 4️⃣ | Wait for the progress popup to finish |
| 5️⃣ | A **result tab** opens with your full-page screenshot |

### 🛠️ Result tab actions

| Icon | Action | Description |
|:---:|:---|:---|
| ✏️ | **Edit** | Open the annotation editor |
| 📄 | **PDF** | Export to PDF with smart page splitting |
| ⬇️ | **Download** | Save as PNG or JPEG *(per options)* |
| 📋 | **Copy** | Copy image to clipboard *(via menu)* |
| 🗑️ | **Delete** | Remove capture and close tab |
| 🐛 | **Report** | Send issue report via email |
| ⚙️ | **Settings** | Open extension options |

### 🎨 Editor workflow

| Step | Action |
|:---:|:---|
| 1️⃣ | Pick a **tool** or **shape** from the sidebar grid |
| 2️⃣ | Set **color** and **thickness** in the format panel *(visible right below shapes)* |
| 3️⃣ | Click and drag on the image to draw, or click to place text/emojis |
| 4️⃣ | **Drag** any item immediately — click it and move *(auto-selects after insert)* |
| 5️⃣ | **Undo / Redo** for annotations and crops |
| 6️⃣ | **Export** with optional browser frame, URL bar, and date stamp |

| Tool | How to use |
|:---|:---|
| 🖱️ **Select** | Click and drag items to reposition; click empty area to deselect |
| ✂️ **Crop** | Click and drag a region; **Undo** restores the full image |
| 🖍️ **Highlight** | Click and drag a highlight box |
| 🔤 **Text** | Click on the image, enter text, then drag to reposition |
| ⬜ **Shapes** | Pick Rectangle, Arrow, Circle, or Freehand, then drag on the image |
| 🎨 **Format** | Use swatches or picker; applies to new shapes or the selected item |
| 😀 **Emojis** | Pick an emoji, click to place, then drag to move |
| ❌ **Delete** | Right-click an element → **Delete** *(or `Delete` / `Backspace` when selected)* |
| 💾 **Export** | Download edited screenshot with optional frame and URL overlay |

---

## ⚙️ Options

Open via the gear icon on the result tab, or `chrome://extensions` → **Extension options**.

| Section | Settings |
|:---|:---|
| 🖼️ **Image export** | PNG/JPEG format, JPEG quality, auto-download, Save As dialog |
| 📄 **PDF export** | Paper size, orientation, smart page splitting |
| 🎨 **Editor defaults** | Browser frame style, URL placement, date stamp |
| 🔧 **General** | **Theme** (System / Light / Dark), **Language** (Auto or manual), welcome page on install |

> 💡 Theme and language changes **save automatically** and update open extension tabs in real time.

---

## 🔐 Permissions

| Permission | Why |
|:---|:---|
| `activeTab` | 🔑 Temporary access to the current tab when you click the icon or use the shortcut |
| `scripting` | 💉 Inject scroll-and-capture scripts on demand |
| `storage` / `unlimitedStorage` | 💾 Save options, theme, locale, and capture metadata |
| `offscreen` | 🧵 Stitch large images off the main UI thread |
| `downloads` *(optional)* | ⬇️ Native download dialog when enabled |

<p align="center">
  <img src="https://img.shields.io/badge/✅_No_host_permissions-Least_privilege_model-22C55E?style=for-the-badge" alt="No host permissions" />
</p>

---

## 🏗️ Architecture

```
👆 User click / Alt+Shift+P
        ↓
   🪟 Popup (capture orchestration + activeTab)
        ↓
 📜 Content script (scroll grid, fixed elements, iframes)
        ↓
 📷 captureVisibleTab (rate-limited, ~2/sec)
        ↓
 🧵 Offscreen document (canvas stitch)
        ↓
 💾 IndexedDB storage → 🖼️ Result tab → ✏️ Editor / 📄 PDF / ⬇️ Download
```

### 📁 Project structure

```
full-page-screen-capture/
├── 🌍 _locales/          # en, pt_BR, es, hi, fr, it, de, ja, zh_CN
├── 🎨 icons/
├── 📋 manifest.json
├── src/
│   ├── background/    # MV3 service worker, capture orchestrator
│   ├── capture/       # Injected scroll & page-handling scripts
│   ├── stitch/        # Canvas stitching & image splitting
│   ├── offscreen/     # Offscreen stitch worker
│   ├── popup/         # Capture progress UI
│   ├── result/        # Result tab
│   ├── editor/        # Annotation editor (tools, shapes, format panel)
│   ├── options/       # Settings page (theme, language, exports)
│   ├── export/        # PNG, JPEG, PDF export
│   ├── welcome/       # First-install welcome page
│   └── shared/        # i18n, theme, locales, storage, messaging
└── 📖 README.md
```

---

## 🚫 Restricted pages

The extension **cannot** capture:

- ❌ `chrome://` pages *(Web Store, settings, etc.)*
- ❌ `chrome-extension://` pages
- ❌ Other restricted browser internal URLs

> 🔄 Reload the target page if capture fails after installing the extension.

---

## 🔧 Troubleshooting

| ⚠️ Issue | ✅ Solution |
|:---|:---|
| "Something went wrong" on capture | Reload the page, then try again. Check the error detail in the popup. |
| Quota / rate limit errors | The extension throttles captures to respect Chrome limits. Wait and retry. |
| PDF fails on very long pages | Use PNG export; PDF is limited to 200 pages. |
| Editor shapes not visible | **Click and drag** on the image after selecting a shape. |
| Can't drag an item after placing it | Click the item and drag — it auto-selects after insert. Works from any tool except Crop. |
| Crop can't be undone | Reload the extension to get the latest version; undo now restores the full canvas image. |
| Language not changing | Set language in **Options → General → Language**, or configure Chrome at `chrome://settings/languages`. |
| Theme not updating | Choose **System / Light / Dark** in **Options → General → Theme** and reload open tabs. |

---

## 🙏 Credits & attribution

### 💡 Algorithm inspiration

Capture scroll-and-stitch logic is inspired by the MIT-licensed open source project:

**[mrcoles/full-page-screen-capture-chrome-extension](https://github.com/mrcoles/full-page-screen-capture-chrome-extension)**

### 👥 Development

| Role | Detail |
|:---|:---|
| 👨‍💻 **Developer** | Flavio Paulino — [tripaulx.com](https://tripaulx.com) |
| ✉️ **Contact** | [flvp@me.com](mailto:flvp@me.com) |
| 🤖 **AI tooling** | Grok Build, Composer 2.5 |

---

## 🛡️ Security

See [SECURITY.md](SECURITY.md) for the security model, what data stays local, and how to report issues.

**Pre-publish audit summary:**

| Status | Item |
|:---:|:---|
| ✅ | No API keys, tokens, passwords, or private keys in the codebase |
| ✅ | No remote telemetry or third-party analytics endpoints |
| ✅ | No `host_permissions` — least-privilege `activeTab` model |
| ✅ | Issue reports use `mailto:` only; user chooses what to send |
| 📦 | Third-party dependency: [jsPDF](https://github.com/parallax/jsPDF) *(bundled in `src/vendor/`, MIT license)* |

---

## 📜 License

Released under the [MIT License](LICENSE).

This project builds upon concepts from the MIT-licensed [full-page-screen-capture-chrome-extension](https://github.com/mrcoles/full-page-screen-capture-chrome-extension) by Peter Coles.

---

## 📋 Changelog

### 1.3.1

- 💬 **Tooltips** across editor, popup, result, and options (9 languages, shortcuts included)
- 🖱️ **Smoother drag** — pointer release outside the canvas now finishes move/crop/draw correctly
- 🧪 **Unit tests** for `url-validator`, `format-message`, and pixelate mask effects

### 1.3.0

- 🫥 **Blur & pixelate tools** — mask sensitive regions directly on the screenshot
- 📋 **Copy from editor** — one-click clipboard export with toast feedback
- 🌓 **Theme toggle** in editor and result toolbars (system → light → dark)
- ⏱️ **Capture delay** option (0 / 3 / 5 seconds) with countdown in popup
- 🔔 **Toast notifications** for copy and export actions
- ⌨️ **Editor polish** — `B`/`P` mask tools, `+`/`-` zoom, Shift-snap arrows to 45°
- 📄 **Chrome Web Store prep** — `PRIVACY.md` and `store/LISTING.md`

### 1.2.0

- 📐 **Visible area capture** — capture only the current viewport without scrolling
- 🎯 **Capture mode chooser** in the popup (full page vs visible area)
- ⚙️ **Default capture mode** option for the keyboard shortcut (Alt+Shift+P)
- 💬 **Text dialog** in the editor — replaces the browser `prompt()`
- ⌨️ **Editor keyboard shortcuts** — undo/redo, tool switching (V/C/H/T), Escape
- 🧠 **Optimized undo history** — canvas PNG stored only on load and crop, not every annotation

### 1.1.0

- 🎨 **UI overhaul** — Inter font, shared design system, light/dark/system themes
- ⬛ **Monochrome palette** — pure black and near-black grays across all pages
- 🌍 **Manual language picker** in options with live sync across tabs
- ✏️ **Editor UX redesign** — unified sidebar, always-visible format panel, color swatches, live preview, contextual hints
- 🖱️ **Drag improvements** — auto-select after insert, drag from any tool, larger hit targets
- ↩️ **Crop undo fix** — history stores full canvas state (image + annotations)
- ✏️ **Live format editing** — change color/thickness on selected shapes

### 1.0.2

- 🌍 Added German (`de`), Japanese (`ja`), and Simplified Chinese (`zh_CN`) translations

### 1.0.1

- 🌍 Added Hindi (`hi`), French (`fr`), and Italian (`it`) translations
- 📖 Visual README refresh with badges, emojis, and color accents

### 1.0.0

- 🎉 Initial release
- 📷 Full-page capture with MV3, offscreen stitching, result tab, PDF export, editor
- 🌍 Internationalization: English, Portuguese (Brazil), Spanish
- ⏱️ Rate-limited capture for Chrome quota compliance
- 🎨 Editor: shapes, emojis, drag, right-click delete