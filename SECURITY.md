# Security Policy

## Overview

Full Page Screen Capture is designed with **minimal permissions**:

- `activeTab` — temporary access only when you invoke the extension
- No `host_permissions` — no blanket access to all websites
- No analytics, ads, or remote telemetry endpoints
- Captures are stored locally in the browser (IndexedDB) and are not uploaded to any server

## What is intentionally public

- Developer contact email (`flvp@me.com`) in README and issue-report flow
- Open-source source code on GitHub

## What must never be committed

- API keys, tokens, passwords, or private keys
- `.env` files with secrets
- Packaged builds containing embedded credentials

## Reporting a vulnerability

Email [flvp@me.com](mailto:flvp@me.com) with:

1. Description of the issue
2. Steps to reproduce
3. Chrome version and extension version