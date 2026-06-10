# Privacy Policy — Full Page Screen Capture

**Last updated:** June 10, 2026  
**Developer:** Flavio Paulino — [flvp@me.com](mailto:flvp@me.com)

## Summary

Full Page Screen Capture does **not** collect, store, or transmit your personal data to any server operated by the developer. All capture processing happens locally in your browser.

## Data the extension handles

| Data | Where it stays | Shared? |
|:---|:---|:---:|
| Screenshots you capture | Browser IndexedDB (local) | No |
| Extension settings | `chrome.storage.sync` (your Google account sync) | No (Google sync only) |
| Page URL and title at capture time | Stored with each capture locally | No |

## Permissions

- **activeTab** — access to the current tab only when you click the icon or use the keyboard shortcut
- **scripting** — inject scroll/capture helpers during an active capture session
- **storage / unlimitedStorage** — save captures and settings locally
- **offscreen** — stitch tiles into a single image in a background document
- **downloads** (optional) — save files when you choose to download

The extension requests **no** `host_permissions` and does not run on pages until you invoke it.

## Third parties

- **jsPDF** (bundled, MIT) — used only for local PDF export; no network calls
- **Google Fonts** — Inter font may load from Google when online (see options to use system fonts in future releases)

## Issue reports

The **Report issue** feature opens your email client with a pre-filled `mailto:` message. You choose whether to send it and what to include.

## Children's privacy

This extension is not directed at children under 13 and does not knowingly collect information from children.

## Changes

Material changes to this policy will be noted in the GitHub repository changelog.

## Contact

Questions about privacy: [flvp@me.com](mailto:flvp@me.com)