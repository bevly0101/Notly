import { Node, mergeAttributes } from "@tiptap/core";

export interface PageReferenceAttrs {
  pageId: string | null;
  title: string;
  icon: string | null | undefined;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    pageReference: {
      insertPageReference: (attrs: PageReferenceAttrs) => ReturnType;
    };
  }
}

export const PageReference = Node.create({
  name: "pageReference",

  group: "inline",
  inline: true,
  atom: true,

  addAttributes() {
    return {
      pageId: { default: null },
      title: { default: "Sem título" },
      icon: { default: "document-outline" },
    };
  },

  parseHTML() {
    return [
      {
        tag: "span[data-page-ref]",
        getAttrs: (el) => ({
          pageId: (el as HTMLElement).getAttribute("data-page-id"),
          title: (el as HTMLElement).getAttribute("data-title"),
          icon: (el as HTMLElement).getAttribute("data-icon"),
        }),
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(HTMLAttributes, {
        "data-page-ref": "",
        "data-page-id": HTMLAttributes.pageId,
        "data-title": HTMLAttributes.title,
        "data-icon": HTMLAttributes.icon,
        class: "page-reference",
        title: `Ir para "${HTMLAttributes.title}"`,
      }),
      `📄 ${HTMLAttributes.title}`,
    ];
  },

  addCommands() {
    return {
      insertPageReference:
        (attrs: PageReferenceAttrs) =>
        ({ chain }) =>
          chain()
            .insertContent({
              type: this.name,
              attrs: {
                pageId: attrs.pageId,
                title: attrs.title,
                icon: attrs.icon,
              },
            })
            .run(),
    };
  },
});
