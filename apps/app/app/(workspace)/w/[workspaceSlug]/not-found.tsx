import Link from "next/link";
import { cn } from "@/lib/utils";

export default function WorkspaceNotFound() {
  return (
    <div className="flex h-screen flex-col items-center justify-center p-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">Workspace not found</h1>
        <p className="text-muted-foreground mb-6">
          The workspace you're looking for doesn't exist or you don't have access to it.
        </p>
        <Link
          href="/"
          className={cn(
            "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors",
            "h-10 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          )}
        >
          Go to home
        </Link>
      </div>
    </div>
  );
}
