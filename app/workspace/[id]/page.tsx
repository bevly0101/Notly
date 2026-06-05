import { WorkspaceProvider } from "@/lib/contexts/WorkspaceContext";
import WorkspaceLayout from "@/components/layout/WorkspaceLayout";
import Editor from "@/components/editor/Editor";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function WorkspacePage({ params }: Props) {
  const { id } = await params;

  return (
    <WorkspaceProvider workspaceId={id}>
      <WorkspaceLayout>
        <Editor />
      </WorkspaceLayout>
    </WorkspaceProvider>
  );
}
