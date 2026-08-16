import { cn } from "@/lib/utils";
import { HTMLAttributes, useState, forwardRef } from "react";

export interface PopoverProps extends HTMLAttributes<HTMLDivElement> {
  trigger: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const Popover = forwardRef<HTMLDivElement, PopoverProps>(
  ({ className, trigger, open, onOpenChange, children, ...props }, ref) => {
    const [internalOpen, setInternalOpen] = useState(false);
    const isOpen = open !== undefined ? open : internalOpen;

    const handleOpenChange = (newOpen: boolean) => {
      onOpenChange?.(newOpen);
      if (open === undefined) {
        setInternalOpen(newOpen);
      }
    };

    return (
      <div ref={ref} className={cn("relative", className)} {...props}>
        <div onClick={() => handleOpenChange(!isOpen)}>{trigger}</div>
        {isOpen && (
          <div className="absolute z-50 w-72 rounded-md border bg-background p-4 text-foreground shadow-md">
            {children}
          </div>
        )}
      </div>
    );
  },
);
Popover.displayName = "Popover";

const PopoverContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("", className)} {...props} />,
);
PopoverContent.displayName = "PopoverContent";

export { Popover, PopoverContent };
