import { cn } from "@/lib/utils";
import { HTMLAttributes, TableHTMLAttributes, forwardRef } from "react";

export interface MatrixProps extends TableHTMLAttributes<HTMLTableElement> {
  pinnedFirstColumn?: boolean;
}

const Matrix = forwardRef<HTMLTableElement, MatrixProps>(
  ({ className, _pinnedFirstColumn = true, ...props }, ref) => {
    return (
      <div className="relative w-full overflow-auto">
        <table ref={ref} className={cn("w-full caption-bottom text-sm", className)} {...props} />
      </div>
    );
  },
);
Matrix.displayName = "Matrix";

const MatrixHeader = forwardRef<HTMLTableSectionElement, HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props} />
  ),
);
MatrixHeader.displayName = "MatrixHeader";

const MatrixBody = forwardRef<HTMLTableSectionElement, HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tbody ref={ref} className={cn("[&_tr:last-child]:border-0", className)} {...props} />
  ),
);
MatrixBody.displayName = "MatrixBody";

const MatrixRow = forwardRef<HTMLTableRowElement, HTMLAttributes<HTMLTableRowElement>>(
  ({ className, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn(
        "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
        className,
      )}
      {...props}
    />
  ),
);
MatrixRow.displayName = "MatrixRow";

interface MatrixHeadProps extends HTMLAttributes<HTMLTableCellElement> {
  isPinned?: boolean;
}

const MatrixHead = forwardRef<HTMLTableCellElement, MatrixHeadProps>(
  ({ className, isPinned = false, ...props }, ref) => (
    <th
      ref={ref}
      className={cn(
        "h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
        {
          "sticky left-0 z-10 bg-background border-r shadow-sm": isPinned,
        },
        className,
      )}
      {...props}
    />
  ),
);
MatrixHead.displayName = "MatrixHead";

interface MatrixCellProps extends HTMLAttributes<HTMLTableCellElement> {
  isPinned?: boolean;
}

const MatrixCell = forwardRef<HTMLTableCellElement, MatrixCellProps>(
  ({ className, isPinned = false, ...props }, ref) => (
    <td
      ref={ref}
      className={cn(
        "p-4 align-middle [&:has([role=checkbox])]:pr-0 min-w-[120px]",
        {
          "sticky left-0 z-10 bg-background border-r shadow-sm font-medium": isPinned,
        },
        className,
      )}
      {...props}
    />
  ),
);
MatrixCell.displayName = "MatrixCell";

export { Matrix, MatrixHeader, MatrixBody, MatrixRow, MatrixHead, MatrixCell };
