"use client";

import { useState, useCallback } from "react";
import { type Editor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import { Icon } from "@iconify/react";

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

export default function FormatBubbleMenu({ editor }: FormatBubbleMenuProps) {
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

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
      </div>
    </BubbleMenu>
  );
}
