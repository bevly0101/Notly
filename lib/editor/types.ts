export type EditorBlockType =
  | "paragraph"
  | "heading"
  | "bulletList"
  | "orderedList"
  | "todoList"
  | "blockquote"
  | "codeBlock"
  | "divider";

export type EditorBlockAttrs = {
  level?: 1 | 2 | 3;
  language?: string;
  checked?: boolean;
};
