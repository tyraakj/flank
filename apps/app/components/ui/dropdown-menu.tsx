import { cn } from "@/lib/utils"
import { HTMLAttributes, useState, forwardRef } from "react"

export interface DropdownMenuProps extends HTMLAttributes<HTMLDivElement> {
  trigger: React.ReactNode
}

const DropdownMenu = forwardRef<HTMLDivElement, DropdownMenuProps>(
  ({ className, trigger, children, ...props }, ref) => {
    const [isOpen, setIsOpen] = useState(false)

    return (
      <div ref={ref} className={cn("relative", className)} {...props}>
        <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>
        {isOpen && (
          <div className="absolute right-0 z-50 w-56 min-w-[8rem] overflow-hidden rounded-md border bg-background p-1 text-foreground shadow-md">
            {children}
          </div>
        )}
      </div>
    )
  }
)
DropdownMenu.displayName = "DropdownMenu"

const DropdownMenuItem = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, children, onClick, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground",
          className
        )}
        onClick={onClick}
        {...props}
      >
        {children}
      </div>
    )
  }
)
DropdownMenuItem.displayName = "DropdownMenuItem"

export { DropdownMenu, DropdownMenuItem }
