/**
 * Background Service Worker for Reddit AI Copilot
 */

importScripts("ai_service.js", "prompts.js");

// Default configuration settings
const DEFAULT_SETTINGS = {
  provider: "gemini",
  apiKey: "",
  model: "gemini-3.7-flash",
  tone: "helpful",
  customEndpoint: "",
};

// Initialize default settings on installation
chrome.runtime.onInstalled.addListener(async () => {
  const stored = await chrome.storage.local.get("settings");
  if (!stored.settings) {
    await chrome.storage.local.set({ settings: DEFAULT_SETTINGS });
  }
  console.log("Reddit AI Copilot extension initialized.");
});

// Central message listener for popup and content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const { action, payload } = message;

  if (action === "TEST_CONNECTION") {
    const { provider, apiKey, model, customEndpoint } = payload;
    self.AI_SERVICE.testConnection(provider, apiKey, model, customEndpoint)
      .then((res) => sendResponse(res))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true;
  }

  if (action === "GET_CONFIG") {
    chrome.storage.local.get("settings").then((res) => {
      sendResponse({ success: true, settings: res.settings || DEFAULT_SETTINGS });
    });
    return true;
  }

  if (action === "SAVE_CONFIG") {
    chrome.storage.local.set({ settings: payload }).then(() => {
      sendResponse({ success: true });
    });
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

      const { actionType, context, draftText, tone, length, customInstruction, originalText, refineInstruction } = payload;
      let promptConfig = null;

      const effectiveTone = tone || settings.tone || "helpful";
      const effectivePersona = settings.persona || "";

      if (actionType === "suggest_replies") {
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
          settings.provider,
          settings.apiKey,
          settings.model,
          promptConfig.systemPrompt,
          promptConfig.userPrompt,
          settings.customEndpoint
        );
        sendResponse({ success: true, data: result, actionType });
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
    });
    return true;
  }
});
