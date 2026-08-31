/**
 * Background Service Worker for Reddit AI Copilot
 */

importScripts("ai_service.js");

// Default configuration settings
const DEFAULT_SETTINGS = {
  provider: "gemini",
  apiKey: "",
  model: "gemini-1.5-flash",
  tone: "helpful", // helpful | conversational | question
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
    return true; // Keep channel open for async response
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

  if (action === "GENERATE_AI") {
    chrome.storage.local.get("settings").then(async (res) => {
      const settings = res.settings || DEFAULT_SETTINGS;
      if (!settings.apiKey && settings.provider !== "ollama") {
        sendResponse({
          success: false,
          error: "API Key not configured. Please open Reddit Copilot extension settings to add your key.",
        });
        return;
      }

      try {
        const result = await self.AI_SERVICE.generateAIResponse(
          settings.provider,
          settings.apiKey,
          settings.model,
          payload.systemPrompt,
          payload.userPrompt,
          settings.customEndpoint
        );
        sendResponse({ success: true, data: result });
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
    });
    return true;
  }
});
