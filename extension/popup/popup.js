/**
 * Popup & Options Controller for Reddit AI Copilot
 */

const PROVIDER_METADATA = {
  gemini: {
    models: [
      { id: "gemini-3.7-flash", name: "Gemini 3.7 Flash (Ultra Cutting-Edge)" },
      { id: "gemini-3.6-flash", name: "Gemini 3.6 Flash" },
      { id: "gemini-3.5-flash", name: "Gemini 3.5 Flash" },
      { id: "gemini-3.0-flash", name: "Gemini 3.0 Flash" },
      { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash" },
      { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash (Fast)" },
      { id: "gemini-3.7-pro", name: "Gemini 3.7 Pro" },
      { id: "gemini-3.5-pro", name: "Gemini 3.5 Pro" },
      { id: "gemini-2.0-pro", name: "Gemini 2.0 Pro" },
      { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash" },
      { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro" },
      { id: "custom", name: "Custom Model Name..." },
    ],
    keyLink: "https://aistudio.google.com/app/apikey",
    keyPlaceholder: "Paste your Gemini API key (AIzaSy...)",
    requiresKey: true,
  },
  groq: {
    models: [
      { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B Versatile (Free & Fast)" },
      { id: "deepseek-r1-distill-llama-70b", name: "DeepSeek R1 (Llama 70B Distill)" },
      { id: "llama-3.2-90b-vision-preview", name: "Llama 3.2 90B Vision" },
      { id: "mixtral-8x7b-32768", name: "Mixtral 8x7B" },
      { id: "custom", name: "Custom Model Name..." },
    ],
    keyLink: "https://console.groq.com/keys",
    keyPlaceholder: "gsk_...",
    requiresKey: true,
  },
  openai: {
    models: [
      { id: "gpt-4.5-preview", name: "GPT-4.5 Preview" },
      { id: "o3-mini", name: "o3-mini (Reasoning)" },
      { id: "o1", name: "o1 (Advanced Reasoning)" },
      { id: "gpt-4o-mini", name: "GPT-4o-mini" },
      { id: "gpt-4o", name: "GPT-4o" },
      { id: "custom", name: "Custom Model Name..." },
    ],
    keyLink: "https://platform.openai.com/api-keys",
    keyPlaceholder: "sk-...",
    requiresKey: true,
  },
  deepseek: {
    models: [
      { id: "deepseek-reasoner", name: "DeepSeek-R1 (Reasoning)" },
      { id: "deepseek-chat", name: "DeepSeek-V3" },
      { id: "custom", name: "Custom Model Name..." },
    ],
    keyLink: "https://platform.deepseek.com/api_keys",
    keyPlaceholder: "sk-...",
    requiresKey: true,
  },
  ollama: {
    models: [
      { id: "llama3.3", name: "Llama 3.3 (Local)" },
      { id: "qwen2.5-coder", name: "Qwen 2.5 Coder (Local)" },
      { id: "mistral-large", name: "Mistral Large (Local)" },
      { id: "custom", name: "Custom Model Name..." },
    ],
    keyLink: "https://ollama.com",
    keyPlaceholder: "No API key required for local Ollama",
    requiresKey: false,
  },
};

// DOM Elements
const providerSelect = document.getElementById("provider-select");
const apiKeyInput = document.getElementById("api-key-input");
const getKeyLink = document.getElementById("get-key-link");
const modelSelect = document.getElementById("model-select");
const customModelInput = document.getElementById("custom-model-input");
const toggleKeyBtn = document.getElementById("toggle-key-visibility");
const toggleAdvancedBtn = document.getElementById("toggle-advanced");
const advancedContent = document.getElementById("advanced-content");
const endpointInput = document.getElementById("endpoint-input");
const personaInput = document.getElementById("user-persona-input");
const statusMessage = document.getElementById("status-message");
const testBtn = document.getElementById("test-btn");
const saveBtn = document.getElementById("save-btn");

// Populate models list based on selected provider
function updateProviderFields(provider, selectedModel = null) {
  const meta = PROVIDER_METADATA[provider] || PROVIDER_METADATA.gemini;
  
  if (getKeyLink) getKeyLink.href = meta.keyLink;
  if (apiKeyInput) apiKeyInput.placeholder = meta.keyPlaceholder;
  
  if (modelSelect) {
    modelSelect.innerHTML = "";
    let matched = false;
    meta.models.forEach((m) => {
      const opt = document.createElement("option");
      opt.value = m.id;
      opt.textContent = m.name;
      if (selectedModel && selectedModel === m.id) {
        opt.selected = true;
        matched = true;
      }
      modelSelect.appendChild(opt);
    });

    if (customModelInput) {
      if (selectedModel && !matched) {
        modelSelect.value = "custom";
        customModelInput.value = selectedModel;
        customModelInput.classList.remove("hidden");
      } else if (modelSelect.value === "custom") {
        customModelInput.classList.remove("hidden");
      } else {
        customModelInput.classList.add("hidden");
      }
    }
  }
}

// Show status banner
function showStatus(text, type = "success", duration = 4000) {
  if (!statusMessage) return;
  statusMessage.textContent = text;
  statusMessage.className = `status-message ${type}`;
  statusMessage.classList.remove("hidden");

  if (duration > 0) {
    setTimeout(() => {
      statusMessage.classList.add("hidden");
    }, duration);
  }
}

// Load settings from chrome.storage.local
function loadSettings() {
  if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get("settings", (res) => {
      const settings = res.settings || {
        provider: "gemini",
        apiKey: "",
        model: "gemini-3.7-flash",
        persona: "",
        tone: "helpful",
        customEndpoint: "",
      };

      if (providerSelect) providerSelect.value = settings.provider || "gemini";
      if (apiKeyInput) apiKeyInput.value = settings.apiKey || "";
      if (endpointInput) endpointInput.value = settings.customEndpoint || "";
      if (personaInput) personaInput.value = settings.persona || "";
      
      updateProviderFields(settings.provider || "gemini", settings.model);

      const toneRadio = document.querySelector(`input[name="tone"][value="${settings.tone || "helpful"}"]`);
      if (toneRadio) toneRadio.checked = true;

      if (settings.customEndpoint && advancedContent && toggleAdvancedBtn) {
        advancedContent.classList.remove("hidden");
        const chevron = toggleAdvancedBtn.querySelector(".chevron");
        if (chevron) chevron.classList.add("open");
      }
    });
  } else {
    updateProviderFields("gemini");
  }
}

// Get form values
function getFormSettings() {
  const selectedTone = document.querySelector('input[name="tone"]:checked')?.value || "helpful";
  let effectiveModel = modelSelect ? modelSelect.value : "gemini-3.7-flash";
  if (effectiveModel === "custom" && customModelInput) {
    effectiveModel = customModelInput.value.trim() || "gemini-3.7-flash";
  }

  return {
    provider: providerSelect ? providerSelect.value : "gemini",
    apiKey: apiKeyInput ? apiKeyInput.value.trim() : "",
    model: effectiveModel,
    persona: personaInput ? personaInput.value.trim() : "",
    tone: selectedTone,
    customEndpoint: endpointInput ? endpointInput.value.trim() : "",
  };
}

// Event Listeners
if (providerSelect) {
  providerSelect.addEventListener("change", (e) => {
    updateProviderFields(e.target.value);
  });
}

if (modelSelect) {
  modelSelect.addEventListener("change", (e) => {
    if (customModelInput) {
      if (e.target.value === "custom") {
        customModelInput.classList.remove("hidden");
        customModelInput.focus();
      } else {
        customModelInput.classList.add("hidden");
      }
    }
  });
}

if (toggleKeyBtn && apiKeyInput) {
  toggleKeyBtn.addEventListener("click", () => {
    const isPassword = apiKeyInput.type === "password";
    apiKeyInput.type = isPassword ? "text" : "password";
  });
}

if (toggleAdvancedBtn && advancedContent) {
  toggleAdvancedBtn.addEventListener("click", () => {
    const isHidden = advancedContent.classList.toggle("hidden");
    const chevron = toggleAdvancedBtn.querySelector(".chevron");
    if (chevron) chevron.classList.toggle("open", !isHidden);
  });
}

// Test Connection
if (testBtn) {
  testBtn.addEventListener("click", () => {
    const settings = getFormSettings();
    showStatus("Testing connection to AI provider...", "loading", 0);
    testBtn.disabled = true;

    chrome.runtime.sendMessage(
      { action: "TEST_CONNECTION", payload: settings },
      (response) => {
        testBtn.disabled = false;
        if (response && response.success) {
          showStatus(response.message || "Connection successful!", "success", 5000);
          
          if (response.availableModels && response.availableModels.length > 0 && modelSelect) {
            modelSelect.innerHTML = "";
            response.availableModels.forEach((m) => {
              const opt = document.createElement("option");
              opt.value = m.id;
              opt.textContent = m.displayName || m.id;
              if (m.id === response.effectiveModel) {
                opt.selected = true;
              }
              modelSelect.appendChild(opt);
            });
            const customOpt = document.createElement("option");
            customOpt.value = "custom";
            customOpt.textContent = "Custom Model Name...";
            modelSelect.appendChild(customOpt);
          } else if (response.effectiveModel && modelSelect) {
            modelSelect.value = response.effectiveModel;
          }
        } else {
          showStatus(response?.error || "Connection failed.", "error", 6000);
        }
      }
    );
  });
}

// Save Settings
if (saveBtn) {
  saveBtn.addEventListener("click", () => {
    const settings = getFormSettings();
    saveBtn.disabled = true;

    chrome.storage.local.set({ settings }, () => {
      saveBtn.disabled = false;
      showStatus("Settings saved successfully!", "success", 3000);
    });
  });
}

// Initialize on DOM load
document.addEventListener("DOMContentLoaded", loadSettings);
