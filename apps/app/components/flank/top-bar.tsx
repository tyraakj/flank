import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus, Settings, Plug2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TopBarProps {
  workspaceSlug: string;
  workspaceName: string;
}

export function TopBar({ workspaceSlug, workspaceName }: TopBarProps) {
  return (
    <header className="flex h-14 items-center justify-between border-b bg-card px-4">
      <div className="flex items-center gap-4">
        {/* Workspace switcher trigger - will be implemented in Unit 04 */}
        <Button variant="ghost" size="sm" className="font-medium">
          {workspaceName}
        </Button>
      </div>
      
      <div className="flex items-center gap-2">
        {/* New analysis action */}
        <Button variant="default" size="sm">
          <Plus className="h-4 w-4" />
          New Analysis
        </Button>
        
        {/* Integrations link */}
        <Link 
          href={`/${workspaceSlug}/integrations`}
          className={cn(
            "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors",
            "h-10 w-10 hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          )}
        >
          <Plug2 className="h-5 w-5" />
        </Link>
        
        {/* Settings link */}
        <Link 
          href={`/${workspaceSlug}/settings`}
          className={cn(
            "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors",
            "h-10 w-10 hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          )}
        >
          <Settings className="h-5 w-5" />
        </Link>
      </div>
    </header>
  );
}
