import { cn } from "@/lib/utils";
import { HTMLAttributes, useState, forwardRef } from "react";

export interface TooltipProps extends HTMLAttributes<HTMLDivElement> {
  content: string;
}

const Tooltip = forwardRef<HTMLDivElement, TooltipProps>(
  ({ className, content, children, ...props }, ref) => {
    const [isVisible, setIsVisible] = useState(false);

    return (
      <div
        ref={ref}
        className={cn("relative inline-block", className)}
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        {...props}
      >
        {children}
        {isVisible && (
          <div className="absolute z-50 px-2 py-1 text-xs text-white bg-gray-900 rounded-md shadow-lg -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
            {content}
          </div>
        )}
      </div>
    );
  },
);
Tooltip.displayName = "Tooltip";

export { Tooltip };
