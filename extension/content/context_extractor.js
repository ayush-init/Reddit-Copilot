/**
 * Reddit AI Copilot - Resilient Semantic Context Extractor
 * Purely user-triggered: Extracts visible DOM data only when user initiates an AI action.
 * Zero background scraping, zero periodic polling.
 */

const ContextExtractor = {
  /**
   * Identifies the current page view mode from URL and DOM structure.
   */
  detectPageView() {
    const url = window.location.href;
    const pathname = window.location.pathname;

    if (pathname.includes("/submit") || pathname.includes("/submit/")) {
      return "submit_post";
    }

    if (pathname.includes("/comments/") || url.includes("/comments/")) {
      return "post_detail";
    }

    if (pathname.startsWith("/r/") && !pathname.includes("/comments/")) {
      return "subreddit_feed";
    }

    return "home_feed";
  },

  /**
   * Extracts the subreddit name from URL, DOM, or submit page dropdown.
   */
  extractSubredditName() {
    // 1. URL-based extraction (most reliable)
    const match = window.location.pathname.match(/\/r\/([a-zA-Z0-9_]+)/i);
    if (match && match[1]) {
      return `r/${match[1]}`;
    }

    // 2. Submit Page Community Selector Dropdown
    const submitCommunityEl =
      document.querySelector("faceplate-dropdown-menu button span") ||
      document.querySelector("button[aria-label*='community' i]") ||
      document.querySelector("div[data-testid='community-dropdown']");
    if (submitCommunityEl && submitCommunityEl.textContent) {
      const text = submitCommunityEl.textContent.trim();
      const cleanMatch = text.match(/r\/([a-zA-Z0-9_]+)/i);
      if (cleanMatch) return `r/${cleanMatch[1]}`;
      if (text.startsWith("r/")) return text;
    }

    // 3. DOM fallback on feed/post
    const subredditEl =
      document.querySelector("a[data-testid='subreddit-name']") ||
      document.querySelector("shreddit-subreddit-icon") ||
      document.querySelector("a[href^='/r/']");

    if (subredditEl) {
      const text = subredditEl.textContent || subredditEl.getAttribute("href") || "";
      const cleanMatch = text.match(/r\/([a-zA-Z0-9_]+)/i);
      if (cleanMatch) return `r/${cleanMatch[1]}`;
    }

    return "r/all";
  },

  /**
   * Extracts post title using resilient selectors across modern and classic Reddit.
   */
  extractPostTitle() {
    // If on submit page, check user's draft title input
    if (this.detectPageView() === "submit_post") {
      const titleInput = this.findPostTitleInput();
      if (titleInput) {
        return (titleInput.value || titleInput.innerText || "").trim();
      }
    }

    const selectors = [
      "h1[slot='title']",
      "shreddit-title",
      "h1[data-testid='post-title']",
      "div[data-testid='post-container'] h1",
      "h1.title",
      "h1",
    ];

    for (const selector of selectors) {
      const el = document.querySelector(selector);
      if (el && el.textContent.trim()) {
        return el.textContent.trim();
      }
    }

    // Document title fallback
    const docTitle = document.title || "";
    if (docTitle.includes(" : ")) {
      return docTitle.split(" : ")[0].trim();
    }
    if (docTitle.includes(" - Reddit")) {
      return docTitle.split(" - Reddit")[0].trim();
    }

    return docTitle.trim();
  },

  /**
   * Extracts post body text using resilient semantic selectors.
   */
  extractPostBody() {
    // If on submit page, check user's draft post body editor
    if (this.detectPageView() === "submit_post") {
      const bodyInput = this.findPostBodyInput();
      if (bodyInput) {
        return (bodyInput.innerText || bodyInput.value || "").trim();
      }
    }

    const selectors = [
      "shreddit-post div[slot='text-body']",
      "div[data-testid='post-container'] div[data-click-id='text']",
      "div[slot='text-body']",
      ".usertext-body .md",
      "div[data-testid='post-text']",
      "div[slot='post-media-container']",
    ];

    for (const selector of selectors) {
      const el = document.querySelector(selector);
      if (el && el.innerText.trim()) {
        return el.innerText.trim();
      }
    }

    return "";
  },

  /**
   * Extracts visible community / sidebar rules from the current page.
   */
  extractCommunityRules() {
    const rules = [];

    // Modern Reddit shreddit rules / sidebar widgets
    const ruleElements = document.querySelectorAll(
      "shreddit-rule, [data-testid='rule-item'], div[data-testid='community-rules'] li, div[aria-label='Rules'] li, div[data-testid='posting-rules'] li"
    );

    if (ruleElements.length > 0) {
      ruleElements.forEach((el, index) => {
        const text = el.innerText.trim();
        if (text && text.length > 3) {
          rules.push(`${index + 1}. ${text.replace(/\n+/g, " - ")}`);
        }
      });
    }

    // Sidebar text fallback
    if (rules.length === 0) {
      const sidebar = document.querySelector("aside, [data-testid='subreddit-sidebar'], #sidebar, div[slot='sidebar']");
      if (sidebar) {
        const headings = sidebar.querySelectorAll("h2, h3, h4, span");
        headings.forEach((h) => {
          if (h.innerText && h.innerText.toLowerCase().includes("rule")) {
            const container = h.closest("div") || h.parentElement;
            if (container) {
              const ruleItems = container.querySelectorAll("li, p");
              ruleItems.forEach((item, idx) => {
                const t = item.innerText.trim();
                if (t) rules.push(`${idx + 1}. ${t}`);
              });
            }
          }
        });
      }
    }

    return rules;
  },

  /**
   * Finds the title input element on Reddit's submit page.
   */
  findPostTitleInput() {
    const selectors = [
      "textarea[name='title']",
      "textarea[placeholder*='Title']",
      "faceplate-textarea-input textarea",
      "input[name='title']",
      "input[placeholder*='Title']",
      "textarea[aria-label*='Title' i]",
      "div[data-testid='post-title-text-area'] textarea",
    ];

    for (const selector of selectors) {
      const el = document.querySelector(selector);
      if (el) return el;
    }
    return null;
  },

  /**
   * Finds the post body contenteditable or textarea on Reddit's submit page.
   */
  findPostBodyInput() {
    const selectors = [
      "div[data-testid='post-composer'] div[contenteditable='true']",
      "shreddit-composer div[contenteditable='true']",
      "div[role='textbox'][contenteditable='true']",
      "div[data-lexical-editor='true']",
      "textarea[name='text']",
      "textarea[placeholder*='Body text']",
      "textarea[placeholder*='Text']",
    ];

    for (const selector of selectors) {
      const el = document.querySelector(selector);
      if (el) return el;
    }
    return null;
  },

  /**
   * Finds the active comment box or post composer on the page.
   */
  findActiveCommentBox() {
    const selectors = [
      "div[data-testid='comment-submission-form-rich-text'] div[contenteditable='true']",
      "div[role='textbox'][contenteditable='true']",
      "shreddit-composer textarea",
      "textarea[name='comment']",
      "textarea[placeholder*='Add a comment']",
      "textarea[placeholder*='What are your thoughts?']",
      "div[data-testid='post-composer'] div[contenteditable='true']",
      "textarea",
    ];

    for (const selector of selectors) {
      const el = document.querySelector(selector);
      if (el && (el.offsetParent !== null || el.getClientRects().length > 0)) {
        return el;
      }
    }

    return null;
  },

  /**
   * Collects full contextual snapshot on-demand for AI processing.
   */
  collectCurrentContext() {
    const pageView = this.detectPageView();
    const subreddit = this.extractSubredditName();
    const title = this.extractPostTitle();
    const body = this.extractPostBody();
    const rules = this.extractCommunityRules();

    return {
      timestamp: new Date().toISOString(),
      url: window.location.href,
      pageView,
      subreddit,
      post: {
        title,
        body,
      },
      rules,
    };
  },
};

// Expose globally for content script
if (typeof window !== "undefined") {
  window.ContextExtractor = ContextExtractor;
}
