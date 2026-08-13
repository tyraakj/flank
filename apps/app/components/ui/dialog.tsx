import { cn } from "@/lib/utils"
import { HTMLAttributes, forwardRef } from "react"

export interface DialogProps extends HTMLAttributes<HTMLDivElement> {
  open?: boolean
  onClose?: () => void
}

const Dialog = forwardRef<HTMLDivElement, DialogProps>(
  ({ className, open = false, onClose, children, ...props }, ref) => {
    if (!open) return null

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
        <div
          ref={ref}
          className={cn(
            "relative z-50 max-w-lg w-full rounded-2xl border bg-background p-6 shadow-lg",
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
Dialog.displayName = "Dialog"

const DialogHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)}
      {...props}
    />
  )
)
DialogHeader.displayName = "DialogHeader"

const DialogTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h2
      ref={ref}
      className={cn("text-lg font-semibold leading-none tracking-tight", className)}
      {...props}
    />
  )
)
DialogTitle.displayName = "DialogTitle"

const DialogContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("pt-4", className)} {...props} />
  )
)
DialogContent.displayName = "DialogContent"

const DialogFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)}
      {...props}
    />
  )
)
DialogFooter.displayName = "DialogFooter"

export { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter }
