"use client";

import { useState, useCallback, useRef } from "react";
import { getDecryptedKey } from "@/lib/db/repositories/api-key-repo";
import { getProvider, type Message } from "./providers";

export type AIStreamCallbacks = {
  onToken: (token: string) => void;
  onDone: (fullText: string) => void;
  onError: (error: string) => void;
};

export function useAI() {
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const streamChat = useCallback(
    async (
      providerId: string,
      messages: Message[],
      callbacks: AIStreamCallbacks,
    ) => {
      setLoading(true);
      const abort = new AbortController();
      abortRef.current = abort;

      try {
        const providerConfig = getProvider(providerId);
        if (!providerConfig) {
          callbacks.onError("Provider não encontrado");
          setLoading(false);
          return;
        }

        const apiKey = await getDecryptedKey(providerId);
        if (!apiKey) {
          callbacks.onError(
            "Chave de API não configurada para " + providerConfig.name,
          );
          setLoading(false);
          return;
        }

        const res = await fetch("/api/ai/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-User-AI-Key": apiKey,
          },
          body: JSON.stringify({
            messages,
            provider: providerId,
            model: providerConfig.defaultModel,
            temperature: providerConfig.defaultTemperature,
          }),
          signal: abort.signal,
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: "Erro desconhecido" }));
          callbacks.onError(err.error ?? `Erro ${res.status}`);
          setLoading(false);
          return;
        }

        if (!res.body) {
          callbacks.onError("Resposta vazia do servidor");
          setLoading(false);
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let fullText = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });

          const lines = chunk.split("\n");
          for (const line of lines) {
            const token = providerConfig.parseStreamChunk(line);
            if (token) {
              fullText += token;
              callbacks.onToken(token);
            }
          }
        }

        callbacks.onDone(fullText);
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        callbacks.onError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
        abortRef.current = null;
      }
    },
    [],
  );

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    setLoading(false);
  }, []);

  return { streamChat, cancel, loading };
}
