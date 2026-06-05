"use client";

import { useState, useCallback } from "react";
import { type Editor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import { Icon } from "@iconify/react";
import { useAI } from "@/lib/ai/useAI";
import { getApiKeys } from "@/lib/db/repositories/api-key-repo";
import Link from "next/link";

type FormatBubbleMenuProps = {
  editor: Editor;
};

const COLORS = [
  { name: "Amarelo", value: "#FFD700" },
  { name: "Azul", value: "#3B82F6" },
  { name: "Verde", value: "#22C55E" },
  { name: "Vermelho", value: "#EF4444" },
  { name: "Roxo", value: "#A855F7" },
  { name: "Rosa", value: "#EC4899" },
  { name: "Laranja", value: "#F97316" },
  { name: "Azul-bebé", value: "#93C5FD" },
  { name: "Verde-água", value: "#6EE7B7" },
];

const AI_ACTIONS = [
  { id: "resumir", label: "Resumir", prompt: "Resume o seguinte texto de forma concisa:\n\n" },
  { id: "expandir", label: "Expandir", prompt: "Expande e desenvolve a seguinte ideia:\n\n" },
  { id: "traduzir", label: "Traduzir (PT)", prompt: "Traduz o seguinte texto para português:\n\n" },
  { id: "corrigir", label: "Corrigir gramática", prompt: "Corrige a gramática e ortografia:\n\n" },
];

export default function FormatBubbleMenu({ editor }: FormatBubbleMenuProps) {
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [aiResult, setAiResult] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const { streamChat, cancel } = useAI();

  const handleHighlightColor = useCallback(
    (color: string) => {
      editor.chain().focus().toggleHighlight({ color }).run();
      setShowHighlightPicker(false);
    },
    [editor],
  );

  const removeHighlight = useCallback(() => {
    editor.chain().focus().unsetHighlight().run();
    setShowHighlightPicker(false);
  }, [editor]);

  const handleTextColor = useCallback(
    (color: string) => {
      editor.chain().focus().setColor(color).run();
      setShowColorPicker(false);
    },
    [editor],
  );

  const removeColor = useCallback(() => {
    editor.chain().focus().unsetColor().run();
    setShowColorPicker(false);
  }, [editor]);

  const handleAIAction = useCallback(
    async (actionPrompt: string) => {
      const keys = await getApiKeys();
      if (keys.length === 0) {
        setAiError("Nenhuma chave de API configurada.");
        setShowAI(true);
        return;
      }

      const { from, to } = editor.state.selection;
      if (from === to) {
        setAiError("Seleciona algum texto primeiro.");
        setShowAI(true);
        return;
      }

      const selectedText = editor.state.doc.textBetween(from, to);
      const fullPrompt = actionPrompt + selectedText;
      const provider = keys[0].provider;

      setAiLoading(true);
      setAiError("");
      setAiResult("");
      setShowAI(true);

      await streamChat(provider, [{ role: "user", content: fullPrompt }], {
        onToken: (token) => setAiResult((prev) => prev + token),
        onDone: () => setAiLoading(false),
        onError: (err) => {
          setAiError(err);
          setAiLoading(false);
        },
      });
    },
    [editor, streamChat],
  );

  function handleReplaceSelection() {
    if (!aiResult) return;
    const { from, to } = editor.state.selection;
    editor.chain().focus().deleteRange({ from, to }).insertContent(aiResult).run();
    setShowAI(false);
    setAiResult("");
  }

  return (
    <BubbleMenu
      editor={editor}
      options={{
        placement: "top",
      }}
    >
      <div className="format-bubble-menu">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`fmt-btn ${editor.isActive("bold") ? "active" : ""}`}
          title="Negrito"
        >
          <strong>B</strong>
        </button>

        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`fmt-btn ${editor.isActive("italic") ? "active" : ""}`}
          title="Itálico"
        >
          <em>I</em>
        </button>

        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`fmt-btn ${editor.isActive("strike") ? "active" : ""}`}
          title="Riscado"
        >
          <s>S</s>
        </button>

        <button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`fmt-btn ${editor.isActive("underline") ? "active" : ""}`}
          title="Sublinhado"
        >
          <span className="underline decoration-1 underline-offset-2">U</span>
        </button>

        <span className="fmt-separator" />

        {/* Highlight */}
        <div className="fmt-color-wrapper">
          <button
            onClick={() => {
              setShowHighlightPicker(!showHighlightPicker);
              setShowColorPicker(false);
              setShowAI(false);
            }}
            className={`fmt-btn ${editor.isActive("highlight") ? "active" : ""}`}
            title="Marca-texto"
          >
            <Icon icon="basil:edit-outline" width={16} height={16} />
          </button>
          {showHighlightPicker && (
            <>
              <div
                className="fmt-color-overlay"
                onClick={() => setShowHighlightPicker(false)}
              />
              <div className="fmt-color-dropdown">
                <div className="fmt-color-grid">
                  {COLORS.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => handleHighlightColor(c.value)}
                      className="fmt-color-swatch"
                      style={{ backgroundColor: c.value }}
                      title={c.name}
                    />
                  ))}
                </div>
                <button
                  onClick={removeHighlight}
                  className="fmt-color-remove"
                  title="Remover marca-texto"
                >
                  ×
                </button>
              </div>
            </>
          )}
        </div>

        {/* Text Color */}
        <div className="fmt-color-wrapper">
          <button
            onClick={() => {
              setShowColorPicker(!showColorPicker);
              setShowHighlightPicker(false);
              setShowAI(false);
            }}
            className={`fmt-btn ${editor.isActive("textStyle") ? "active" : ""}`}
            title="Cor do texto"
          >
            <span className="fmt-text-color-icon">
              A
              <span className="fmt-underline-color" />
            </span>
          </button>
          {showColorPicker && (
            <>
              <div
                className="fmt-color-overlay"
                onClick={() => setShowColorPicker(false)}
              />
              <div className="fmt-color-dropdown">
                <div className="fmt-color-grid">
                  {COLORS.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => handleTextColor(c.value)}
                      className="fmt-color-swatch"
                      style={{ backgroundColor: c.value }}
                      title={c.name}
                    />
                  ))}
                </div>
                <button
                  onClick={removeColor}
                  className="fmt-color-remove"
                  title="Remover cor"
                >
                  ×
                </button>
              </div>
            </>
          )}
        </div>

        <span className="fmt-separator" />

        {/* IA */}
        <div className="fmt-color-wrapper">
          <button
            onClick={() => {
              setShowAI(!showAI);
              setShowHighlightPicker(false);
              setShowColorPicker(false);
            }}
            className={`fmt-btn ${showAI ? "active" : ""}`}
            title="IA"
          >
            <Icon icon="basil:lightbulb-alt-outline" width={16} height={16} />
          </button>
          {showAI && (
            <>
              <div
                className="fmt-color-overlay"
                onClick={() => setShowAI(false)}
              />
              <div className="fmt-ai-dropdown">
                {aiError && !aiLoading && !aiResult && (
                  <div className="px-3 py-2 text-xs text-error">
                    {aiError}
                    <Link
                      href="/settings"
                      className="block mt-1 text-accent hover:underline"
                      onClick={() => setShowAI(false)}
                    >
                      Configurar IA →
                    </Link>
                  </div>
                )}

                {!aiResult && !aiError && (
                  <div className="py-1">
                    {AI_ACTIONS.map((action) => (
                      <button
                        key={action.id}
                        onClick={() => handleAIAction(action.prompt)}
                        disabled={aiLoading}
                        className="w-full px-3 py-1.5 text-xs text-left text-on-surface hover:bg-surface-container transition-colors disabled:opacity-40"
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}

                {aiLoading && (
                  <div className="px-3 py-2 text-xs text-on-surface-variant flex items-center gap-2">
                    <span className="animate-pulse">A processar...</span>
                    <button
                      onClick={cancel}
                      className="text-error hover:underline"
                    >
                      Cancelar
                    </button>
                  </div>
                )}

                {aiResult && (
                  <div className="p-3 max-w-[300px]">
                    <div className="text-xs text-on-surface whitespace-pre-wrap max-h-40 overflow-y-auto mb-2 leading-relaxed">
                      {aiResult}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleReplaceSelection}
                        className="px-2 py-1 text-xs rounded bg-accent text-white hover:bg-accent/90 transition-colors"
                      >
                        Substituir
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(aiResult);
                          } catch { /* silent */ }
                        }}
                        className="px-2 py-1 text-xs rounded border border-outline-variant text-on-surface hover:bg-surface-container transition-colors"
                      >
                        Copiar
                      </button>
                      <button
                        onClick={() => {
                          setShowAI(false);
                          setAiResult("");
                          setAiError("");
                        }}
                        className="px-2 py-1 text-xs rounded border border-outline-variant text-on-surface-variant hover:text-primary transition-colors"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </BubbleMenu>
  );
}
