import { cn } from "@/lib/utils"
import { HTMLAttributes, forwardRef } from "react"

export interface SeparatorProps extends HTMLAttributes<HTMLDivElement> {
  orientation?: "horizontal" | "vertical"
}

const Separator = forwardRef<HTMLDivElement, SeparatorProps>(
  ({ className, orientation = "horizontal", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "shrink-0 bg-border",
          {
            "h-[1px] w-full": orientation === "horizontal",
            "h-full w-[1px]": orientation === "vertical",
          },
          className
        )}
        {...props}
      />
    )
  }
)
Separator.displayName = "Separator"

export { Separator }
