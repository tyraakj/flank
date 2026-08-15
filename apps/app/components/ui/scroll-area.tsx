import { cn } from "@/lib/utils";
import { HTMLAttributes, forwardRef } from "react";

export type ScrollAreaProps = HTMLAttributes<HTMLDivElement>;

const ScrollArea = forwardRef<HTMLDivElement, ScrollAreaProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("relative overflow-auto", className)} {...props}>
        {children}
      </div>
    );
  },
);
ScrollArea.displayName = "ScrollArea";

export { ScrollArea };
