/**
 * Reddit AI Copilot - Content Script Router
 * Facilitates on-demand user actions and communication with background AI worker.
 */

(function () {
  console.log("[Reddit AI Copilot] Active and ready for user actions.");

  // Listen for messages from popup or background if needed
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "EXTRACT_PAGE_CONTEXT") {
      if (window.ContextExtractor) {
        const snapshot = window.ContextExtractor.collectCurrentContext();
        sendResponse({ success: true, context: snapshot });
      } else {
        sendResponse({ success: false, error: "Context extractor not initialized." });
      }
      return true;
    }
  });
})();
