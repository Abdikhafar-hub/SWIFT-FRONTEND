import React from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "./button";

export function Table({ className, ...props }: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="relative w-full overflow-auto rounded-xs border border-border bg-card">
      <table className={cn("w-full caption-bottom text-sm", className)} {...props} />
    </div>
  );
}

export function TableHeader({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn("border-b border-border bg-muted/30", className)} {...props} />;
}

export function TableBody({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn("[&_tr:last-child]:border-0", className)} {...props} />;
}

export function TableFooter({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tfoot className={cn("border-t border-border bg-muted/50 font-medium", className)} {...props} />;
}

export function TableRow({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn(
        "border-b border-border/70 transition-colors hover:bg-muted/30 data-[state=selected]:bg-muted",
        className
      )}
      {...props}
    />
  );
}

export function TableHead({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        "h-11 px-4 text-left align-middle font-display text-xs font-bold uppercase tracking-wider text-muted-foreground",
        className
      )}
      {...props}
    />
  );
}

export function TableCell({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn("p-4 align-middle text-foreground", className)} {...props} />;
}

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onChange?: (page: number) => void;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onChange,
  className,
}: PaginationProps) {
  const handlePageChange = onPageChange || onChange || (() => {});
  if (totalPages <= 1) return null;

  return (
    <div className={cn("flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-2", className)}>
      {totalItems !== undefined && (
        <p className="text-xs text-muted-foreground">
          Showing <span className="font-semibold text-foreground">{((currentPage - 1) * (pageSize || 10)) + 1}</span> to{" "}
          <span className="font-semibold text-foreground">
            {Math.min(currentPage * (pageSize || 10), totalItems)}
          </span>{" "}
          of <span className="font-semibold text-foreground">{totalItems}</span> records
        </p>
      )}

      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="xs"
          disabled={currentPage <= 1}
          onClick={() => handlePageChange(1)}
          aria-label="First page"
        >
          <ChevronsLeft className="size-3.5" />
        </Button>
        <Button
          variant="outline"
          size="xs"
          disabled={currentPage <= 1}
          onClick={() => handlePageChange(currentPage - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft className="size-3.5" />
        </Button>

        <span className="px-2 text-xs font-semibold text-foreground">
          Page {currentPage} of {totalPages}
        </span>

        <Button
          variant="outline"
          size="xs"
          disabled={currentPage >= totalPages}
          onClick={() => handlePageChange(currentPage + 1)}
          aria-label="Next page"
        >
          <ChevronRight className="size-3.5" />
        </Button>
        <Button
          variant="outline"
          size="xs"
          disabled={currentPage >= totalPages}
          onClick={() => handlePageChange(totalPages)}
          aria-label="Last page"
        >
          <ChevronsRight className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}

export interface TimelineItem {
  id: string;
  title: string;
  description?: string;
  timestamp: string;
  status?: "completed" | "active" | "pending" | "danger";
  icon?: React.ReactNode;
}

export function Timeline({ items, className }: { items: TimelineItem[]; className?: string }) {
  return (
    <div className={cn("relative flex flex-col space-y-6 pl-6", className)}>
      <div className="absolute left-2.5 top-2 bottom-2 w-0.5 bg-border" />
      {items.map((item) => {
        const isCompleted = item.status === "completed";
        const isActive = item.status === "active";
        const isDanger = item.status === "danger";

        return (
          <div key={item.id} className="relative flex items-start gap-4">
            <div
              className={cn(
                "absolute -left-6 flex size-5 items-center justify-center rounded-full border-2 bg-background",
                isCompleted && "border-emerald-brand bg-emerald-brand text-white",
                isActive && "border-gold bg-gold text-ink animate-pulse",
                isDanger && "border-destructive bg-destructive text-white",
                (!item.status || item.status === "pending") && "border-muted-foreground/40 bg-card text-muted-foreground"
              )}
            >
              {item.icon ? (
                <div className="size-3 flex items-center justify-center">{item.icon}</div>
              ) : (
                <span className="size-1.5 rounded-full bg-current" />
              )}
            </div>

            <div className="flex flex-col">
              <span className="font-display text-sm font-semibold text-foreground">
                {item.title}
              </span>
              {item.description && (
                <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              )}
              <span className="mt-1 text-[11px] font-medium text-muted-foreground/80">
                {item.timestamp}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
