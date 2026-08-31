# Reddit Copilot (Chrome Extension)

Reddit Copilot is a browser-based AI assistant that works alongside the user's Reddit browsing experience. The extension is designed around explicit user actions and uses only data and capabilities permitted by Reddit's current policies and available browser context.

---

## Current Status: Phase 1 (Extension Scaffold & Settings)

- **Phase 1 (Extension Scaffold & AI Settings)**: ✅ Complete
- **Phase 2 (Page Detection & User-Triggered Context)**: 🔄 Next Up

---

## Phase 1 Features

1. **Manifest V3 Extension Core**:
   - Lightweight, purely client-side architecture.
   - Declarative permissions (`storage`, `activeTab`) and domain host permissions for `reddit.com` and AI provider APIs.
2. **Multi-Provider AI Settings**:
   - Supports **Google Gemini** (`gemini-1.5-flash`, `gemini-2.0-flash`, `gemini-1.5-pro`), **Groq (Free Llama 3.3)**, **OpenAI (GPT-4o-mini)**, **DeepSeek (V3/R1)**, and **Local Ollama**.
   - Direct connection validation with **"Test Connection"** ping button.
   - Response tone customization (Helpful & Technical, Conversational & Friendly, Question & Engagement).
3. **Security & Privacy**:
   - API keys are stored locally on your device via `chrome.storage.local`.
   - Keys are never exposed to Reddit web pages or third-party servers.

---

## Project Structure

```text
reddit-copilot/
└── extension/
    ├── manifest.json              # Manifest V3 metadata
    ├── popup/
    │   ├── popup.html             # Settings popup UI
    │   ├── popup.css              # Dark theme styling
    │   └── popup.js               # Settings controller & validation
    ├── content/
    │   ├── content.js             # Injected script
    │   └── content.css            # Extension styling
    ├── background/
    │   ├── background.js          # Service worker
    │   └── ai_service.js          # Unified AI provider client
    └── icons/
        ├── icon16.png
        ├── icon48.png
        └── icon128.png
```

---

## How to Install & Test in Chrome (Phase 1)

1. Open **Google Chrome** and navigate to:
   ```text
   chrome://extensions
   ```
2. Enable **Developer mode** (toggle switch in the top-right corner).
3. Click **"Load unpacked"** in the top-left corner.
4. Select the folder:
   ```text
   e:\Reddit Copilot\extension
   ```
5. Click the **Reddit AI Copilot** extension icon from your Chrome toolbar:
   - Select your AI Provider (e.g. **Google Gemini** or **Groq**).
   - Paste your API Key.
   - Click **"Test Connection"** to verify that your key connects successfully.
   - Click **"Save Settings"**.
