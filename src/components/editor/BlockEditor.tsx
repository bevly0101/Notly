"use client";

import { useCallback, useEffect, useRef } from "react";
import { useEditor, EditorContent, ReactRenderer, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import HorizontalRule from "@tiptap/extension-horizontal-rule";
import { Extension } from "@tiptap/core";
import Suggestion, { type SuggestionProps } from "@tiptap/suggestion";
import tippy, { type Instance as TippyInstance } from "tippy.js";
import "tippy.js/dist/tippy.css";
import { slashCommands } from "./slash-commands";
import { SlashCommandMenu, type SlashMenuRef } from "./SlashCommandMenu";
import { FloatingToolbar } from "./FloatingToolbar";
import { dataService } from "@/lib/data-service";

const SlashCommandExtension = Extension.create({
  name: "slashCommand",
  addOptions() {
    return {
      suggestion: {
        char: "/",
        command: ({
          editor,
          range,
          props,
        }: {
          editor: Editor;
          range: { from: number; to: number };
          props: { command: (editor: Editor, range: { from: number; to: number }) => void };
        }) => {
          props.command(editor, range);
        },
      },
    };
  },
  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
        items: ({ query }: { query: string }) =>
          slashCommands.filter((item) =>
            item.title.toLowerCase().includes(query.toLowerCase())
          ),
        render: () => {
          let component: ReactRenderer<SlashMenuRef> | null = null;
          let popup: TippyInstance[] | null = null;

          return {
            onStart: (props: SuggestionProps) => {
              component = new ReactRenderer(SlashCommandMenu, {
                props: {
                  items: props.items as typeof slashCommands,
                  command: (item: (typeof slashCommands)[0]) => {
                    props.command(item);
                  },
                },
                editor: props.editor,
              });

              if (!props.clientRect) return;

              popup = tippy("body", {
                getReferenceClientRect: props.clientRect as () => DOMRect,
                appendTo: () => document.body,
                content: component.element,
                showOnCreate: true,
                interactive: true,
                trigger: "manual",
                placement: "bottom-start",
              });
            },
            onUpdate(props: SuggestionProps) {
              component?.updateProps({
                items: props.items as typeof slashCommands,
                command: (item: (typeof slashCommands)[0]) => {
                  props.command(item);
                },
              });
              if (popup?.[0] && props.clientRect) {
                popup[0].setProps({
                  getReferenceClientRect: props.clientRect as () => DOMRect,
                });
              }
            },
            onKeyDown(props: { event: KeyboardEvent }) {
              if (props.event.key === "Escape") {
                popup?.[0]?.hide();
                return true;
              }
              return component?.ref?.onKeyDown(props) ?? false;
            },
            onExit() {
              popup?.[0]?.destroy();
              component?.destroy();
            },
          };
        },
      }),
    ];
  },
});

function useDebouncedSave(pageId: string, delay = 800) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  return useCallback(
    (content: Record<string, unknown>) => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        dataService.savePageDocument(pageId, content);
      }, delay);
    },
    [pageId, delay]
  );
}

export function BlockEditor({
  pageId,
  initialContent,
}: {
  pageId: string;
  initialContent: Record<string, unknown> | null;
}) {
  const save = useDebouncedSave(pageId);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        horizontalRule: false,
      }),
      Underline,
      Link.configure({ openOnClick: false }),
      TaskList,
      TaskItem.configure({ nested: true }),
      HorizontalRule,
      Placeholder.configure({
        placeholder: "Type '/' for commands...",
      }),
      SlashCommandExtension,
    ],
    content: initialContent ?? undefined,
    editorProps: {
      attributes: {
        class: "prose-notly focus:outline-none min-h-[300px]",
      },
    },
    onUpdate: ({ editor: ed }) => {
      save(ed.getJSON() as Record<string, unknown>);
    },
  });

  useEffect(() => {
    return () => {
      if (editor) {
        save(editor.getJSON() as Record<string, unknown>);
      }
    };
  }, [editor, save]);

  return (
    <div className="relative group/editor">
      <FloatingToolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
