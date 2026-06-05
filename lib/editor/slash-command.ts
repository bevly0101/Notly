import { Extension } from "@tiptap/core";
import type { Editor } from "@tiptap/react";

export type SlashCommandItem = {
  title: string;
  description: string;
  icon: string;
  command: (editor: Editor) => void;
  isPageAction?: boolean;
};

export const SLASH_COMMANDS: SlashCommandItem[] = [
  {
    title: "Texto",
    description: "Parágrafo normal",
    icon: "Aa",
    command: (editor) => editor.chain().focus().setParagraph().run(),
  },
  {
    title: "Título 1",
    description: "Cabeçalho grande",
    icon: "H1",
    command: (editor) => editor.chain().focus().toggleHeading({ level: 1 }).run(),
  },
  {
    title: "Título 2",
    description: "Cabeçalho médio",
    icon: "H2",
    command: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    title: "Título 3",
    description: "Cabeçalho pequeno",
    icon: "H3",
    command: (editor) => editor.chain().focus().toggleHeading({ level: 3 }).run(),
  },
  {
    title: "Lista com marcadores",
    description: "Lista não ordenada",
    icon: "•",
    command: (editor) => editor.chain().focus().toggleBulletList().run(),
  },
  {
    title: "Lista numerada",
    description: "Lista ordenada",
    icon: "1.",
    command: (editor) => editor.chain().focus().toggleOrderedList().run(),
  },
  {
    title: "Tarefa",
    description: "Lista de tarefas com checkbox",
    icon: "☑",
    command: (editor) => editor.chain().focus().toggleTaskList().run(),
  },
  {
    title: "Citação",
    description: "Bloco de citação",
    icon: '"',
    command: (editor) => editor.chain().focus().toggleBlockquote().run(),
  },
  {
    title: "Código",
    description: "Bloco de código com realce",
    icon: "</>",
    command: (editor) => editor.chain().focus().toggleCodeBlock().run(),
  },
  {
    title: "Separador",
    description: "Linha horizontal",
    icon: "—",
    command: (editor) => editor.chain().focus().setHorizontalRule().run(),
  },
  {
    title: "Sub-página",
    description: "Criar página filha",
    icon: "📑",
    command: () => {},
    isPageAction: true,
  },
];

export const SlashCommandExtension = Extension.create({
  name: "slashCommand",

  addOptions() {
    return {
      onOpen: () => {},
      onClose: () => {},
    };
  },

  addKeyboardShortcuts() {
    return {
      Escape: () => {
        this.options.onClose(this.editor);
        return false;
      },
    };
  },
});
