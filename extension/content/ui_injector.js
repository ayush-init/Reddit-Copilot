/**
 * Reddit AI Copilot - UI Injector
 * Creates floating badge, collapsible side drawer, inline "⚡ AI Reply" buttons,
 * and auto-opening smart comment box inserter.
 */

const UIInjector = {
  drawerElement: null,
  badgeElement: null,
  isDrawerOpen: false,
  observerTimeout: null,

  /**
   * Initializes and injects all UI components into the Reddit page.
   */
  init(callbacks = {}) {
    this.callbacks = callbacks;
    this.injectFloatingBadge();
    this.injectDrawer();
    this.injectInlineCommentButtons();

    // Debounced observer to prevent mutation loops
    const observer = new MutationObserver((mutations) => {
      const isOurMutation = mutations.every((m) => {
        const t = m.target;
        return (
          t &&
          (t.id === "rc-drawer" ||
            t.id === "rc-floating-badge" ||
            (t.classList && t.classList.contains("rc-inline-reply-btn")) ||
            (t.closest && (t.closest("#rc-drawer") || t.closest("#rc-floating-badge"))))
        );
      });

      if (isOurMutation) return;

      if (this.observerTimeout) clearTimeout(this.observerTimeout);
      this.observerTimeout = setTimeout(() => {
        this.injectInlineCommentButtons();
      }, 800);
    });

    observer.observe(document.body, { childList: true, subtree: true });
  },

  /**
   * Injects the floating sidebar badge on the right edge of the screen.
   */
  injectFloatingBadge() {
    if (document.getElementById("rc-floating-badge")) return;

    const badge = document.createElement("div");
    badge.id = "rc-floating-badge";
    badge.className = "rc-floating-badge";
    badge.innerHTML = `
      <div class="rc-badge-icon">⚡</div>
      <span class="rc-badge-text">Copilot</span>
    `;

    badge.addEventListener("click", () => {
      this.toggleDrawer();
    });

    document.body.appendChild(badge);
    this.badgeElement = badge;
  },

  /**
   * Injects the Copilot Action Drawer.
   */
  injectDrawer() {
    if (document.getElementById("rc-drawer")) return;

    const drawer = document.createElement("aside");
    drawer.id = "rc-drawer";
    drawer.className = "rc-drawer rc-drawer-closed";
    drawer.innerHTML = `
      <div class="rc-drawer-header">
        <div class="rc-drawer-brand">
          <span class="rc-drawer-logo">r/</span>
          <div>
            <h2 class="rc-drawer-title">Reddit Copilot</h2>
            <span class="rc-drawer-subreddit" id="rc-current-subreddit">r/...</span>
          </div>
        </div>
        <button type="button" class="rc-close-btn" id="rc-close-drawer" title="Close Panel">&times;</button>
      </div>

      <div class="rc-drawer-body">
        <!-- Persona Quick Status Banner -->
        <div class="rc-persona-banner" id="rc-persona-banner">
          <div class="rc-persona-header">
            <span class="rc-persona-label">👤 My Active Persona</span>
            <button type="button" class="rc-persona-edit-toggle" id="rc-persona-toggle">Edit Persona</button>
          </div>
          <div class="rc-persona-text" id="rc-persona-preview">Personalized to your background & domain expertise.</div>
          <div class="rc-persona-edit-box hidden" id="rc-persona-edit-box">
            <textarea id="rc-drawer-persona-input" rows="2" placeholder="e.g. Full Stack & AI Engineer, 5+ yrs in SaaS, React/Python..."></textarea>
            <button type="button" id="rc-save-drawer-persona" class="rc-save-persona-btn">Save Persona</button>
          </div>
        </div>

        <!-- Intent Prompt Section -->
        <div class="rc-section-header">
          <span class="rc-section-title">What do you want to do?</span>
        </div>

        <div class="rc-action-grid">
          <button type="button" class="rc-action-card" data-action="suggest_replies">
            <div class="rc-action-icon">💡</div>
            <div class="rc-action-info">
              <span class="rc-action-label">Suggest 3 Replies</span>
              <span class="rc-action-sub">Personalized to your persona</span>
            </div>
          </button>

          <button type="button" class="rc-action-card" data-action="analyze_post">
            <div class="rc-action-icon">🔍</div>
            <div class="rc-action-info">
              <span class="rc-action-label">Summarize & Analyze</span>
              <span class="rc-action-sub">Post core intent & guidelines</span>
            </div>
          </button>

          <button type="button" class="rc-action-card" data-action="draft_question">
            <div class="rc-action-icon">❓</div>
            <div class="rc-action-info">
              <span class="rc-action-label">Draft Engaging Question</span>
              <span class="rc-action-sub">Thought-provoking discussion starter</span>
            </div>
          </button>

          <button type="button" class="rc-action-card" data-action="preflight_check">
            <div class="rc-action-icon">🛡️</div>
            <div class="rc-action-info">
              <span class="rc-action-label">Preflight Check Draft</span>
              <span class="rc-action-sub">Check your draft against rules</span>
            </div>
          </button>
        </div>

        <!-- Dynamic Output Container -->
        <div class="rc-results-container" id="rc-results-container">
          <div class="rc-empty-state" id="rc-empty-state">
            <div class="rc-empty-icon">⚡</div>
            <p>Select an action above to analyze this discussion with AI.</p>
          </div>

          <div class="rc-loading-state hidden" id="rc-loading-state">
            <div class="rc-spinner"></div>
            <span id="rc-loading-text">Analyzing Reddit discussion...</span>
          </div>

          <div class="rc-results-content hidden" id="rc-results-content"></div>
        </div>
      </div>

      <div class="rc-drawer-footer">
        <span>Explicit User Actions &bull; Human-in-the-Loop</span>
      </div>
    `;

    document.body.appendChild(drawer);
    this.drawerElement = drawer;

    // Attach drawer events
    drawer.querySelector("#rc-close-drawer").addEventListener("click", () => {
      this.closeDrawer();
    });

    // Persona Quick Editor in Drawer
    const personaToggle = drawer.querySelector("#rc-persona-toggle");
    const personaEditBox = drawer.querySelector("#rc-persona-edit-box");
    const drawerPersonaInput = drawer.querySelector("#rc-drawer-persona-input");
    const savePersonaBtn = drawer.querySelector("#rc-save-drawer-persona");
    const personaPreview = drawer.querySelector("#rc-persona-preview");

    if (personaToggle && personaEditBox) {
      personaToggle.addEventListener("click", () => {
        personaEditBox.classList.toggle("hidden");
      });
    }

    if (savePersonaBtn && drawerPersonaInput) {
      savePersonaBtn.addEventListener("click", () => {
        const newPersona = drawerPersonaInput.value.trim();
        chrome.storage.local.get("settings", (res) => {
          const settings = res.settings || {};
          settings.persona = newPersona;
          chrome.storage.local.set({ settings }, () => {
            if (personaPreview) {
              personaPreview.textContent = newPersona || "Personalized to your background & domain expertise.";
            }
            personaEditBox.classList.add("hidden");
            savePersonaBtn.textContent = "✓ Saved!";
            setTimeout(() => {
              savePersonaBtn.textContent = "Save Persona";
            }, 1500);
          });
        });
      });
    }

    drawer.querySelectorAll(".rc-action-card").forEach((btn) => {
      btn.addEventListener("click", () => {
        const action = btn.getAttribute("data-action");
        if (this.callbacks.onActionTriggered) {
          this.callbacks.onActionTriggered(action);
        }
      });
    });
  },

  /**
   * Injects inline "⚡ AI Reply" button next to Reddit comment inputs safely.
   */
  injectInlineCommentButtons() {
    const composerContainers = document.querySelectorAll(
      "shreddit-composer, div[data-testid='comment-submission-form-rich-text'], div[data-testid='post-composer']"
    );

    composerContainers.forEach((container) => {
      if (container.dataset.rcInjected === "true") return;
      if (container.querySelector(".rc-inline-reply-btn") || container.parentElement?.querySelector(".rc-inline-reply-btn")) {
        container.dataset.rcInjected = "true";
        return;
      }

      container.dataset.rcInjected = "true";

      const inlineBtn = document.createElement("button");
      inlineBtn.type = "button";
      inlineBtn.className = "rc-inline-reply-btn";
      inlineBtn.innerHTML = `<span>⚡ AI Reply</span>`;

      inlineBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.openDrawer();
        if (this.callbacks.onActionTriggered) {
          this.callbacks.onActionTriggered("suggest_replies");
        }
      });

      const targetArea = container.querySelector("div[slot='actions']") || container;
      targetArea.appendChild(inlineBtn);
    });
  },

  /**
   * Toggles drawer open/closed state.
   */
  toggleDrawer() {
    if (this.isDrawerOpen) {
      this.closeDrawer();
    } else {
      this.openDrawer();
    }
  },

  openDrawer() {
    if (!this.drawerElement) this.injectDrawer();
    this.drawerElement.classList.remove("rc-drawer-closed");
    this.drawerElement.classList.add("rc-drawer-open");
    this.isDrawerOpen = true;

    // Load active persona into drawer preview
    chrome.storage.local.get("settings", (res) => {
      const settings = res.settings || {};
      const preview = document.getElementById("rc-persona-preview");
      const drawerInput = document.getElementById("rc-drawer-persona-input");
      if (settings.persona) {
        if (preview) preview.textContent = `"${settings.persona.substring(0, 80)}${settings.persona.length > 80 ? '...' : ''}"`;
        if (drawerInput) drawerInput.value = settings.persona;
      } else {
        if (preview) preview.textContent = "No personal bio set. Click 'Edit Persona' to customize.";
      }
    });

    if (window.ContextExtractor) {
      const sub = window.ContextExtractor.extractSubredditName();
      const subEl = document.getElementById("rc-current-subreddit");
      if (subEl) subEl.textContent = sub;
    }
  },

  closeDrawer() {
    if (!this.drawerElement) return;
    this.drawerElement.classList.remove("rc-drawer-open");
    this.drawerElement.classList.add("rc-drawer-closed");
    this.isDrawerOpen = false;
  },

  /**
   * Sets loading state in drawer.
   */
  setLoading(isLoading, text = "Analyzing Reddit discussion...") {
    const emptyState = document.getElementById("rc-empty-state");
    const loadingState = document.getElementById("rc-loading-state");
    const resultsContent = document.getElementById("rc-results-content");
    const loadingText = document.getElementById("rc-loading-text");

    if (isLoading) {
      if (emptyState) emptyState.classList.add("hidden");
      if (resultsContent) resultsContent.classList.add("hidden");
      if (loadingState) {
        loadingState.classList.remove("hidden");
        if (loadingText) loadingText.textContent = text;
      }
    } else {
      if (loadingState) loadingState.classList.add("hidden");
    }
  },

  /**
   * Renders structured AI results inside drawer.
   */
  renderResults(htmlContent) {
    this.setLoading(false);
    const emptyState = document.getElementById("rc-empty-state");
    const resultsContent = document.getElementById("rc-results-content");

    if (emptyState) emptyState.classList.add("hidden");
    if (resultsContent) {
      resultsContent.innerHTML = htmlContent;
      resultsContent.classList.remove("hidden");
      this.attachResultButtonEvents();
    }
  },

  /**
   * Binds click handlers to "Insert into Comment" and "Copy Text" buttons.
   */
  attachResultButtonEvents() {
    const resultsContent = document.getElementById("rc-results-content");
    if (!resultsContent) return;

    // Handle "Insert into Comment" with Smart Auto-Open
    resultsContent.querySelectorAll(".rc-insert-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const text = btn.getAttribute("data-text");
        btn.textContent = "Opening & Inserting...";
        this.smartInsertIntoCommentBox(text, (success) => {
          if (success) {
            btn.textContent = "✓ Inserted in Box!";
          } else {
            btn.textContent = "✓ Copied to Clipboard!";
          }
          setTimeout(() => {
            btn.textContent = "Insert into Comment";
          }, 2500);
        });
      });
    });

    // Handle "Copy Text"
    resultsContent.querySelectorAll(".rc-copy-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const text = btn.getAttribute("data-text");
        navigator.clipboard.writeText(text).then(() => {
          btn.textContent = "✓ Copied!";
          setTimeout(() => {
            btn.textContent = "Copy";
          }, 2000);
        });
      });
    });
  },

  /**
   * Smart comment box locator, auto-expander, and text inserter.
   */
  smartInsertIntoCommentBox(text, callback) {
    // 1. Copy to clipboard immediately as a reliable backup
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(() => {});
    }

    // 2. Check if editor is already open and active
    let editor = window.ContextExtractor ? window.ContextExtractor.findActiveCommentBox() : null;

    if (editor) {
      this.writeTextToEditor(editor, text);
      if (callback) callback(true);
      return;
    }

    // 3. If closed/collapsed, find and click Reddit's comment composer trigger
    const triggerSelectors = [
      "shreddit-comment-composer",
      "faceplate-textarea-input",
      "div[data-testid='comment-submission-form-rich-text']",
      "div[slot='composer']",
      "div[placeholder*='Add a comment']",
      "div[placeholder*='Join the conversation']",
      "button[data-testid='comment-button']",
      "button:has([data-icon='comment'])",
      "div[data-click-id='comments']",
    ];

    let trigger = null;
    for (const sel of triggerSelectors) {
      trigger = document.querySelector(sel);
      if (trigger) break;
    }

    if (trigger) {
      trigger.scrollIntoView({ behavior: "smooth", block: "center" });
      trigger.click();
      
      // Also try focusing child inputs
      const childInput = trigger.querySelector("textarea, [contenteditable='true'], input");
      if (childInput) childInput.focus();

      // Wait 250ms for Reddit to mount/expand the editor
      setTimeout(() => {
        const newEditor = window.ContextExtractor ? window.ContextExtractor.findActiveCommentBox() : null;
        if (newEditor) {
          this.writeTextToEditor(newEditor, text);
          if (callback) callback(true);
        } else {
          // If Reddit editor couldn't be auto-expanded, notify user that text is copied
          if (callback) callback(false);
        }
      }, 300);
    } else {
      // Final fallback: copy text
      if (callback) callback(false);
    }
  },

  /**
   * Writes text into a textarea or rich-text contenteditable element.
   */
  writeTextToEditor(editor, text) {
    editor.scrollIntoView({ behavior: "smooth", block: "center" });
    editor.focus();

    if (editor.isContentEditable || editor.getAttribute("contenteditable") === "true") {
      document.execCommand("selectAll", false, null);
      document.execCommand("insertText", false, text);
    } else {
      editor.value = text;
      editor.dispatchEvent(new Event("input", { bubbles: true }));
      editor.dispatchEvent(new Event("change", { bubbles: true }));
    }
  },
};

// Expose globally
if (typeof window !== "undefined") {
  window.UIInjector = UIInjector;
}
