"use client";

import { Editor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import { MaterialIcon } from "@/components/ui/MaterialIcon";

export function FloatingToolbar({ editor }: { editor: Editor | null }) {
  if (!editor) return null;

  const btn = (active: boolean) =>
    `p-1.5 rounded hover:bg-surface-variant transition-colors ${
      active ? "text-primary bg-surface-variant" : "text-on-surface-variant"
    }`;

  return (
    <BubbleMenu
      editor={editor}
      className="flex items-center gap-0.5 glass-panel rounded-lg p-1 border border-outline-variant/40 shadow-xl"
    >
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={btn(editor.isActive("bold"))}
        title="Bold"
      >
        <MaterialIcon name="format_bold" size={18} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={btn(editor.isActive("italic"))}
        title="Italic"
      >
        <MaterialIcon name="format_italic" size={18} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={btn(editor.isActive("underline"))}
        title="Underline"
      >
        <MaterialIcon name="format_underlined" size={18} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={btn(editor.isActive("strike"))}
        title="Strikethrough"
      >
        <MaterialIcon name="format_strikethrough" size={18} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleCode().run()}
        className={btn(editor.isActive("code"))}
        title="Code"
      >
        <MaterialIcon name="code" size={18} />
      </button>
      <button
        type="button"
        onClick={() => {
          const url = window.prompt("URL");
          if (url) editor.chain().focus().setLink({ href: url }).run();
        }}
        className={btn(editor.isActive("link"))}
        title="Link"
      >
        <MaterialIcon name="link" size={18} />
      </button>
    </BubbleMenu>
  );
}
