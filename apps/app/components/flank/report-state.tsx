import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

export type ReportState =
  "loading" | "empty" | "partial" | "low-confidence" | "failed" | "quota" | "stale";

export interface ReportStateProps extends HTMLAttributes<HTMLDivElement> {
  state: ReportState;
  message?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function ReportState({ state, message, action, className, ...props }: ReportStateProps) {
  const getStateConfig = () => {
    switch (state) {
      case "loading":
        return {
          defaultMessage: "Loading...",
          showSkeleton: true,
        };
      case "empty":
        return {
          defaultMessage: "No data available",
          showAction: true,
        };
      case "partial":
        return {
          defaultMessage: "Still gathering data",
          showAction: true,
        };
      case "low-confidence":
        return {
          defaultMessage: "Data quality issues detected",
          showAction: true,
        };
      case "failed":
        return {
          defaultMessage: "Failed to load data",
          showAction: true,
        };
      case "quota":
        return {
          defaultMessage: "Quota limit reached",
          showAction: true,
        };
      case "stale":
        return {
          defaultMessage: "Data is outdated",
          showAction: true,
        };
    }
  };

  const config = getStateConfig();
  const displayMessage = message || config.defaultMessage;

  return (
    <div className={cn("flex items-center justify-center p-8", className)} {...props}>
      <div className="text-center">
        {config.showSkeleton ? (
          <div className="space-y-2">
            <div className="h-4 w-32 animate-pulse rounded bg-muted" />
            <div className="h-4 w-48 animate-pulse rounded bg-muted" />
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">{displayMessage}</p>
            {action && (
              <button
                onClick={action.onClick}
                className="mt-2 text-sm font-medium text-primary hover:underline"
              >
                {action.label}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
