import { cn } from "@/lib/utils";
import { HTMLAttributes, TableHTMLAttributes, forwardRef } from "react";

export interface DataTableProps extends TableHTMLAttributes<HTMLTableElement> {
  [key: string]: unknown;
}

const DataTable = forwardRef<HTMLTableElement, DataTableProps>(({ className, ...props }, ref) => {
  return (
    <div className="relative w-full overflow-auto">
      <table
        ref={ref}
        className={cn("w-full caption-bottom text-sm", className as string)}
        {...props}
      />
    </div>
  );
});
DataTable.displayName = "DataTable";

const DataTableHeader = forwardRef<
  HTMLTableSectionElement,
  HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn("[&_tr]:border-b", className as string)} {...props} />
));
DataTableHeader.displayName = "DataTableHeader";

const DataTableBody = forwardRef<HTMLTableSectionElement, HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tbody ref={ref} className={cn("[&_tr:last-child]:border-0", className as string)} {...props} />
  ),
);
DataTableBody.displayName = "DataTableBody";

const DataTableRow = forwardRef<HTMLTableRowElement, HTMLAttributes<HTMLTableRowElement>>(
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
DataTableRow.displayName = "DataTableRow";

const DataTableHead = forwardRef<HTMLTableCellElement, HTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <th
      ref={ref}
      className={cn(
        "h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
        className,
      )}
      {...props}
    />
  ),
);
DataTableHead.displayName = "DataTableHead";

const DataTableCell = forwardRef<HTMLTableCellElement, HTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <td
      ref={ref}
      className={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className as string)}
      {...props}
    />
  ),
);
DataTableCell.displayName = "DataTableCell";

export { DataTable, DataTableHeader, DataTableBody, DataTableRow, DataTableHead, DataTableCell };
