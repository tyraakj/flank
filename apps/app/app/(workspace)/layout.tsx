import { TopBar } from '@/components/flank/top-bar';
import { LeftNav } from '@/components/flank/left-nav';

interface WorkspaceLayoutProps {
  children: React.ReactNode;
  params: {
    workspaceSlug: string;
  };
}

export default function WorkspaceLayout({ children, params }: WorkspaceLayoutProps) {
  // TODO: Read workspace context on server in Unit 04
  // For now, render a safe fallback without session enforcement
  const workspaceSlug = params.workspaceSlug;

  return (
    <div className="flex h-screen flex-col">
      <TopBar workspaceSlug={workspaceSlug} workspaceName={workspaceSlug} />
      <div className="flex flex-1 overflow-hidden">
        <LeftNav workspaceSlug={workspaceSlug} />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
