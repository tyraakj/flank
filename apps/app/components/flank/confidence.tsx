import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

export interface ConfidenceProps extends HTMLAttributes<HTMLDivElement> {
  score: number;
  reason?: string;
}

export function Confidence({ score, reason, className, ...props }: ConfidenceProps) {
  const getConfidenceLabel = () => {
    if (score >= 80) return "High";
    if (score >= 60) return "Normal";
    if (score >= 40) return "Low";
    return "Insufficient";
  };

  const getConfidenceColor = () => {
    if (score >= 80) return "bg-primary";
    if (score >= 60) return "bg-primary";
    if (score >= 40) return "bg-muted-foreground";
    return "bg-destructive";
  };

  const label = getConfidenceLabel();
  const showReason = score < 60 && reason;

  return (
    <div className={cn("inline-flex items-center gap-2", className)} {...props}>
      <div className={cn("h-2 w-2 rounded-full", getConfidenceColor())} />
      <span className="text-sm font-medium">{label}</span>
      {showReason && <span className="text-sm text-muted-foreground">({reason})</span>}
    </div>
  );
}
