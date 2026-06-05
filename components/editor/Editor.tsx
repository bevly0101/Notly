"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import { getEditorExtensions } from "@/lib/editor/editor-config";
import { SlashCommandExtension, type SlashCommandItem } from "@/lib/editor/slash-command";
import type { PageReferenceAttrs } from "@/lib/editor/page-reference";
import { useWorkspace } from "@/lib/contexts/WorkspaceContext";
import { BlockRepo } from "@/lib/db";
import SlashCommandMenu from "./SlashCommandMenu";
import FormatBubbleMenu from "./FormatBubbleMenu";
import "./editor-styles.css";

export default function Editor() {
  const { isReady, currentPageId, updatePageProp, addNewPage, setCurrentPage } = useWorkspace();
  const [slashSearch, setSlashSearch] = useState("");
  const [slashOpen, setSlashOpen] = useState(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null);
  const titleTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null);
  const slashCharPos = useRef<number | null>(null);
  const pageIdRef = useRef<string | null>(null);
  const lastTitleRef = useRef<string>("");

  useEffect(() => {
    pageIdRef.current = currentPageId;
  }, [currentPageId]);

  const editorRef = useRef<import("@tiptap/react").Editor | null>(null);

  const handleSlashOpen = useCallback((ed: import("@tiptap/react").Editor) => {
    const { from } = ed.state.selection;
    const textBefore = ed.state.doc.textBetween(
      Math.max(0, from - 50),
      from,
    );
    const slashIdx = textBefore.lastIndexOf("/");
    if (slashIdx !== -1) {
      slashCharPos.current = slashIdx;
      const query = textBefore.slice(slashIdx + 1);
      setSlashSearch(query);
      setSlashOpen(true);
    }
  }, []);

  const handleSlashClose = useCallback(() => {
    setSlashOpen(false);
    setSlashSearch("");
    slashCharPos.current = null;
  }, []);

  const handleSlashSelect = useCallback(
    async (item: SlashCommandItem) => {
      const ed = editorRef.current;
      if (ed && slashCharPos.current !== null) {
        const { from } = ed.state.selection;
        const textBefore = ed.state.doc.textBetween(
          Math.max(0, from - 50),
          from,
        );
        const slashIdx = textBefore.lastIndexOf("/");
        if (slashIdx !== -1) {
          const queryLength = textBefore.length - slashIdx;
          ed
            .chain()
            .focus()
            .deleteRange({
              from: from - queryLength,
              to: from,
            })
            .run();
        }
      }

      if (item.isPageAction && item.title === "Sub-página") {
        const pid = pageIdRef.current;
        if (pid) {
          const newPage = await addNewPage(pid, false);
          if (newPage && ed) {
            const attrs: PageReferenceAttrs = {
              pageId: newPage.id,
              title: newPage.title,
              icon: newPage.icon,
            };
            ed.chain().focus().insertPageReference(attrs).run();
          }
        }
        handleSlashClose();
        return;
      }

      if (ed) {
        item.command(ed);
      }
      handleSlashClose();
    },
    [handleSlashClose, addNewPage],
  );

  const editor = useEditor({
    extensions: [
      ...getEditorExtensions(),
      // eslint-disable-next-line react-hooks/refs
      SlashCommandExtension.configure({
        onOpen: handleSlashOpen,
        onClose: handleSlashClose,
      }),
    ],
    immediatelyRender: true,
    shouldRerenderOnTransaction: false,
    content: {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [],
        },
      ],
    },
    onUpdate({ editor: ed }) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      const pid = pageIdRef.current;
      if (!pid) return;
      saveTimeoutRef.current = setTimeout(async () => {
        const json = ed.getJSON();
        try {
          const blocks = await BlockRepo.getBlocksByPage(pid);
          if (blocks.length > 0) {
            const lastBlock = blocks[blocks.length - 1];
            await BlockRepo.updateBlock(lastBlock.id, {
              content: json as Record<string, unknown>,
            });
          }
        } catch (err) {
          console.error("Failed to save editor content:", err);
        }
      }, 500);

      const { from } = ed.state.selection;
      const textBefore = ed.state.doc.textBetween(
        Math.max(0, from - 50),
        from,
      );
      const slashIdx = textBefore.lastIndexOf("/");

      if (slashOpen) {
        if (slashIdx === -1) {
          handleSlashClose();
        } else {
          const query = textBefore.slice(slashIdx + 1);
          setSlashSearch(query);
        }
      } else if (slashIdx !== -1) {
        const charBeforeSlash = textBefore[slashIdx - 1];
        if (!charBeforeSlash || charBeforeSlash === " " || charBeforeSlash === "\n") {
          handleSlashOpen(ed);
        }
      }

      if (titleTimeoutRef.current) clearTimeout(titleTimeoutRef.current);
      titleTimeoutRef.current = setTimeout(() => {
        let title = "";
        ed.state.doc.forEach((node) => {
          if (!title && node.type.name === "heading" && node.attrs.level === 1) {
            title = node.textContent;
          }
        });
        if (title && title !== lastTitleRef.current) {
          lastTitleRef.current = title;
          const pid = pageIdRef.current;
          if (pid) {
            updatePageProp(pid, { title });
          }
        }
      }, 800);
    },
    editorProps: {
      attributes: {
        class: "prose prose-invert max-w-none focus:outline-none",
      },
      handleClickOn: (_view, _pos, node) => {
        if (node.type.name === "pageReference") {
          const pageId = node.attrs.pageId as string | null;
          if (pageId) {
            setCurrentPage(pageId);
          }
          return true;
        }
        return false;
      },
    },
  });

  useEffect(() => {
    if (editor) {
      editorRef.current = editor;
    }
  }, [editor]);

  useEffect(() => {
    if (!isReady || !editor || !currentPageId) return;
    const pid = currentPageId;
    let cancelled = false;

    async function loadContent() {
      try {
        const blocks = await BlockRepo.getBlocksByPage(pid);
        if (cancelled) return;
        if (blocks.length > 0) {
          const lastBlock = blocks[blocks.length - 1];
          if (lastBlock.content) {
            editor.commands.setContent(lastBlock.content);
          }
        } else {
          await BlockRepo.createBlock({
            pageId: pid,
            type: "paragraph",
            content: {
              type: "doc",
              content: [{ type: "paragraph", content: [] }],
            },
            sortOrder: 0,
          });
        }
      } catch (err) {
        console.error("Failed to load editor content:", err);
      }
    }
    loadContent();

    return () => {
      cancelled = true;
    };
  }, [isReady, editor, currentPageId]);

  if (!isReady) {
    return (
      <div className="flex items-center justify-center py-16 text-on-surface-variant text-sm">
        A carregar...
      </div>
    );
  }

  if (!currentPageId) {
    return (
      <div className="flex items-center justify-center py-16 text-on-surface-variant text-sm">
        Nenhuma página selecionada
      </div>
    );
  }

  return (
    <div className="flex-1 flex">
      <div className="flex-1 px-4 sm:px-8 py-4 sm:py-6 max-w-[840px] mx-auto w-full">
        <EditorContent editor={editor} />
        {editor && <FormatBubbleMenu editor={editor} />}
        {slashOpen && editor && (
          <SlashCommandMenu
            editor={editor}
            search={slashSearch}
            onSelect={handleSlashSelect}
            onClose={handleSlashClose}
          />
        )}
      </div>
    </div>
  );
}
