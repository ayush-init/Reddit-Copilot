/**
 * Unified AI Service for Multi-Provider LLM Integration
 * Supports Google Gemini, Groq, OpenAI, DeepSeek, and Local Ollama.
 */

const PROVIDER_CONFIGS = {
  gemini: {
    name: "Google Gemini",
    defaultModel: "gemini-2.0-flash",
    models: [
      "gemini-2.0-flash",
      "gemini-2.5-flash",
      "gemini-1.5-flash",
      "gemini-1.5-pro",
      "gemini-pro",
    ],
  },
  groq: {
    name: "Groq (Free & Ultra Fast)",
    defaultModel: "llama-3.3-70b-versatile",
    models: [
      "llama-3.3-70b-versatile",
      "deepseek-r1-distill-llama-70b",
      "llama-3.2-90b-vision-preview",
      "mixtral-8x7b-32768",
    ],
    baseUrl: "https://api.groq.com/openai/v1/chat/completions",
  },
  openai: {
    name: "OpenAI",
    defaultModel: "gpt-4o-mini",
    models: ["o3-mini", "gpt-4o-mini", "gpt-4o", "gpt-4.5-preview"],
    baseUrl: "https://api.openai.com/v1/chat/completions",
  },
  deepseek: {
    name: "DeepSeek",
    defaultModel: "deepseek-chat",
    models: ["deepseek-chat", "deepseek-reasoner"],
    baseUrl: "https://api.deepseek.com/v1/chat/completions",
  },
  ollama: {
    name: "Local Ollama",
    defaultModel: "llama3.3",
    models: ["llama3.3", "qwen2.5-coder", "mistral-large"],
    baseUrl: "http://localhost:11434/api/generate",
  },
};

function safeJsonParse(text) {
  if (!text) return {};
  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (err2) {
        // Fallback
      }
    }
    throw new Error("Unable to parse AI response as JSON: " + text.substring(0, 100));
  }
}

/**
 * Queries Google AI Studio directly to list all valid models for the user's API key.
 */
async function fetchLiveGeminiModels(apiKey) {
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `HTTP ${res.status}: ${res.statusText}`);
    }
    const data = await res.json();
    const models = (data.models || [])
      .filter((m) => m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent"))
      .map((m) => ({
        id: m.name.replace(/^models\//, ""),
        displayName: m.displayName || m.name.replace(/^models\//, ""),
      }));
    return { success: true, models };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Fetches dynamic models for supported providers (e.g. Gemini).
 */
async function fetchDynamicModels(options) {
  const provider = options?.provider === "google" ? "gemini" : (options?.provider || "gemini");
  const apiKey = options?.apiKey || "";

  if (provider === "gemini") {
    return await fetchLiveGeminiModels(apiKey);
  }

  // Fallback to static list
  const config = PROVIDER_CONFIGS[provider];
  if (config) {
    return {
      success: true,
      models: config.models.map((m) => ({ id: m, displayName: m })),
    };
  }
  return { success: false, error: `Unknown provider: ${provider}` };
}

/**
 * Validates connection with selected AI provider. Accepts either config object or arguments.
 */
async function testConnection(providerOrConfig, apiKey, model, customEndpoint) {
  let provider, key, mdl, endpoint;

  if (typeof providerOrConfig === "object" && providerOrConfig !== null) {
    provider = providerOrConfig.provider;
    key = providerOrConfig.apiKey;
    mdl = providerOrConfig.model;
    endpoint = providerOrConfig.endpoint || providerOrConfig.customEndpoint;
  } else {
    provider = providerOrConfig;
    key = apiKey;
    mdl = model;
    endpoint = customEndpoint;
  }

  if (provider === "google") provider = "gemini";

  if (provider !== "ollama" && (!key || key.trim() === "")) {
    return { success: false, error: "API Key is required." };
  }

  try {
    if (provider === "gemini") {
      const cleanModel = (mdl || "gemini-2.0-flash").replace(/^models\//, "");
      
      // Try direct test with user's selected model first
      try {
        const directUrl = `https://generativelanguage.googleapis.com/v1beta/models/${cleanModel}:generateContent?key=${key}`;
        const directRes = await fetch(directUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: "Ping" }] }],
            generationConfig: { maxOutputTokens: 5 },
          }),
        });

        if (directRes.ok) {
          return {
            success: true,
            message: `Connected successfully to Google Gemini (${cleanModel})!`,
            effectiveModel: cleanModel,
          };
        }
      } catch (e) {
        // Fallback to Live Models auto-discovery
      }

      // If direct call wasn't ok, query Live ListModels API to get active models for this key
      const liveResult = await fetchLiveGeminiModels(key);
      if (!liveResult.success) {
        throw new Error(liveResult.error || "Failed to validate Gemini API key.");
      }

      const availableModels = liveResult.models;
      if (!availableModels || availableModels.length === 0) {
        throw new Error("No content-generation models are enabled for this Gemini API key.");
      }

      // Pick best working model from the live list
      let targetModel = availableModels[0].id;
      const preferred = ["gemini-3.7-flash", "gemini-3.5-flash", "gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash", "gemini-pro"];
      for (const pref of preferred) {
        const match = availableModels.find((m) => m.id.includes(pref));
        if (match) {
          targetModel = match.id;
          break;
        }
      }

      return {
        success: true,
        message: `Connected successfully! Auto-selected active model (${targetModel})`,
        effectiveModel: targetModel,
        availableModels: availableModels,
      };
    }

    if (provider === "groq" || provider === "openai" || provider === "deepseek") {
      const selectedModel = mdl || PROVIDER_CONFIGS[provider].defaultModel;
      const baseUrl = endpoint || PROVIDER_CONFIGS[provider].baseUrl;
      const res = await fetch(baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [{ role: "user", content: "Ping. Respond with OK" }],
          max_tokens: 5,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData?.error?.message || `HTTP ${res.status}: ${res.statusText}`);
      }
      return { success: true, message: `Connected to ${PROVIDER_CONFIGS[provider].name} (${selectedModel})` };
    }

    if (provider === "ollama") {
      const selectedModel = mdl || PROVIDER_CONFIGS.ollama.defaultModel;
      const baseUrl = endpoint || PROVIDER_CONFIGS.ollama.baseUrl;
      const res = await fetch(baseUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: selectedModel,
          prompt: "Ping",
          stream: false,
        }),
      });

      if (!res.ok) {
        throw new Error(`Failed to reach Ollama at ${baseUrl} (HTTP ${res.status})`);
      }
      return { success: true, message: `Connected to Ollama (${selectedModel})` };
    }

    throw new Error(`Unsupported provider: ${provider}`);
  } catch (err) {
    return { success: false, error: err.message || "Failed to connect to provider." };
  }
}

/**
 * Universal text generation returning parsed JSON.
 * Accepts either (settingsObject, systemPrompt, userPrompt) OR (provider, apiKey, model, systemPrompt, userPrompt, customEndpoint).
 */
async function generateAIResponse(providerOrSettings, apiKeyOrSysPrompt, modelOrUserPrompt, systemPrompt, userPrompt, customEndpoint) {
  let provider, apiKey, model, sysPrompt, usrPrompt, endpoint;

  if (typeof providerOrSettings === "object" && providerOrSettings !== null) {
    provider = providerOrSettings.provider;
    apiKey = providerOrSettings.apiKey;
    model = providerOrSettings.model;
    endpoint = providerOrSettings.endpoint;
    sysPrompt = apiKeyOrSysPrompt;
    usrPrompt = modelOrUserPrompt;
  } else {
    provider = providerOrSettings;
    apiKey = apiKeyOrSysPrompt;
    model = modelOrUserPrompt;
    sysPrompt = systemPrompt;
    usrPrompt = userPrompt;
    endpoint = customEndpoint;
  }

  if (provider === "google") provider = "gemini";

  if (provider === "gemini") {
    const cleanModel = (model || "gemini-2.0-flash").replace(/^models\//, "");
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${cleanModel}:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: sysPrompt }] },
        contents: [{ parts: [{ text: usrPrompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.7,
        },
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Gemini API error: ${res.status}`);
    }

    const data = await res.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    return safeJsonParse(rawText);
  }

  if (provider === "groq" || provider === "openai" || provider === "deepseek") {
    const selectedModel = model || PROVIDER_CONFIGS[provider].defaultModel;
    const baseUrl = endpoint || PROVIDER_CONFIGS[provider].baseUrl;
    const res = await fetch(baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [
          { role: "system", content: `${sysPrompt}\nYou MUST return a valid JSON object matching the requested schema.` },
          { role: "user", content: usrPrompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `${PROVIDER_CONFIGS[provider].name} API error: ${res.status}`);
    }

    const data = await res.json();
    const rawText = data?.choices?.[0]?.message?.content || "{}";
    return JSON.parse(rawText);
  }

  if (provider === "ollama") {
    const selectedModel = model || PROVIDER_CONFIGS.ollama.defaultModel;
    const baseUrl = endpoint || PROVIDER_CONFIGS.ollama.baseUrl;
    const res = await fetch(baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: selectedModel,
        system: sysPrompt,
        prompt: usrPrompt,
        format: "json",
        stream: false,
      }),
    });

    if (!res.ok) {
      throw new Error(`Ollama API error: HTTP ${res.status}`);
    }

    const data = await res.json();
    return JSON.parse(data.response);
  }

  throw new Error(`Unknown provider: ${provider}`);
}

// Export for background service worker
if (typeof self !== "undefined") {
  self.AI_SERVICE = {
    PROVIDER_CONFIGS,
    fetchLiveGeminiModels,
    fetchDynamicModels,
    testConnection,
    generateAIResponse,
  };
}
