import { Editor, Range } from "@tiptap/react";

export interface SlashCommandItem {
  title: string;
  description: string;
  icon: string;
  command: (editor: Editor, range: Range) => void;
}

export const slashCommands: SlashCommandItem[] = [
  {
    title: "Text",
    description: "Plain text paragraph",
    icon: "format_paragraph",
    command: (editor, range) => {
      editor.chain().focus().deleteRange(range).setParagraph().run();
    },
  },
  {
    title: "Heading 1",
    description: "Big section heading",
    icon: "format_h1",
    command: (editor, range) => {
      editor.chain().focus().deleteRange(range).setHeading({ level: 1 }).run();
    },
  },
  {
    title: "Heading 2",
    description: "Medium section heading",
    icon: "format_h2",
    command: (editor, range) => {
      editor.chain().focus().deleteRange(range).setHeading({ level: 2 }).run();
    },
  },
  {
    title: "Heading 3",
    description: "Small section heading",
    icon: "format_h3",
    command: (editor, range) => {
      editor.chain().focus().deleteRange(range).setHeading({ level: 3 }).run();
    },
  },
  {
    title: "Bullet list",
    description: "Unordered list",
    icon: "format_list_bulleted",
    command: (editor, range) => {
      editor.chain().focus().deleteRange(range).toggleBulletList().run();
    },
  },
  {
    title: "Numbered list",
    description: "Ordered list",
    icon: "format_list_numbered",
    command: (editor, range) => {
      editor.chain().focus().deleteRange(range).toggleOrderedList().run();
    },
  },
  {
    title: "To-do list",
    description: "Track tasks with checkboxes",
    icon: "checklist",
    command: (editor, range) => {
      editor.chain().focus().deleteRange(range).toggleTaskList().run();
    },
  },
  {
    title: "Quote",
    description: "Capture a quote",
    icon: "format_quote",
    command: (editor, range) => {
      editor.chain().focus().deleteRange(range).setBlockquote().run();
    },
  },
  {
    title: "Divider",
    description: "Visual separator",
    icon: "horizontal_rule",
    command: (editor, range) => {
      editor.chain().focus().deleteRange(range).setHorizontalRule().run();
    },
  },
];
