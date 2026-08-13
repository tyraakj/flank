import { ReportTabs } from '@/components/flank/report-tabs';

interface TargetLayoutProps {
  children: React.ReactNode;
  params: {
    workspaceSlug: string;
    targetId: string;
  };
}

export default function TargetLayout({ children, params }: TargetLayoutProps) {
  return (
    <div className="flex h-full flex-col">
      <ReportTabs workspaceSlug={params.workspaceSlug} targetId={params.targetId} />
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
}
