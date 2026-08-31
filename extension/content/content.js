/**
 * Reddit AI Copilot - Content Controller
 * Connects ContextExtractor, UIInjector, and Background AI Service.
 * Supports Reply Assistant, Karma-Aware Community Matcher, Post Creator, and Rule Upgrader.
 */

(function () {
  console.log("%c[Reddit AI Copilot]%c Loaded & Active (Phase 5).", "color: #ff4500; font-weight: bold;", "color: #2ecc71;");

  // Initialize UI Injector with Action & Refine Handlers
  if (window.UIInjector) {
    window.UIInjector.init({
      onActionTriggered: handleCopilotAction,
      onSingleReplyRefine: handleSingleReplyRefine,
    });
  }

  /**
   * Main controller for user-triggered Copilot actions.
   */
  async function handleCopilotAction(actionType, options = {}) {
    if (!window.ContextExtractor || !window.UIInjector) return;

    const context = window.ContextExtractor.collectCurrentContext();
    let draftText = "";
    let draftTitle = "";
    let draftBody = "";

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

    if (actionType === "upgrade_post_rules") {
      draftTitle = window.ContextExtractor.extractPostTitle();
      draftBody = window.ContextExtractor.extractPostBody();
    }

    // Dynamic loading messages
    let loadingMsg = "Analyzing with AI...";
    if (actionType === "suggest_replies") {
      loadingMsg = `Generating ${options.length || "standard"} replies with ${options.tone || "helpful"} tone...`;
    } else if (actionType === "match_communities") {
      loadingMsg = "Finding karma-safe & eligible communities for your topic...";
    } else if (actionType === "create_post") {
      loadingMsg = "Crafting high-converting titles & formatted post body...";
    } else if (actionType === "upgrade_post_rules") {
      loadingMsg = "Scanning draft against subreddit rules & auto-mod filters...";
    } else if (actionType === "suggest_post_ideas") {
      loadingMsg = "Brainstorming personalized post ideas for your profile...";
    } else if (actionType === "analyze_post") {
      loadingMsg = "Summarizing post premise, OP intent & guidelines...";
    } else if (actionType === "draft_question") {
      loadingMsg = "Crafting engaging discussion questions...";
    }

    window.UIInjector.setLoading(true, loadingMsg);

    // Send action request to background AI service
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
          karmaTier: options.karmaTier,
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

        renderActionResponse(actionType, response.data);
      }
    );
  }

  /**
   * Refines a specific single reply with AI without regenerating the entire list.
   */
  function handleSingleReplyRefine(originalText, refineInstruction, callback) {
    if (!window.ContextExtractor) return;
    const context = window.ContextExtractor.collectCurrentContext();

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

  /**
   * Renders structured responses from AI into the Copilot Drawer.
   */
  function renderActionResponse(actionType, data) {
    let html = "";

    // 1. Post Summary Banner (if available)
    if (data.postSummary || (actionType === "analyze_post" && data.summary)) {
      const summaryText = data.postSummary || data.summary;
      html += `
        <div class="rc-summary-card">
          <div class="rc-summary-header">
            <span class="rc-summary-badge">📌 Post Overview</span>
            <span class="rc-summary-topic">What this post is about</span>
          </div>
          <div class="rc-summary-body">${escapeHtml(summaryText)}</div>
          ${
            data.whatOPIsLookingFor
              ? `<div class="rc-summary-sub"><strong>🎯 OP Wants:</strong> ${escapeHtml(data.whatOPIsLookingFor)}</div>`
              : ""
          }
        </div>
      `;
    }

    // 2. Phase 5: Karma-Aware Community Matcher Results
    if (actionType === "match_communities" && data.recommendedCommunities) {
      html += `
        <div class="rc-summary-card">
          <div class="rc-summary-header">
            <span class="rc-summary-badge">🎯 Community Matcher</span>
            <span class="rc-summary-topic">Karma & Account-Age Filtered</span>
          </div>
          <div class="rc-summary-body">${escapeHtml(data.topicAnalysis || "Eligible subreddits for your topic and account level.")}</div>
        </div>
      `;

      data.recommendedCommunities.forEach((com) => {
        const isLowKarma = com.tierCategory.includes("Low-Karma") || com.tierCategory.includes("🟢");
        html += `
          <div class="rc-card">
            <div class="rc-card-header">
              <a href="https://reddit.com/${escapeAttribute(com.name)}/submit" target="_blank" class="rc-community-link">
                ${escapeHtml(com.name)} ↗
              </a>
              <span class="rc-risk-badge" style="background: ${
                isLowKarma ? "rgba(46, 204, 113, 0.15)" : "rgba(52, 152, 219, 0.15)"
              }; color: ${isLowKarma ? "#2ecc71" : "#3498db"};">
                ${escapeHtml(com.tierCategory || "Target Niche")}
              </span>
            </div>
            <div style="font-size: 12px; color: #d7dadc; line-height: 1.4;">${escapeHtml(com.whySuitable)}</div>
            
            <div class="rc-karma-alert">
              <span class="rc-karma-alert-title">🛡️ Karma Assessment:</span>
              <span>${escapeHtml(com.karmaEligibility || "Safe to post")}</span>
            </div>

            ${
              com.postingTips
                ? `
              <div class="rc-why-bubble">
                <span class="rc-why-label">Posting Rule Tip:</span>
                ${escapeHtml(com.postingTips)}
              </div>`
                : ""
            }
          </div>
        `;
      });
    }

    // 3. Phase 5: Post Creator Results (Titles + Formatted Body)
    else if (actionType === "create_post" && data.recommendedTitles) {
      const bestTitle = data.recommendedTitles[0]?.title || "";
      const bodyText = data.formattedBody || "";

      html += `
        <div class="rc-card" style="border-color: #ff4500;">
          <div class="rc-card-header">
            <span class="rc-card-tag" style="background: #ff4500; color: #ffffff;">🚀 Ready-to-Post Bundle</span>
          </div>
          <button type="button" class="rc-insert-full-post-btn" data-title="${escapeAttribute(bestTitle)}" data-body="${escapeAttribute(bodyText)}">
            🚀 Insert Full Post into Reddit
          </button>
        </div>

        <div class="rc-section-header" style="margin-top: 10px;">
          <span class="rc-section-title">Selectable Title Hooks:</span>
        </div>
      `;

      data.recommendedTitles.forEach((tObj, idx) => {
        html += `
          <div class="rc-card">
            <div class="rc-card-header">
              <span class="rc-card-tag">Title #${idx + 1} ${tObj.flair ? `• ${escapeHtml(tObj.flair)}` : ''}</span>
            </div>
            <div class="rc-card-text" style="font-weight: 600;">${escapeHtml(tObj.title)}</div>
            ${tObj.angle ? `<div class="rc-why-bubble"><span class="rc-why-label">Why this hook:</span>${escapeHtml(tObj.angle)}</div>` : ''}
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

      html += `
        <div class="rc-section-header" style="margin-top: 10px;">
          <span class="rc-section-title">Formatted Post Body:</span>
        </div>
        <div class="rc-card">
          <div class="rc-card-text">${escapeHtml(data.formattedBody)}</div>
          ${
            data.ruleComplianceCheck
              ? `<div class="rc-why-bubble"><span class="rc-why-label">Rule Alignment:</span>${escapeHtml(data.ruleComplianceCheck)}</div>`
              : ""
          }
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

    // 4. Phase 5: 1-Click Rule Compliance Upgrader Results
    else if (actionType === "upgrade_post_rules") {
      const isCompliant = data.complianceStatus.includes("🟢") || data.complianceStatus.includes("Compliant");
      html += `
        <div class="rc-card">
          <div class="rc-card-header">
            <span class="rc-card-tag">🛡️ Subreddit Rule Compliance</span>
            <span class="rc-risk-badge" style="background: ${
              isCompliant ? "rgba(46, 204, 113, 0.15)" : "rgba(231, 76, 60, 0.15)"
            }; color: ${isCompliant ? "#2ecc71" : "#e74c3c"};">
              ${escapeHtml(data.complianceStatus || "Evaluated")}
            </span>
          </div>

          ${
            data.issuesFound && data.issuesFound.length > 0
              ? `
            <div class="rc-rule-issues-box">
              <span class="rc-rule-issues-title">⚠️ Moderation Concerns Detected:</span>
              <ul style="font-size: 11px; color: #ff8c66; padding-left: 16px; margin: 4px 0 0 0;">
                ${data.issuesFound.map((i) => `<li>${escapeHtml(i)}</li>`).join("")}
              </ul>
            </div>`
              : `<p style="font-size: 12px; color: #2ecc71;">No strict rule conflicts detected for this subreddit!</p>`
          }

          <div style="font-size: 12px; color: #d7dadc; line-height: 1.4; margin-top: 4px;">
            ${escapeHtml(data.upgradeExplanation || "")}
          </div>
        </div>

        <div class="rc-card" style="border-color: #2ecc71;">
          <div class="rc-card-header">
            <span class="rc-card-tag" style="background: #2ecc71; color: #000000; font-weight: bold;">✨ 100% Compliant Upgraded Draft</span>
          </div>
          <div class="rc-card-text">
            <strong>Title:</strong> ${escapeHtml(data.upgradedTitle || "")}
            <hr style="border: 0; border-top: 1px solid #272729; margin: 8px 0;" />
            <strong>Body:</strong>
            <br />
            ${escapeHtml(data.upgradedBody || "")}
          </div>
          <button type="button" class="rc-insert-full-post-btn" style="background: #2ecc71; color: #000000;" data-title="${escapeAttribute(data.upgradedTitle)}" data-body="${escapeAttribute(data.upgradedBody)}">
            ✨ Apply Upgraded Compliant Post into Reddit
          </button>
        </div>
      `;
    }

    // 5. Phase 5: Personalized Post Ideas Results
    else if (actionType === "suggest_post_ideas" && data.ideas) {
      html += `
        <div class="rc-section-header">
          <span class="rc-section-title">💡 Post Ideas for Your Profile:</span>
        </div>
      `;

      data.ideas.forEach((idea, idx) => {
        html += `
          <div class="rc-card">
            <div class="rc-card-header">
              <span class="rc-card-tag">Idea #${idx + 1}</span>
              <span class="rc-risk-badge" style="color: #3498db; background: rgba(52, 152, 219, 0.15);">${escapeHtml(idea.targetSubreddit || "r/all")}</span>
            </div>
            <div class="rc-card-text" style="font-weight: 600;">${escapeHtml(idea.topic)}</div>
            <div style="font-size: 11px; color: #818384;"><strong>Format:</strong> ${escapeHtml(idea.format || "Discussion")}</div>
            <div class="rc-why-bubble">
              <span class="rc-why-label">Why it works:</span>
              ${escapeHtml(idea.whyItWorks)}
            </div>
          </div>
        `;
      });
    }

    // 6. Existing Suggest Replies Results
    else if (actionType === "suggest_replies" && data.replies) {
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

        ${
          data.moderationNotes && data.moderationNotes.length > 0
            ? `
          <div class="rc-card">
            <span class="rc-card-tag" style="color: #2ecc71; background: rgba(46,204,113,0.1);">🛡️ Community Guidelines & Advice</span>
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
      html += `
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
