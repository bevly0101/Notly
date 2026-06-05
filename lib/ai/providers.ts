export type Message = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type ProviderConfig = {
  id: string;
  name: string;
  baseUrl: string;
  models: { id: string; name: string }[];
  defaultModel: string;
  defaultTemperature: number;
  formatRequest: (params: {
    messages: Message[];
    model: string;
    temperature: number;
    apiKey: string;
  }) => { url: string; headers: Record<string, string>; body: unknown };
  parseStreamChunk: (chunk: string) => string | null;
};

const PROVIDERS: Record<string, ProviderConfig> = {
  groq: {
    id: "groq",
    name: "Groq",
    baseUrl: "https://api.groq.com/openai/v1",
    models: [
      { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B" },
      { id: "llama-3.1-8b-instant", name: "Llama 3.1 8B" },
      { id: "mixtral-8x7b-32768", name: "Mixtral 8x7B" },
      { id: "gemma2-9b-it", name: "Gemma 2 9B" },
    ],
    defaultModel: "llama-3.3-70b-versatile",
    defaultTemperature: 0.7,
    formatRequest({ messages, model, temperature, apiKey }) {
      return {
        url: `${this.baseUrl}/chat/completions`,
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: {
          model,
          messages,
          temperature,
          stream: true,
        },
      };
    },
    parseStreamChunk(chunk: string) {
      const match = chunk.match(/data: (.+)/);
      if (!match) return null;
      try {
        const parsed = JSON.parse(match[1]);
        return parsed.choices?.[0]?.delta?.content ?? null;
      } catch {
        return null;
      }
    },
  },

  openai: {
    id: "openai",
    name: "OpenAI",
    baseUrl: "https://api.openai.com/v1",
    models: [
      { id: "gpt-4o", name: "GPT-4o" },
      { id: "gpt-4o-mini", name: "GPT-4o Mini" },
      { id: "gpt-4-turbo", name: "GPT-4 Turbo" },
      { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo" },
    ],
    defaultModel: "gpt-4o-mini",
    defaultTemperature: 0.7,
    formatRequest({ messages, model, temperature, apiKey }) {
      return {
        url: `${this.baseUrl}/chat/completions`,
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: {
          model,
          messages,
          temperature,
          stream: true,
        },
      };
    },
    parseStreamChunk(chunk: string) {
      const match = chunk.match(/data: (.+)/);
      if (!match) return null;
      if (match[1].trim() === "[DONE]") return null;
      try {
        const parsed = JSON.parse(match[1]);
        return parsed.choices?.[0]?.delta?.content ?? null;
      } catch {
        return null;
      }
    },
  },

  gemini: {
    id: "gemini",
    name: "Gemini",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta",
    models: [
      { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash" },
      { id: "gemini-2.0-flash-lite", name: "Gemini 2.0 Flash Lite" },
      { id: "gemini-2.0-pro-exp", name: "Gemini 2.0 Pro (Exp)" },
    ],
    defaultModel: "gemini-2.0-flash",
    defaultTemperature: 0.7,
    formatRequest({ messages, model, temperature, apiKey }) {
      const systemMsg = messages.find((m) => m.role === "system");
      const contents = messages
        .filter((m) => m.role !== "system")
        .map((m) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        }));
      return {
        url: `${this.baseUrl}/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`,
        headers: { "Content-Type": "application/json" },
        body: {
          contents,
          ...(systemMsg ? { systemInstruction: { parts: [{ text: systemMsg.content }] } } : {}),
          generationConfig: { temperature },
        },
      };
    },
    parseStreamChunk(chunk: string) {
      const match = chunk.match(/data: (.+)/);
      if (!match) return null;
      try {
        const parsed = JSON.parse(match[1]);
        return parsed.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
      } catch {
        return null;
      }
    },
  },

  claude: {
    id: "claude",
    name: "Claude",
    baseUrl: "https://api.anthropic.com/v1",
    models: [
      { id: "claude-sonnet-4-20250514", name: "Claude Sonnet 4" },
      { id: "claude-3-5-sonnet-20241022", name: "Claude 3.5 Sonnet" },
      { id: "claude-3-5-haiku-20241022", name: "Claude 3.5 Haiku" },
      { id: "claude-opus-4-20250514", name: "Claude Opus 4" },
    ],
    defaultModel: "claude-sonnet-4-20250514",
    defaultTemperature: 0.7,
    formatRequest({ messages, model, temperature, apiKey }) {
      const systemMsg = messages.find((m) => m.role === "system");
      const nonSystem = messages.filter((m) => m.role !== "system");
      return {
        url: `${this.baseUrl}/messages`,
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
        body: {
          model,
          messages: nonSystem.map((m) => ({ role: m.role, content: m.content })),
          ...(systemMsg ? { system: systemMsg.content } : {}),
          temperature,
          stream: true,
        },
      };
    },
    parseStreamChunk(chunk: string) {
      const match = chunk.match(/data: (.+)/);
      if (!match) return null;
      try {
        const parsed = JSON.parse(match[1]);
        if (parsed.type === "content_block_delta" && parsed.delta?.text) {
          return parsed.delta.text;
        }
        return null;
      } catch {
        return null;
      }
    },
  },
};

export function getProvider(id: string): ProviderConfig | undefined {
  return PROVIDERS[id];
}

export function getAllProviders(): ProviderConfig[] {
  return Object.values(PROVIDERS);
}

export function getProviderIds(): string[] {
  return Object.keys(PROVIDERS);
}

export { PROVIDERS };
