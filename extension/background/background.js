/**
 * Reddit AI Copilot - Background Service Worker
 * Handles extension settings, BYOK routing, context extraction requests,
 * and calls AI providers with resilient model fallback.
 */

// Import background scripts
importScripts("prompts.js", "ai_service.js");

const DEFAULT_SETTINGS = {
  provider: "google",
  apiKey: "",
  model: "gemini-2.5-flash",
  endpoint: "https://generativelanguage.googleapis.com",
  tone: "helpful",
  persona: "",
  karmaTier: "growing",
};

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get("settings", (res) => {
    if (!res.settings) {
      chrome.storage.local.set({ settings: DEFAULT_SETTINGS });
    }
  });
  console.log("[Reddit Copilot] Background Service Worker Initialized.");
});

// Listener for messages from popup and content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const { action, payload } = request;

  if (action === "TEST_CONNECTION") {
    const { provider, apiKey, model, endpoint } = payload;
    self.AI_SERVICE.testConnection({ provider, apiKey, model, endpoint })
      .then((res) => sendResponse(res))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true; // Keep message channel open for async response
  }

  if (action === "GET_DYNAMIC_MODELS") {
    const { provider, apiKey } = payload;
    self.AI_SERVICE.fetchDynamicModels({ provider, apiKey })
      .then((models) => sendResponse({ success: true, models }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true;
  }

  if (action === "RUN_COPILOT_ACTION") {
    chrome.storage.local.get("settings").then(async (res) => {
      const settings = res.settings || DEFAULT_SETTINGS;
      if (!settings.apiKey && settings.provider !== "ollama") {
        sendResponse({
          success: false,
          error: "API Key not configured. Please click the extension icon to set your API key first.",
        });
        return;
      }

      const {
        actionType,
        context,
        draftText,
        tone,
        length,
        customInstruction,
        originalText,
        refineInstruction,
        topic,
        targetCommunity,
        draftTitle,
        draftBody,
      } = payload;

      let promptConfig = null;
      const effectiveTone = tone || settings.tone || "helpful";
      const effectivePersona = settings.persona || "";
      const userProfile = context?.userProfile || { username: "Authenticated Redditor", karma: "Active Karma", accountTier: "growing" };

      // Route Unified Workflows
      if (actionType === "generate_full_post_bundle") {
        promptConfig = self.Prompts.getUnifiedGeneratePostPrompt({
          topic,
          userProfile,
          userPersona: effectivePersona,
          targetCommunity: targetCommunity || context?.subreddit,
          rules: context?.rules || [],
        });
      } else if (actionType === "check_anti_deletion") {
        promptConfig = self.Prompts.getAntiDeletionHealthPrompt({
          draftTitle,
          draftBody,
          userProfile,
          userPersona: effectivePersona,
        });
      } else if (actionType === "verify_community_rules") {
        promptConfig = self.Prompts.getCommunityRuleCheckPrompt({
          draftTitle,
          draftBody,
          subreddit: targetCommunity || context?.subreddit,
          rules: context?.rules || [],
          userProfile,
          userPersona: effectivePersona,
        });
      } else if (actionType === "suggest_replies") {
        promptConfig = self.Prompts.getSuggestRepliesPrompt(
          context,
          effectiveTone,
          effectivePersona,
          length || "standard",
          customInstruction || ""
        );
      } else if (actionType === "refine_single_reply") {
        promptConfig = self.Prompts.getRefineSingleReplyPrompt(
          context,
          originalText,
          refineInstruction,
          effectivePersona
        );
      } else if (actionType === "analyze_post") {
        promptConfig = self.Prompts.getAnalyzePostPrompt(context);
      } else if (actionType === "draft_question") {
        promptConfig = self.Prompts.getDraftQuestionPrompt(context);
      } else if (actionType === "preflight_check") {
        promptConfig = self.Prompts.getPreflightCheckPrompt(context, draftText);
      } else {
        sendResponse({ success: false, error: `Unknown action: ${actionType}` });
        return;
      }

      try {
        const result = await self.AI_SERVICE.generateAIResponse(
          settings,
          promptConfig.systemPrompt,
          promptConfig.userPrompt
        );
        sendResponse({ success: true, data: result });
      } catch (err) {
        console.error("[Reddit Copilot Background Error]", err);
        sendResponse({ success: false, error: err.message });
      }
    });

    return true; // Keep message channel open for async response
  }
});
