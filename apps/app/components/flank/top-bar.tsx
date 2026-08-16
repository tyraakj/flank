import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, Settings, Plug2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { WorkspaceSwitcher } from "./workspace-switcher";
import { FlankLogo } from "./logo";

interface Workspace {
  id: string;
  name: string;
  slug: string;
}

interface TopBarProps {
  workspaceSlug: string;
  workspaces: Workspace[];
}

export function TopBar({ workspaceSlug, workspaces }: TopBarProps) {
  return (
    <header className="flex h-14 items-center justify-between border-b bg-card px-4">
      <div className="flex items-center gap-4">
        <Link
          href={`/w/${workspaceSlug}`}
          className="flex items-center gap-2.5 font-bold tracking-tight text-foreground hover:opacity-80 transition-opacity"
        >
          <FlankLogo size={22} />
          <span className="text-base font-bold">Flank</span>
        </Link>
        <div className="h-4 w-[1px] bg-border" />
        <WorkspaceSwitcher workspaces={workspaces} activeSlug={workspaceSlug} />
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
            "h-10 w-10 hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          )}
        >
          <Plug2 className="h-5 w-5" />
        </Link>

        {/* Settings link */}
        <Link
          href={`/${workspaceSlug}/settings`}
          className={cn(
            "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors",
            "h-10 w-10 hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          )}
        >
          <Settings className="h-5 w-5" />
        </Link>
      </div>
    </header>
  );
}
