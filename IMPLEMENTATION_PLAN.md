# Implementation Plan: Reddit Copilot (Chrome Extension)

Reddit Copilot is a client-side AI browser assistant that works alongside the user's Reddit experience. The extension operates strictly on explicit user actions and complies fully with Reddit policies and browser safety standards.

---

## 1. Product Positioning & Compliance Principles

### Core Identity
- **An AI Assistant for Reddit**: Operates strictly on explicit user trigger to assist with context comprehension, rule awareness, and reply/post drafting.
- **Not a Bot / Not an Automation Tool**: Does not perform automated scraping, bulk posting, automated voting, mass DMs, engagement farming, or moderation bypass.
- **Human-in-the-Loop Always**: The extension may only prepare content in the user's editor ("Insert into Comment"). The user must always review and manually execute any final Reddit action (e.g., clicking Reddit's native Submit button).
- **User-Triggered Context Extraction**: Extracts only the visible post/discussion/rule context necessary to fulfill an immediate user request. Zero background harvesting or persistent content crawling.

---

## 2. Technical Architecture (Client-Side Manifest V3)

The extension runs purely client-side without requiring background servers, databases, or complex orchestration frameworks:

```text
┌──────────────────────────────────────────────────────────────────┐
│                      CHROME BROWSER EXTENSION                    │
│                                                                  │
│  ┌──────────────────────┐              ┌──────────────────────┐  │
│  │     POPUP MENU       │              │    CONTENT SCRIPT    │  │
│  │ • Multi-Provider     │              │ • Resilient Page &   │  │
│  │   Configuration      │              │   Context Detector   │  │
│  │ • Local API Keys     │              │ • User-Triggered UI  │  │
│  └──────────┬───────────┘              │   (Sidebar / Inline) │  │
│             │ Save Key                 └──────────┬───────────┘  │
│             ▼                                     │ User Action  │
│  ┌──────────────────────┐                         │ (Analyze /   │
│  │ chrome.storage.local │◄─────────────┐          │  AI Reply)   │
│  └──────────────────────┘              │          ▼              │
│                                        │  ┌───────────────────┐  │
│                                        │  │  INJECTED COPILOT │  │
│                                        │  │  UI (CSS-Isolated)│  │
│                                        │  └───────┬───────────┘  │
│                                        │          │ Message      │
│                                        │          ▼              │
│  ┌─────────────────────────────────────┴──────────────────────┐  │
│  │                  BACKGROUND SERVICE WORKER                 │  │
│  │  • Unified AI Provider Abstraction (Gemini, Groq, OpenAI)  │  │
│  │  • Structured Prompt Templates & JSON Output Parsing       │  │
│  │  • Responsible Risk Engine ("Potential moderation risk")   │  │
│  └──────────────────────────────┬─────────────────────────────┘  │
└─────────────────────────────────┼────────────────────────────────┘
                                  │ Direct Secure HTTPS Call
                                  ▼
                    ┌───────────────────────────┐
                    │      AI PROVIDER API      │
                    │   • Google Gemini Flash   │
                    │   • Groq (Llama 3.3)      │
                    │   • OpenAI (GPT-4o-mini)  │
                    │   • DeepSeek / Ollama     │
                    └───────────────────────────┘
```

---

## 3. Directory Layout

```text
reddit-copilot/
├── extension/
│   ├── manifest.json              # Chrome Manifest V3 metadata & permissions
│   ├── popup/
│   │   ├── popup.html             # Multi-Provider settings & API key management
│   │   ├── popup.css              # Dark theme styling
│   │   └── popup.js               # Key validation, dynamic model discovery & local storage
│   ├── content/
│   │   ├── content.js             # Content script entry & action orchestrator
│   │   ├── content.css            # Scoped & isolated styles for Copilot UI
│   │   ├── context_extractor.js   # Resilient, user-triggered DOM extractor
│   │   └── ui_injector.js         # Floating Copilot badge, action drawer & inline buttons
│   ├── background/
│   │   ├── background.js          # Service worker routing messages & handling actions
│   │   ├── ai_service.js          # Multi-provider client abstraction with dynamic model discovery
│   │   └── prompts.js             # Structured prompt templates with "Why" reasoning
│   └── icons/
│       ├── icon16.png
│       ├── icon48.png
│       └── icon128.png
├── IMPLEMENTATION_PLAN.md         # Master roadmap, status tracker & revision history
└── README.md                      # Documentation & responsible use guide
```

---

## 4. Key UX & Intelligence Principles

1. **Intent-First UX**:
   - Copilot presents options based on what the user wants to accomplish:
     - *"Suggest 3 smart replies"*
     - *"Analyze post context & community rules"*
     - *"Draft engaging discussion questions"*
     - *"Preflight check draft against rules"*
2. **"Why This Recommendation?" (Explainable AI)**:
   - Every suggestion explains the strategic rationale (e.g., *"Why? The post asks for technical troubleshooting; a structured 2-step diagnosis adds immediate value without self-promotion"*).
3. **Responsible Risk Terminology**:
   - Replaces absolute claims with nuanced assessments:
     - *"Potential moderation risk"*
     - *"Potential rule conflict"*
     - *"Potential self-promotion concern"*
     - *"Potential formatting oversight"*
4. **Local Key Storage Notice**:
   - Explicit UI notice: *"Your AI provider key is stored locally in this extension for personal use and is never shared or transmitted to external servers except your selected AI provider."*

---

## 5. Phase-by-Phase Roadmap & Live Status

### ✅ Phase 1: Extension Scaffold & Multi-Provider Settings — `[COMPLETED]`
- **Status**: Completed & Verified.
- **Accomplishments**:
  - Configured `manifest.json` (Manifest V3) with `storage`, `activeTab`, and AI provider endpoints.
  - Multi-provider settings popup (`popup.html`, `popup.css`, `popup.js`) supporting Google Gemini, Groq, OpenAI, DeepSeek, and Local Ollama.
  - Dynamic model discovery integration using Google Gemini's official `ListModels` API (`v1beta/models`).
  - Added support for newest models: `gemini-3.7-flash`, `gemini-3.6-flash`, `gemini-3.5-flash`, `gemini-3.0-flash`, `gemini-2.5-flash`, `gemini-2.0-flash`, `gemini-3.7-pro`, and custom model inputs.
  - Added `options_ui` full-tab options page support.
  - Verified connection testing and persistent storage in `chrome.storage.local`.

---

### ✅ Phase 2: Resilient Page Detection & Semantic Context Extraction — `[COMPLETED]`
- **Status**: Completed & Live-Tested.
- **Accomplishments**:
  - Implemented `context_extractor.js` with multi-selector resilient extraction.
  - Extracts page type (`post_detail`, `submit_post`, `subreddit_feed`, `home_feed`).
  - Extracts visible post title, body text, subreddit name (`r/...`), and community sidebar rules.
  - Extracts active comment box / rich-text editor reference.
  - Verified on live Reddit posts (`r/DeveloperJobs`, `r/cofounderhunt`, etc.).
  - Purely on-demand execution (zero continuous background harvesting).

---

### ✅ Phase 3: Floating Copilot UI, Action Drawer & In-Page "⚡ AI Reply" — `[COMPLETED]`
- **Status**: Completed & Live-Tested.
- **Accomplishments**:
  - Injected `#rc-floating-badge` at bottom-right corner of Reddit pages.
  - Sliding action drawer (`#rc-drawer`) with full CSS isolation (`all: unset !important` resets) to prevent Reddit CSS collision.
  - Quick Action Cards:
    - 💡 **Suggest 3 Replies** (with *"Why this recommendation?"* reasoning & moderation risk flags).
    - 🔍 **Analyze Post & Rules** (discussion summary, tone, key takeaways, community guidelines).
    - ❓ **Draft Engaging Question** (thought-provoking follow-ups).
    - 🛡️ **Preflight Check Draft** (checks active editor draft against subreddit context).
  - Inline **"⚡ AI Reply"** button attached to Reddit comment composers.
  - Human-in-the-loop **"Insert into Comment"** (safely inserts text into Reddit's active editor without auto-submitting).
  - Robust `safeJsonParse` in `ai_service.js` handling all structured LLM responses.
  - Infinite DOM mutation loop protection guard (`data-rc-injected="true"` + debounced observer).

---

### ✅ Phase 4: Enhanced Multi-Perspective Reply Customization & Interactive Refinement — `[COMPLETED]`
- **Status**: Completed & Verified.
- **Accomplishments**:
  - **Live Tone Switcher in Drawer**: 💡 *Helpful*, 🤝 *Collab*, ⚡ *Pitch*, ☕ *Casual*, ❓ *Question* pills with instant re-generation.
  - **Length Controls**: ⚡ *Short (1-2 lines)*, 📄 *Standard*, 📚 *In-Depth* pills.
  - **Interactive Global Refine Box**: Input custom instructions (*"Make it shorter"*, *"Add Python tips"*) with instant AI apply.
  - **Card-Level Single Reply Refinement**: 🔄 *Refine* button on each generated reply card with inline AI prompt and single-card update.

---

### ⏳ Phase 5: Community Rule & Self-Promotion Preflight Engine — `[READY / NEXT]`
- **Scope**:
  - Deep rule-matching matrix comparing proposed drafts against visible subreddit rules.
  - Nuanced risk signals: *"Potential self-promotion concern"*, *"Potential rule conflict"*, *"Clear to post"*.
  - Line-by-line constructive refinement suggestions.

---

### ⏳ Phase 6: Post Creation Preflight (`/submit` page) — `[PLANNED]`
- **Scope**:
  - Integration on Reddit's submit page (`reddit.com/r/.../submit`).
  - Scans draft title, body, and tags/flair against community submission rules.
  - Recommends title improvements and formatting fixes before posting.

---

### ⏳ Phase 7: Local User Preferences & Extension Memory — `[PLANNED]`
- **Scope**:
  - Custom user instructions/bio (e.g. *"I am a full-stack engineer with 5 years React/Node experience"*).
  - Saved reply templates & favorite tone configurations stored locally in `chrome.storage.local`.

---

### ⏳ Phase 8: Contextual Community Matcher — `[PLANNED]`
- **Scope**:
  - Suggests the best-suited subreddits for a given topic or draft based on topical alignment.

---

### ⏳ Phase 9: Permitted Account-Aware Intelligence — `[PLANNED]`
- **Scope**:
  - Tailors suggestions using user-defined persona guidelines.

---

### ⏳ Phase 10: "What Should I Do?" AI Strategist — `[PLANNED]`
- **Scope**:
  - Feed-level opportunity scanner highlighting posts with high discussion potential.

---

### ⏳ Phase 11: Cross-Session Local Personalization — `[PLANNED]`
- **Scope**:
  - Local heuristic learning of preferred response patterns that received user approval.

---

### ⏳ Phase 12: Production Polish, Shortcuts & Packaging — `[PLANNED]`
- **Scope**:
  - Keyboard shortcut (`Ctrl+Shift+R`) to toggle drawer.
  - Chrome Web Store compliant package and final distribution zip.

---

## 6. Verification & Testing Matrix

| Phase | Feature | Status | Verification Method |
|---|---|---|---|
| **Phase 1** | Multi-Provider Settings & BYOK | ✅ Passed | Dynamic Gemini model list & connection test |
| **Phase 1** | Newest Models (3.7/3.6/3.5/2.5 Flash) | ✅ Passed | Added to metadata and tested against API |
| **Phase 2** | Semantic Context Extractor | ✅ Passed | Verified on live Reddit posts in DevTools |
| **Phase 3** | Floating Badge & Action Drawer | ✅ Passed | Rendered and interactive on live Reddit |
| **Phase 3** | CSS Isolation & Reset | ✅ Passed | Buttons and text styled cleanly without clipping |
| **Phase 3** | Suggest 3 Replies with "Why?" | ✅ Passed | Structured JSON parsing & drawer cards |
| **Phase 3** | Human-in-the-Loop "Insert" | ✅ Passed | Text inserted safely into comment box |
| **Phase 3** | MutationObserver Infinite Loop Fix | ✅ Passed | Guarded with dataset flag & 800ms debounce |
