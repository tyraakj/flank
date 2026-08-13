'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface ReportTabsProps {
  workspaceSlug: string;
  targetId: string;
}

const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'competitors', label: 'Competitors' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'features', label: 'Features' },
  { id: 'positioning', label: 'Positioning' },
  { id: 'edge', label: 'Edge' },
  { id: 'sources', label: 'Sources' },
  { id: 'history', label: 'History' },
];

export function ReportTabs({ workspaceSlug, targetId }: ReportTabsProps) {
  const pathname = usePathname();
  const basePath = `/${workspaceSlug}/targets/${targetId}`;

  return (
    <div className="border-b bg-card">
      <div className="flex overflow-x-auto">
        {tabs.map((tab) => {
          const href = `${basePath}/${tab.id}`;
          const isActive = pathname === href || (tab.id === 'overview' && pathname === basePath);
          
          return (
            <Link
              key={tab.id}
              href={href}
              className={cn(
                'flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors',
                isActive
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
