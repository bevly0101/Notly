"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Icon } from "@iconify/react";
import { useAI, type AIStreamCallbacks } from "@/lib/ai/useAI";
import { getApiKeys } from "@/lib/db/repositories/api-key-repo";
import { getAllProviders } from "@/lib/ai/providers";
import Link from "next/link";

const QUICK_ACTIONS = [
  { label: "Resumir", prompt: "Resume o seguinte texto de forma concisa:\n\n" },
  { label: "Expandir", prompt: "Expande e desenvolve a seguinte ideia:\n\n" },
  { label: "Traduzir", prompt: "Traduz o seguinte texto para português:\n\n" },
  { label: "Corrigir", prompt: "Corrige a gramática e ortografia do seguinte texto:\n\n" },
];

export default function AIAssistant() {
  const [configured, setConfigured] = useState(false);
  const [configuredProvider, setConfiguredProvider] = useState<string | null>(null);
  const [loadingKeys, setLoadingKeys] = useState(true);
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState("");
  const { streamChat, cancel, loading } = useAI();
  const resultRef = useRef<HTMLDivElement>(null);

  const handleStream = useRef<AIStreamCallbacks>({
    onToken: (token) => setResult((prev) => prev + token),
    onDone: () => {},
    onError: (err) => setResult((prev) => prev + `\n\n[Erro: ${err}]`),
  });

  useEffect(() => {
    (async () => {
      setLoadingKeys(true);
      try {
        const keys = await getApiKeys();
        if (keys.length > 0) {
          setConfigured(true);
          setConfiguredProvider(keys[0].provider);
        } else {
          setConfigured(false);
          setConfiguredProvider(null);
        }
      } catch {
        setConfigured(false);
      } finally {
        setLoadingKeys(false);
      }
    })();
  }, []);

  const handleQuickAction = useCallback(
    async (actionPrompt: string) => {
      if (!configuredProvider) return;
      setResult("");
      await streamChat(configuredProvider, [
        { role: "user", content: actionPrompt },
      ], handleStream.current);
    },
    [configuredProvider, streamChat],
  );

  const handleSend = useCallback(async () => {
    if (!configuredProvider || !prompt.trim()) return;
    setResult("");
    await streamChat(configuredProvider, [
      { role: "user", content: prompt },
    ], handleStream.current);
  }, [configuredProvider, prompt, streamChat]);

  async function handleInsert() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result);
    } catch {
      /* silent fail */
    }
  }

  const providers = getAllProviders();

  if (loadingKeys) {
    return (
      <div className="flex items-center justify-center py-8 text-xs text-on-surface-variant">
        A verificar configuração...
      </div>
    );
  }

  if (!configured) {
    return (
      <div className="flex flex-col gap-4 py-4">
        <div className="text-xs text-on-surface-variant leading-relaxed">
          Nenhuma chave de API configurada. Adiciona uma chave nas Configurações para usar o assistente de IA.
        </div>
        <Link
          href="/settings"
          className="flex items-center gap-2 px-3 py-2 text-xs rounded-lg bg-accent text-white hover:bg-accent/90 transition-colors w-fit"
        >
          <Icon icon="basil:settings-outline" width={14} height={14} />
          Configurar IA
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="text-xs text-on-surface-variant flex items-center gap-2">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-secondary" />
        {providers.find((p) => p.id === configuredProvider)?.name ?? configuredProvider}
      </div>

      <div className="flex flex-col gap-2">
        {QUICK_ACTIONS.map((action) => (
          <button
            key={action.label}
            onClick={() => handleQuickAction(action.prompt)}
            disabled={loading}
            className="w-full px-3 py-2 text-xs text-left text-on-surface bg-surface-container rounded-lg hover:bg-surface-container-high transition-colors disabled:opacity-40"
          >
            {action.label}
          </button>
        ))}
      </div>

      <div className="relative">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Escreve um prompt personalizado..."
          className="w-full px-3 py-2 text-sm bg-surface-container rounded-lg text-on-surface placeholder:text-on-surface-variant outline-none ring-1 ring-outline-variant focus:ring-accent resize-none h-20 transition-shadow"
        />
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handleSend}
          disabled={!prompt.trim() || loading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-accent text-white hover:bg-accent/90 transition-colors disabled:opacity-40"
        >
          {loading ? "A gerar..." : "Enviar"}
        </button>
        {loading && (
          <button
            onClick={cancel}
            className="px-3 py-1.5 text-xs rounded-lg border border-outline-variant text-on-surface hover:bg-surface-container-high transition-colors"
          >
            Cancelar
          </button>
        )}
      </div>

      {result && (
        <div
          ref={resultRef}
          className="relative p-3 rounded-lg bg-surface-container border border-outline-variant text-sm text-on-surface whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto"
        >
          {result}
          <button
            onClick={handleInsert}
            className="mt-2 flex items-center gap-1.5 px-2 py-1 text-xs rounded-md bg-surface-container-high text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors"
          >
            <Icon icon="basil:copy-outline" width={12} height={12} />
            Copiar
          </button>
        </div>
      )}
    </div>
  );
}
