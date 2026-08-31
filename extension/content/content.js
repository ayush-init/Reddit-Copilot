/**
 * Reddit AI Copilot - Content Controller
 * Connects ContextExtractor, UIInjector, and Background AI Service.
 */

(function () {
  console.log("%c[Reddit AI Copilot]%c Loaded & Active.", "color: #ff4500; font-weight: bold;", "color: #2ecc71;");

  // Initialize UI Injector with Action Handlers
  if (window.UIInjector) {
    window.UIInjector.init({
      onActionTriggered: handleCopilotAction,
    });
  }

  /**
   * Main controller for user-triggered Copilot actions.
   */
  async function handleCopilotAction(actionType) {
    if (!window.ContextExtractor || !window.UIInjector) return;

    const context = window.ContextExtractor.collectCurrentContext();
    let draftText = "";

    if (actionType === "preflight_check") {
      const editor = window.ContextExtractor.findActiveCommentBox();
      draftText = editor ? (editor.innerText || editor.value || "").trim() : "";
      if (!draftText) {
        window.UIInjector.renderResults(`
          <div class="rc-card">
            <div class="rc-card-header">
              <span class="rc-card-tag">🛡️ Preflight Check</span>
            </div>
            <p style="font-size: 12px; color: #ff8c66;">
              Please write or paste your comment draft in Reddit's comment box first, then click "Preflight Check Draft".
            </p>
          </div>
        `);
        return;
      }
    }

    // Set loading message
    const actionMessages = {
      suggest_replies: "Drafting 3 smart reply angles with reasoning...",
      analyze_post: "Analyzing post context & community rules...",
      draft_question: "Crafting engaging discussion questions...",
      preflight_check: "Checking draft against community rules...",
    };

    window.UIInjector.setLoading(true, actionMessages[actionType] || "Analyzing with AI...");

    // Send action request to background AI service
    chrome.runtime.sendMessage(
      {
        action: "RUN_COPILOT_ACTION",
        payload: {
          actionType,
          context,
          draftText,
        },
      },
      (response) => {
        if (!response || !response.success) {
          const errorMsg = response?.error || "Failed to generate AI response. Please check your API settings.";
          window.UIInjector.renderResults(`
            <div class="rc-card" style="border-color: #e74c3c;">
              <div class="rc-card-header">
                <span class="rc-card-tag" style="color: #e74c3c; background: rgba(231,76,60,0.15);">Error</span>
              </div>
              <p style="font-size: 12px; color: #ff8c66;">${escapeHtml(errorMsg)}</p>
            </div>
          `);
          return;
        }

        renderActionResponse(actionType, response.data);
      }
    );
  }

  /**
   * Renders structured responses from AI into the Copilot Drawer.
   */
  function renderActionResponse(actionType, data) {
    let html = "";

    if (actionType === "suggest_replies" && data.replies) {
      data.replies.forEach((reply, index) => {
        html += `
          <div class="rc-card">
            <div class="rc-card-header">
              <span class="rc-card-tag">#${index + 1} ${escapeHtml(reply.label || "Suggested Reply")}</span>
              <span class="rc-risk-badge">${escapeHtml(reply.moderationRisk || "Low Risk")}</span>
            </div>
            <div class="rc-card-text">${escapeHtml(reply.text)}</div>
            ${
              reply.why
                ? `
              <div class="rc-why-bubble">
                <span class="rc-why-label">Why this recommendation?</span>
                ${escapeHtml(reply.why)}
              </div>`
                : ""
            }
            <div class="rc-card-actions">
              <button type="button" class="rc-insert-btn" data-text="${escapeAttribute(reply.text)}">
                Insert into Comment
              </button>
              <button type="button" class="rc-copy-btn" data-text="${escapeAttribute(reply.text)}">
                Copy
              </button>
            </div>
          </div>
        `;
      });
    } else if (actionType === "analyze_post") {
      html = `
        <div class="rc-card">
          <div class="rc-card-header">
            <span class="rc-card-tag">🔍 Discussion Summary</span>
            <span class="rc-risk-badge" style="background: rgba(52, 152, 219, 0.15); color: #3498db;">
              ${escapeHtml(data.communityTone || "General")}
            </span>
          </div>
          <p style="font-size: 13px; color: #ffffff; line-height: 1.4;">${escapeHtml(data.summary || "")}</p>
        </div>

        ${
          data.keyTakeaways && data.keyTakeaways.length > 0
            ? `
          <div class="rc-card">
            <span class="rc-card-tag">💡 Key Discussion Points</span>
            <ul style="font-size: 12px; color: #d7dadc; padding-left: 18px; margin-top: 6px; display: flex; flex-direction: column; gap: 4px;">
              ${data.keyTakeaways.map((k) => `<li>${escapeHtml(k)}</li>`).join("")}
            </ul>
          </div>`
            : ""
        }

        ${
          data.moderationNotes && data.moderationNotes.length > 0
            ? `
          <div class="rc-card">
            <span class="rc-card-tag" style="color: #2ecc71; background: rgba(46,204,113,0.1);">🛡️ Community Guidelines & Tips</span>
            <ul style="font-size: 12px; color: #d7dadc; padding-left: 18px; margin-top: 6px; display: flex; flex-direction: column; gap: 4px;">
              ${data.moderationNotes.map((m) => `<li>${escapeHtml(m)}</li>`).join("")}
            </ul>
          </div>`
            : ""
        }
      `;
    } else if (actionType === "draft_question" && data.questions) {
      data.questions.forEach((q, idx) => {
        html += `
          <div class="rc-card">
            <div class="rc-card-header">
              <span class="rc-card-tag">❓ ${escapeHtml(q.title || `Question #${idx + 1}`)}</span>
            </div>
            <div class="rc-card-text">${escapeHtml(q.text)}</div>
            ${
              q.why
                ? `
              <div class="rc-why-bubble">
                <span class="rc-why-label">Why ask this?</span>
                ${escapeHtml(q.why)}
              </div>`
                : ""
            }
            <div class="rc-card-actions">
              <button type="button" class="rc-insert-btn" data-text="${escapeAttribute(q.text)}">
                Insert into Comment
              </button>
              <button type="button" class="rc-copy-btn" data-text="${escapeAttribute(q.text)}">
                Copy
              </button>
            </div>
          </div>
        `;
      });
    } else if (actionType === "preflight_check") {
      const isGood = data.status === "Looks Good";
      html = `
        <div class="rc-card">
          <div class="rc-card-header">
            <span class="rc-card-tag">🛡️ Preflight Assessment</span>
            <span class="rc-risk-badge" style="background: ${
              isGood ? "rgba(46, 204, 113, 0.15)" : "rgba(243, 156, 18, 0.15)"
            }; color: ${isGood ? "#2ecc71" : "#f39c12"};">
              ${escapeHtml(data.status || "Evaluated")}
            </span>
          </div>
          <p style="font-size: 13px; color: #ffffff; line-height: 1.4;">${escapeHtml(
            data.overallAssessment || "Draft evaluated against community context."
          )}</p>
        </div>

        ${
          data.riskSignals && data.riskSignals.length > 0
            ? `
          <div class="rc-card">
            <span class="rc-card-tag" style="color: #f39c12; background: rgba(243,156,18,0.1);">⚠️ Potential Considerations</span>
            <ul style="font-size: 12px; color: #d7dadc; padding-left: 18px; margin-top: 6px; display: flex; flex-direction: column; gap: 4px;">
              ${data.riskSignals.map((r) => `<li>${escapeHtml(r)}</li>`).join("")}
            </ul>
          </div>`
            : ""
        }

        ${
          data.refinements && data.refinements.length > 0
            ? `
          <div class="rc-card">
            <span class="rc-card-tag">✨ Recommended Refinements</span>
            <ul style="font-size: 12px; color: #d7dadc; padding-left: 18px; margin-top: 6px; display: flex; flex-direction: column; gap: 4px;">
              ${data.refinements.map((r) => `<li>${escapeHtml(r)}</li>`).join("")}
            </ul>
          </div>`
            : ""
        }
      `;
    }

    window.UIInjector.renderResults(html);
  }

  // Utilities
  function escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function escapeAttribute(str) {
    if (!str) return "";
    return String(str).replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
})();
