import { cn } from "@/lib/utils";
import { HTMLAttributes, useState, forwardRef } from "react";

export interface SonnerProps extends HTMLAttributes<HTMLDivElement> {
  toast?: {
    title?: string;
    description?: string;
    variant?: "default" | "destructive";
  };
}

const Sonner = forwardRef<HTMLDivElement, SonnerProps>(({ className, toast, ...props }, ref) => {
  const [isVisible, setIsVisible] = useState(!!toast);

  if (!toast || !isVisible) return null;

  return (
    <div
      ref={ref}
      className={cn(
        "fixed bottom-4 right-4 z-50 rounded-lg border bg-background p-4 shadow-lg transition-all",
        toast.variant === "destructive" ? "border-destructive" : "",
        className,
      )}
      {...props}
    >
      {toast.title && <div className="font-semibold">{toast.title}</div>}
      {toast.description && (
        <div className="text-sm text-muted-foreground mt-1">{toast.description}</div>
      )}
    </div>
  );
});
Sonner.displayName = "Sonner";

export { Sonner };
