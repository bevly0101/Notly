"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useWorkspace, usePages } from "@/lib/hooks/useRxQuery";
import { dataService } from "@/lib/data-service";
import { EditorShell } from "@/components/editor/EditorLayout";
import { BlockEditor } from "@/components/editor/BlockEditor";

export default function EditorPage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const pageId = params.pageId as string;
  const { workspace, loading: wsLoading } = useWorkspace(workspaceId);
  const { pages, loading: pagesLoading } = usePages(workspaceId);
  const [page, setPage] = useState<Awaited<ReturnType<typeof dataService.getPage>>>(null);
  const [content, setContent] = useState<Record<string, unknown> | null>(null);
  const [title, setTitle] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    dataService.getPage(pageId).then((p) => {
      if (p) {
        setPage(p);
        setTitle(p.title);
      }
    });
    dataService.getPageDocument(pageId).then((doc) => {
      setContent(doc);
      setLoaded(true);
    });
  }, [pageId]);

  const handleTitleBlur = () => {
    if (page && title !== page.title) {
      dataService.updatePage(pageId, { title });
    }
  };

  if (wsLoading || pagesLoading || !workspace || !page || !loaded) {
    return (
      <div className="min-h-screen mesh-bg flex items-center justify-center">
        <p className="text-on-surface-variant">Loading editor...</p>
      </div>
    );
  }

  return (
    <EditorShell workspace={workspace} page={page} pages={pages}>
      <article className="max-w-editor mx-auto px-6 sm:px-12 pt-12 pb-24">
        <div className="mb-8">
          <div className="text-[64px] leading-none mb-4 inline-block bg-background p-2 rounded-lg border border-outline-variant/10 shadow-lg">
            {page.icon ?? "📄"}
          </div>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
            className="w-full bg-transparent border-none text-display-lg font-bold text-primary placeholder-on-surface-variant focus:outline-none p-0"
            placeholder="Untitled"
          />
        </div>
        <BlockEditor pageId={pageId} initialContent={content} />
      </article>
    </EditorShell>
  );
}
