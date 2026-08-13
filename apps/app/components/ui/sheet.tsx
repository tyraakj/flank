import { cn } from "@/lib/utils"
import { HTMLAttributes, useState, forwardRef } from "react"

export interface SheetProps extends HTMLAttributes<HTMLDivElement> {
  open?: boolean
  onClose?: () => void
  side?: "right" | "left" | "top" | "bottom"
}

const Sheet = forwardRef<HTMLDivElement, SheetProps>(
  ({ className, open = false, onClose, side = "right", children, ...props }, ref) => {
    if (!open) return null

    const getSideClasses = () => {
      switch (side) {
        case "right":
          return "right-0 h-full w-96 border-l"
        case "left":
          return "left-0 h-full w-96 border-r"
        case "top":
          return "top-0 w-full h-96 border-b"
        case "bottom":
          return "bottom-0 w-full h-96 border-t"
      }
    }

    return (
      <div className="fixed inset-0 z-50 flex">
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
        <div
          ref={ref}
          className={cn(
            "fixed z-50 bg-background shadow-lg transition-transform",
            getSideClasses(),
            className
          )}
          {...props}
        >
          {children}
        </div>
      </div>
    )
  }
)
Sheet.displayName = "Sheet"

const SheetHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-col space-y-2 p-6", className)}
      {...props}
    />
  )
)
SheetHeader.displayName = "SheetHeader"

const SheetTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h2
      ref={ref}
      className={cn("text-lg font-semibold", className)}
      {...props}
    />
  )
)
SheetTitle.displayName = "SheetTitle"

const SheetContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex-1 overflow-y-auto p-6 pt-0", className)} {...props} />
  )
)
SheetContent.displayName = "SheetContent"

const SheetFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex items-center justify-end space-x-2 p-6", className)}
      {...props}
    />
  )
)
SheetFooter.displayName = "SheetFooter"

export { Sheet, SheetHeader, SheetTitle, SheetContent, SheetFooter }
