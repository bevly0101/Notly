"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { dataService } from "@/lib/data-service";

export default function NewPageRedirect() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.workspaceId as string;

  useEffect(() => {
    dataService.createPage(workspaceId).then((page) => {
      router.replace(`/w/${workspaceId}/p/${page.id}`);
    });
  }, [workspaceId, router]);

  return (
    <div className="min-h-screen mesh-bg flex items-center justify-center">
      <p className="text-on-surface-variant">Creating page...</p>
    </div>
  );
}
