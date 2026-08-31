/**
 * Reddit AI Copilot - Resilient Semantic Context Extractor & Account Intelligence
 * Extracts visible DOM data, active submit draft, and logged-in account metadata.
 * Purely user-triggered & zero background scraping.
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
   * Automatically extracts the logged-in Reddit user's profile metadata.
   * (Username, Karma, Account tier - without asking the user!)
   */
  extractUserProfile() {
    let username = "";
    let karma = "";
    let accountTier = "growing"; // default fallback

    // 1. Search for username in user-drawer, profile links, avatar buttons
    const userSelectors = [
      "shreddit-user-drawer span[data-testid='user-name']",
      "button[aria-label*='user menu' i] span",
      "button[aria-label*='User Avatar' i] span",
      "a[href^='/user/']",
      "faceplate-dropdown-menu[aria-label*='User' i] span",
      "#user-dropdown span",
    ];

    for (const sel of userSelectors) {
      const el = document.querySelector(sel);
      if (el && el.textContent.trim()) {
        const text = el.textContent.trim();
        if (text.startsWith("u/") || text.includes("u/")) {
          username = text;
          break;
        } else if (text.length > 2 && !text.includes("Reddit") && !text.includes("Create") && !text.includes("Log")) {
          username = `u/${text.replace(/^@/, "")}`;
          break;
        }
      }
    }

    // Fallback: search window config if available
    if (!username && window.___r && window.___r.user) {
      username = `u/${window.___r.user.name || ""}`;
    }

    // 2. Search for karma count in user drawer or header
    const karmaSelectors = [
      "span[data-testid='karma-count']",
      "shreddit-user-drawer [data-testid='karma']",
      "span[id*='karma']",
      "div:has(> span:contains('karma'))",
    ];

    for (const sel of karmaSelectors) {
      try {
        const el = document.querySelector(sel);
        if (el && el.textContent) {
          const match = el.textContent.match(/([\d,]+(\.\d+)?\s*[kKmM]?)\s*karma/i);
          if (match) {
            karma = match[1];
            break;
          }
        }
      } catch (e) {}
    }

    // Determine heuristic karma tier based on extracted karma
    if (karma) {
      const num = parseInt(karma.replace(/,/g, ""), 10);
      if (num < 50) accountTier = "new";
      else if (num < 500) accountTier = "growing";
      else accountTier = "established";
    }

    return {
      username: username || "Authenticated Redditor",
      karma: karma || "Active Karma",
      accountTier,
    };
  },

  /**
   * Extracts the subreddit name from URL, DOM, or submit page dropdown.
   */
  extractSubredditName() {
    // 1. Submit Page Community Selector Dropdown (checks user selection first)
    const submitDropdowns = [
      "faceplate-dropdown-menu button span",
      "button[aria-label*='community' i]",
      "div[data-testid='community-dropdown']",
      "shreddit-community-picker button",
      "button:has(span[data-testid='subreddit-name'])",
    ];

    for (const sel of submitDropdowns) {
      const el = document.querySelector(sel);
      if (el && el.textContent) {
        const text = el.textContent.trim();
        const match = text.match(/r\/([a-zA-Z0-9_]+)/i);
        if (match) return `r/${match[1]}`;
        if (text.startsWith("r/")) return text;
      }
    }

    // 2. URL-based extraction
    const match = window.location.pathname.match(/\/r\/([a-zA-Z0-9_]+)/i);
    if (match && match[1]) {
      return `r/${match[1]}`;
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
        const val = titleInput.value || titleInput.innerText || "";
        if (val.trim()) return val.trim();
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

    const docTitle = document.title || "";
    if (docTitle.includes(" : ")) return docTitle.split(" : ")[0].trim();
    if (docTitle.includes(" - Reddit")) return docTitle.split(" - Reddit")[0].trim();

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
        const val = bodyInput.innerText || bodyInput.value || "";
        if (val.trim()) return val.trim();
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
      "faceplate-textarea-input[name='title'] textarea",
      "faceplate-textarea-input textarea",
      "textarea[name='title']",
      "textarea[placeholder*='Title']",
      "textarea[aria-label*='Title' i]",
      "div[data-testid='post-title-text-area'] textarea",
      "input[name='title']",
      "input[placeholder*='Title']",
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
      "shreddit-composer div[contenteditable='true']",
      "div[data-testid='post-composer'] div[contenteditable='true']",
      "div[role='textbox'][contenteditable='true']",
      "div[data-lexical-editor='true']",
      "shreddit-composer textarea",
      "textarea[name='text']",
      "textarea[placeholder*='Body text']",
      "textarea[placeholder*='Text']",
      "textarea[placeholder*='What are your thoughts?']",
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
    const userProfile = this.extractUserProfile();

    return {
      timestamp: new Date().toISOString(),
      url: window.location.href,
      pageView,
      subreddit,
      userProfile,
      post: {
        title,
        body,
      },
      rules,
    };
  },
};

// Expose globally
if (typeof window !== "undefined") {
  window.ContextExtractor = ContextExtractor;
}
