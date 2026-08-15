import { TopBar } from "@/components/flank/top-bar";
import { LeftNav } from "@/components/flank/left-nav";
import { requireWorkspaceMember } from "@/lib/access";
import { getUserWorkspaces } from "@/lib/workspaces";

interface WorkspaceLayoutProps {
  children: React.ReactNode;
  params: Promise<{
    workspaceSlug: string;
  }>;
}

export default async function WorkspaceLayout({ children, params }: WorkspaceLayoutProps) {
  const { workspaceSlug } = await params;
  const context = await requireWorkspaceMember(workspaceSlug);
  const workspaces = await getUserWorkspaces();

  return (
    <div className="flex h-screen flex-col">
      <TopBar
        workspaceSlug={workspaceSlug}
        workspaceName={context.workspace.name}
        workspaces={workspaces}
      />
      <div className="flex flex-1 overflow-hidden">
        <LeftNav workspaceSlug={workspaceSlug} />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
