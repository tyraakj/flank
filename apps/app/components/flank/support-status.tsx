import { CheckCircle2, Circle, XCircle, MinusCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

export type SupportStatus = "yes" | "partial" | "no" | "unknown";

export interface SupportStatusProps extends HTMLAttributes<HTMLDivElement> {
  status: SupportStatus;
}

export function SupportStatus({ status, className, ...props }: SupportStatusProps) {
  const getStatusConfig = () => {
    switch (status) {
      case "yes":
        return {
          icon: CheckCircle2,
          label: "Yes",
          iconClass: "text-primary",
        };
      case "partial":
        return {
          icon: Circle,
          label: "Partial",
          iconClass: "text-primary",
        };
      case "no":
        return {
          icon: XCircle,
          label: "No",
          iconClass: "text-destructive",
        };
      case "unknown":
        return {
          icon: MinusCircle,
          label: "Unknown",
          iconClass: "text-muted-foreground",
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div className={cn("inline-flex items-center gap-2", className)} {...props}>
      <Icon className={cn("h-4 w-4", config.iconClass)} />
      <span className="text-sm font-medium">{config.label}</span>
    </div>
  );
}
