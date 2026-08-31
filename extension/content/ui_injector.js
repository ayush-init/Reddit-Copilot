/**
 * Reddit AI Copilot - UI Injector
 * Creates floating badge, collapsible side drawer, and inline "⚡ AI Reply" buttons.
 * Purely user-triggered, high-performance, non-blocking DOM integration.
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

    // Debounced observer to prevent any mutation loops (max 1 run per 1000ms)
    const observer = new MutationObserver((mutations) => {
      // Ignore mutations originating from our own elements
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
        <!-- Intent Prompt Section -->
        <div class="rc-section-header">
          <span class="rc-section-title">What do you want to do?</span>
        </div>

        <div class="rc-action-grid">
          <button type="button" class="rc-action-card" data-action="suggest_replies">
            <div class="rc-action-icon">💡</div>
            <div class="rc-action-info">
              <span class="rc-action-label">Suggest 3 Replies</span>
              <span class="rc-action-sub">Contextual, helpful & reasoned</span>
            </div>
          </button>

          <button type="button" class="rc-action-card" data-action="analyze_post">
            <div class="rc-action-icon">🔍</div>
            <div class="rc-action-info">
              <span class="rc-action-label">Analyze Post & Rules</span>
              <span class="rc-action-sub">Community tone & moderation check</span>
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
    // Find comment composer containers
    const composerContainers = document.querySelectorAll(
      "shreddit-composer, div[data-testid='comment-submission-form-rich-text'], div[data-testid='post-composer']"
    );

    composerContainers.forEach((container) => {
      // Prevent duplicate injection
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

      // Safely append to the composer's actions slot or container
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

    // Update subreddit badge in drawer
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

    // Handle "Insert into Comment"
    resultsContent.querySelectorAll(".rc-insert-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const text = btn.getAttribute("data-text");
        this.insertTextIntoCommentBox(text);
        btn.textContent = "✓ Inserted!";
        setTimeout(() => {
          btn.textContent = "Insert into Comment";
        }, 2000);
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
   * Safely inserts text into Reddit's active editor (Human-in-the-Loop, zero auto-submit).
   */
  insertTextIntoCommentBox(text) {
    if (!window.ContextExtractor) return;
    const editor = window.ContextExtractor.findActiveCommentBox();

    if (!editor) {
      alert("Please click inside Reddit's comment box first, then click 'Insert into Comment'.");
      return;
    }

    editor.focus();

    if (editor.isContentEditable || editor.getAttribute("contenteditable") === "true") {
      // Rich text contenteditable insertion
      document.execCommand("insertText", false, text);
    } else {
      // Standard textarea insertion
      const start = editor.selectionStart || 0;
      const end = editor.selectionEnd || 0;
      const val = editor.value || "";
      editor.value = val.substring(0, start) + text + val.substring(end);
      editor.dispatchEvent(new Event("input", { bubbles: true }));
    }
  },
};

// Expose globally
if (typeof window !== "undefined") {
  window.UIInjector = UIInjector;
}
