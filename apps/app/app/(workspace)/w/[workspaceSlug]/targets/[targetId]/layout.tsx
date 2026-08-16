import { ReportTabs } from "@/components/flank/report-tabs";

interface TargetLayoutProps {
  children: React.ReactNode;
  params: Promise<{
    workspaceSlug: string;
    targetId: string;
  }>;
}

export default async function TargetLayout({ children, params }: TargetLayoutProps) {
  const { workspaceSlug, targetId } = await params;

  return (
    <div className="flex h-full flex-col">
      <ReportTabs workspaceSlug={workspaceSlug} targetId={targetId} />
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  );
}
