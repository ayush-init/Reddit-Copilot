/**
 * Reddit AI Copilot - Content Controller (Unified Architecture)
 * Connects ContextExtractor, UIInjector, and Background AI Service.
 * Renders Unified Post Generator, Anti-Deletion Health Scanner, and Rule Upgrader.
 */

(function () {
  console.log("%c[Reddit AI Copilot]%c Loaded & Active (Unified Architecture).", "color: #ff4500; font-weight: bold;", "color: #2ecc71;");

  // Initialize UI Injector with Action & Refine Handlers
  if (window.UIInjector) {
    window.UIInjector.init({
      onActionTriggered: handleCopilotAction,
      onSingleReplyRefine: handleSingleReplyRefine,
    });
  }

  // Real-time Reddit DOM listeners to update live sync state in Copilot UI
  document.addEventListener("input", debounce(() => {
    if (window.UIInjector && window.UIInjector.updateLiveSyncState) {
      window.UIInjector.updateLiveSyncState();
    }
  }, 400));

  /**
   * Main controller for user-triggered Copilot actions.
   */
  async function handleCopilotAction(actionType, options = {}) {
    if (!window.ContextExtractor || !window.UIInjector) return;

    const context = window.ContextExtractor.collectCurrentContext();
    const draftTitle = window.ContextExtractor.extractPostTitle();
    const draftBody = window.ContextExtractor.extractPostBody();
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

    // Dynamic loading messages
    let loadingMsg = "Analyzing with AI...";
    if (actionType === "generate_full_post_bundle") {
      loadingMsg = `Generating 3 titles, formatted post body, and finding karma-safe communities for ${context.userProfile.username}...`;
    } else if (actionType === "check_anti_deletion") {
      loadingMsg = "Scanning draft against Reddit auto-mod filters & spam triggers...";
    } else if (actionType === "verify_community_rules") {
      loadingMsg = `Verifying draft against ${context.subreddit}'s visible rules...`;
    } else if (actionType === "suggest_replies") {
      loadingMsg = `Generating ${options.length || "standard"} replies with ${options.tone || "helpful"} tone...`;
    } else if (actionType === "analyze_post") {
      loadingMsg = "Summarizing post premise, OP intent & guidelines...";
    } else if (actionType === "draft_question") {
      loadingMsg = "Crafting engaging discussion questions...";
    }

    window.UIInjector.setLoading(true, loadingMsg);

    // Send action request to background AI service
    if (typeof chrome !== "undefined" && chrome.runtime?.id) {
      chrome.runtime.sendMessage(
        {
          action: "RUN_COPILOT_ACTION",
          payload: {
            actionType,
            context,
            draftText,
            draftTitle,
            draftBody,
            tone: options.tone,
            length: options.length,
            customInstruction: options.customInstruction,
            topic: options.topic,
            targetCommunity: context.subreddit,
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

          renderActionResponse(actionType, response.data, context);
        }
      );
    }
  }

  /**
   * Refines a specific single reply with AI.
   */
  function handleSingleReplyRefine(originalText, refineInstruction, callback) {
    if (!window.ContextExtractor) return;
    const context = window.ContextExtractor.collectCurrentContext();

    if (typeof chrome !== "undefined" && chrome.runtime?.id) {
      chrome.runtime.sendMessage(
        {
          action: "RUN_COPILOT_ACTION",
          payload: {
            actionType: "refine_single_reply",
            context,
            originalText,
            refineInstruction,
          },
        },
        (response) => {
          if (response && response.success && response.data) {
            callback(response.data);
          } else {
            alert("Refinement failed: " + (response?.error || "Unknown error"));
            callback(null);
          }
        }
      );
    }
  }

  /**
   * Renders structured responses from AI into the Copilot Drawer.
   */
  function renderActionResponse(actionType, data, context = {}) {
    let html = "";

    // 1. Unified Post Creator & Community Matcher Output (All-in-One)
    if (actionType === "generate_full_post_bundle" && data.titles) {
      const bestTitle = data.titles[0]?.title || "";
      const bestBody = data.formattedBody || "";

      html += `
        <!-- Top Action Card: 1-Click Insert Full Post -->
        <div class="rc-card" style="border-color: #ff4500; background: rgba(255, 69, 0, 0.05);">
          <div class="rc-card-header">
            <span class="rc-card-tag" style="background: #ff4500; color: #ffffff;">🚀 Ready-to-Post Bundle</span>
            <span class="rc-risk-badge">Verified Safe</span>
          </div>
          <button type="button" class="rc-insert-full-post-btn" data-title="${escapeAttribute(bestTitle)}" data-body="${escapeAttribute(bestBody)}">
            🚀 Insert Full Post into Reddit
          </button>
        </div>

        <!-- Safe Communities Section (Checked against user karma & community rules) -->
        <div class="rc-section-header" style="margin-top: 10px;">
          <span class="rc-section-title">🎯 Safe Communities for Your Account:</span>
        </div>
      `;

      if (data.safeCommunities && data.safeCommunities.length > 0) {
        data.safeCommunities.forEach((com) => {
          const isLowKarma = com.safetyTier.includes("Low-Karma") || com.safetyTier.includes("🟢");
          html += `
            <div class="rc-card">
              <div class="rc-card-header">
                <a href="https://reddit.com/${escapeAttribute(com.subreddit)}/submit" target="_blank" class="rc-community-link">
                  ${escapeHtml(com.subreddit)} ↗
                </a>
                <span class="rc-risk-badge" style="background: ${
                  isLowKarma ? "rgba(46, 204, 113, 0.15)" : "rgba(52, 152, 219, 0.15)"
                }; color: ${isLowKarma ? "#2ecc71" : "#3498db"};">
                  ${escapeHtml(com.safetyTier || "Target Niche")}
                </span>
              </div>
              <div class="rc-karma-alert">
                <span class="rc-karma-alert-title">🛡️ Karma Status:</span>
                <span>${escapeHtml(com.karmaStatus)}</span>
              </div>
              <div style="font-size: 12px; color: #d7dadc; line-height: 1.4; margin-top: 4px;">
                <strong>Rule Fit:</strong> ${escapeHtml(com.ruleMatch)}
              </div>
              ${
                com.actionTip
                  ? `<div class="rc-why-bubble"><span class="rc-why-label">Posting Tip:</span>${escapeHtml(com.actionTip)}</div>`
                  : ""
              }
            </div>
          `;
        });
      }

      // Title Hooks
      html += `
        <div class="rc-section-header" style="margin-top: 10px;">
          <span class="rc-section-title">Selectable Title Hooks:</span>
        </div>
      `;

      data.titles.forEach((tObj, idx) => {
        html += `
          <div class="rc-card">
            <div class="rc-card-header">
              <span class="rc-card-tag">Hook #${idx + 1} ${tObj.flair ? `• ${escapeHtml(tObj.flair)}` : ''}</span>
            </div>
            <div class="rc-card-text" style="font-weight: 600;">${escapeHtml(tObj.title)}</div>
            ${tObj.why ? `<div class="rc-why-bubble"><span class="rc-why-label">Why this hook:</span>${escapeHtml(tObj.why)}</div>` : ''}
            <div class="rc-card-actions">
              <button type="button" class="rc-insert-title-btn" data-title="${escapeAttribute(tObj.title)}">
                Insert Title
              </button>
              <button type="button" class="rc-copy-btn" data-text="${escapeAttribute(tObj.title)}">
                Copy
              </button>
            </div>
          </div>
        `;
      });

      // Post Body
      html += `
        <div class="rc-section-header" style="margin-top: 10px;">
          <span class="rc-section-title">Formatted Post Body:</span>
        </div>
        <div class="rc-card">
          <div class="rc-card-text">${escapeHtml(data.formattedBody)}</div>
          <div class="rc-card-actions">
            <button type="button" class="rc-insert-body-btn" data-body="${escapeAttribute(data.formattedBody)}">
              Insert Post Body
            </button>
            <button type="button" class="rc-copy-btn" data-text="${escapeAttribute(data.formattedBody)}">
              Copy Body
            </button>
          </div>
        </div>
      `;
    }

    // 2. Anti-Deletion Health Review Output
    else if (actionType === "check_anti_deletion") {
      const isSafe = data.healthScore >= 80;
      html += `
        <div class="rc-card">
          <div class="rc-card-header">
            <span class="rc-card-tag">🛡️ Anti-Deletion Health Score</span>
            <span class="rc-risk-badge" style="background: ${
              isSafe ? "rgba(46, 204, 113, 0.15)" : "rgba(231, 76, 60, 0.15)"
            }; color: ${isSafe ? "#2ecc71" : "#e74c3c"}; font-weight: bold; font-size: 12px;">
              ${data.healthScore}/100 &bull; ${escapeHtml(data.verdict || "")}
            </span>
          </div>

          ${
            data.detectedRisks && data.detectedRisks.length > 0
              ? `
            <div class="rc-rule-issues-box">
              <span class="rc-rule-issues-title">⚠️ Deletion Risk Signals:</span>
              <ul style="font-size: 11px; color: #ff8c66; padding-left: 16px; margin: 4px 0 0 0;">
                ${data.detectedRisks.map((r) => `<li>${escapeHtml(r)}</li>`).join("")}
              </ul>
            </div>`
              : `<p style="font-size: 12px; color: #2ecc71;">No spam triggers or auto-mod deletion risks detected!</p>`
          }

          <div style="font-size: 12px; color: #d7dadc; line-height: 1.4; margin-top: 6px;">
            ${escapeHtml(data.upgradeExplanation || "")}
          </div>
        </div>

        <div class="rc-card" style="border-color: #2ecc71;">
          <div class="rc-card-header">
            <span class="rc-card-tag" style="background: #2ecc71; color: #000000; font-weight: bold;">✨ Deletion-Proof Upgraded Post</span>
          </div>
          <div class="rc-card-text">
            <strong>Title:</strong> ${escapeHtml(data.upgradedTitle || "")}
            <hr style="border: 0; border-top: 1px solid #272729; margin: 8px 0;" />
            <strong>Body:</strong>
            <br />
            ${escapeHtml(data.upgradedBody || "")}
          </div>
          <button type="button" class="rc-insert-full-post-btn" style="background: #2ecc71; color: #000000;" data-title="${escapeAttribute(data.upgradedTitle)}" data-body="${escapeAttribute(data.upgradedBody)}">
            ✨ Insert Deletion-Proof Post into Reddit
          </button>
        </div>
      `;
    }

    // 3. Community-Specific Rule Check Output
    else if (actionType === "verify_community_rules") {
      const isCompliant = data.overallStatus.includes("🟢") || data.overallStatus.includes("Compliant");
      html += `
        <div class="rc-card">
          <div class="rc-card-header">
            <span class="rc-card-tag">📋 ${escapeHtml(context.subreddit || "Subreddit")} Rules Check</span>
            <span class="rc-risk-badge" style="background: ${
              isCompliant ? "rgba(46, 204, 113, 0.15)" : "rgba(231, 76, 60, 0.15)"
            }; color: ${isCompliant ? "#2ecc71" : "#e74c3c"};">
              ${escapeHtml(data.overallStatus || "Evaluated")}
            </span>
          </div>

          ${
            data.ruleChecklist && data.ruleChecklist.length > 0
              ? `
            <div style="display: flex; flex-direction: column; gap: 6px; margin-top: 6px;">
              ${data.ruleChecklist
                .map(
                  (item) => `
                <div style="font-size: 11px; padding: 6px 8px; border-radius: 4px; background: ${
                  item.status === "PASS" ? "rgba(46,204,113,0.08)" : "rgba(231,76,60,0.08)"
                }; color: ${item.status === "PASS" ? "#2ecc71" : "#ff8c66"}; border-left: 3px solid ${
                    item.status === "PASS" ? "#2ecc71" : "#e74c3c"
                  };">
                  <strong>[${escapeHtml(item.status)}] ${escapeHtml(item.rule)}:</strong> ${escapeHtml(item.explanation)}
                </div>`
                )
                .join("")}
            </div>`
              : ""
          }

          <div style="font-size: 12px; color: #d7dadc; line-height: 1.4; margin-top: 6px;">
            ${escapeHtml(data.upgradeSummary || "")}
          </div>
        </div>

        <div class="rc-card" style="border-color: #2ecc71;">
          <div class="rc-card-header">
            <span class="rc-card-tag" style="background: #2ecc71; color: #000000; font-weight: bold;">✨ 100% Compliant Upgraded Post</span>
          </div>
          <div class="rc-card-text">
            <strong>Title:</strong> ${escapeHtml(data.upgradedTitle || "")}
            <hr style="border: 0; border-top: 1px solid #272729; margin: 8px 0;" />
            <strong>Body:</strong>
            <br />
            ${escapeHtml(data.upgradedBody || "")}
          </div>
          <button type="button" class="rc-insert-full-post-btn" style="background: #2ecc71; color: #000000;" data-title="${escapeAttribute(data.upgradedTitle)}" data-body="${escapeAttribute(data.upgradedBody)}">
            ✨ Insert 100% Compliant Post into Reddit
          </button>
        </div>
      `;
    }

    // 4. Existing Reply Assistant Handlers
    else if (actionType === "suggest_replies" && data.replies) {
      if (data.postSummary) {
        html += `
          <div class="rc-summary-card">
            <div class="rc-summary-header">
              <span class="rc-summary-badge">📌 Post Overview</span>
            </div>
            <div class="rc-summary-body">${escapeHtml(data.postSummary)}</div>
          </div>
        `;
      }

      data.replies.forEach((reply, index) => {
        html += `
          <div class="rc-card">
            <div class="rc-card-header">
              <span class="rc-card-tag">#${index + 1} ${escapeHtml(reply.label || "Personalized Reply")}</span>
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
              <button type="button" class="rc-refine-toggle-btn" title="Refine this specific draft">
                🔄 Refine
              </button>
              <button type="button" class="rc-copy-btn" data-text="${escapeAttribute(reply.text)}">
                Copy
              </button>
            </div>

            <div class="rc-card-refine-box hidden">
              <input type="text" class="rc-card-refine-input" placeholder="e.g. 'Make it shorter', 'Add GitHub mention'..." />
              <button type="button" class="rc-apply-card-refine-btn" data-original-text="${escapeAttribute(reply.text)}">
                ✨ Apply
              </button>
            </div>
          </div>
        `;
      });
    } else if (actionType === "analyze_post") {
      html += `
        <div class="rc-card">
          <div class="rc-card-header">
            <span class="rc-card-tag">🔍 Community Tone & Vibe</span>
            <span class="rc-risk-badge" style="background: rgba(52, 152, 219, 0.15); color: #3498db;">
              ${escapeHtml(data.communityTone || "General")}
            </span>
          </div>
        </div>

        ${
          data.keyTakeaways && data.keyTakeaways.length > 0
            ? `
          <div class="rc-card">
            <span class="rc-card-tag">💡 Key Takeaways</span>
            <ul style="font-size: 12px; color: #d7dadc; padding-left: 18px; margin-top: 6px; display: flex; flex-direction: column; gap: 4px;">
              ${data.keyTakeaways.map((k) => `<li>${escapeHtml(k)}</li>`).join("")}
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
    }

    window.UIInjector.renderResults(html);
  }

  // Utilities
  function debounce(fn, wait) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), wait);
    };
  }

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
