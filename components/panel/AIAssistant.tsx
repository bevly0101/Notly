"use client";

import { useState } from "react";

export default function AIAssistant() {
  const [prompt, setPrompt] = useState("");

  return (
    <div className="flex flex-col gap-3">
      <div className="text-xs text-on-surface-variant">
        Assistente de IA — configura uma chave de API nas Definições para ativar.
      </div>

      <div className="flex flex-col gap-2">
        <button
          disabled
          className="w-full px-3 py-1.5 text-xs text-left text-on-surface-variant bg-surface-container rounded-lg hover:bg-surface-container-high transition-colors disabled:opacity-40"
        >
          ✏️ Resumir
        </button>
        <button
          disabled
          className="w-full px-3 py-1.5 text-xs text-left text-on-surface-variant bg-surface-container rounded-lg hover:bg-surface-container-high transition-colors disabled:opacity-40"
        >
          📖 Expandir
        </button>
        <button
          disabled
          className="w-full px-3 py-1.5 text-xs text-left text-on-surface-variant bg-surface-container rounded-lg hover:bg-surface-container-high transition-colors disabled:opacity-40"
        >
          🌐 Traduzir
        </button>
        <button
          disabled
          className="w-full px-3 py-1.5 text-xs text-left text-on-surface-variant bg-surface-container rounded-lg hover:bg-surface-container-high transition-colors disabled:opacity-40"
        >
          ✓ Corrigir gramática
        </button>
      </div>

      <div className="relative">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Escreve um prompt personalizado..."
          disabled
          className="w-full px-3 py-2 text-sm bg-surface-container rounded-lg text-on-surface placeholder:text-on-surface-variant outline-none ring-1 ring-outline-variant focus:ring-accent resize-none h-20 disabled:opacity-40"
        />
      </div>
    </div>
  );
}
