import { cn } from "@/lib/utils"
import { HTMLAttributes, useState, forwardRef } from "react"

export interface TabsProps extends HTMLAttributes<HTMLDivElement> {
  defaultValue?: string
}

const Tabs = forwardRef<HTMLDivElement, TabsProps>(
  ({ className, defaultValue, children, ...props }, ref) => {
    const [activeTab, setActiveTab] = useState(defaultValue || "")

    return (
      <div ref={ref} className={cn("", className)} {...props}>
        {Array.isArray(children) ? 
          children.map((child: any) => {
            if (child.type === TabsList) {
              return <child.type key="list" {...child.props} activeTab={activeTab} setActiveTab={setActiveTab} />
            }
            if (child.type === TabsContent) {
              return child.props.value === activeTab ? child : null
            }
            return child
          }) : 
          children
        }
      </div>
    )
  }
)
Tabs.displayName = "Tabs"

interface TabsListProps extends HTMLAttributes<HTMLDivElement> {
  activeTab?: string
  setActiveTab?: (value: string) => void
}

const TabsList = forwardRef<HTMLDivElement, TabsListProps>(
  ({ className, activeTab, setActiveTab, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground", className)}
        {...props}
      >
        {Array.isArray(children) ? 
          children.map((child: any) => (
            <child.type 
              key={child.props.value} 
              {...child.props} 
              isActive={child.props.value === activeTab}
              onClick={() => setActiveTab?.(child.props.value)}
            />
          )) : 
          children
        }
      </div>
    )
  }
)
TabsList.displayName = "TabsList"

interface TabsTriggerProps extends HTMLAttributes<HTMLButtonElement> {
  value: string
  isActive?: boolean
}

const TabsTrigger = forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ className, value, isActive, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          isActive ? "bg-background text-foreground shadow-sm" : "hover:bg-background/50 hover:text-foreground",
          className
        )}
        {...props}
      >
        {children}
      </button>
    )
  }
)
TabsTrigger.displayName = "TabsTrigger"

interface TabsContentProps extends HTMLAttributes<HTMLDivElement> {
  value: string
}

const TabsContent = forwardRef<HTMLDivElement, TabsContentProps>(
  ({ className, value, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2", className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)
TabsContent.displayName = "TabsContent"

export { Tabs, TabsList, TabsTrigger, TabsContent }
