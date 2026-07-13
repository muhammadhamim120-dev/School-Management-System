"use client";
import * as React from "react";
import { Search, ChevronLeft, ChevronRight, Inbox, ArrowUp, ArrowDown, ChevronsUpDown, AlertCircle, X, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { SortState } from "@/hooks/use-resource-list";

export type Column<T> = {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
  sortField?: string;
};

type Props<T> = {
  columns: Column<T>[];
  rows: T[];
  loading?: boolean;
  error?: string | null;
  total: number;
  page: number;
  totalPages: number;
  search: string;
  onSearch: (v: string) => void;
  onPage: (p: number) => void;
  searchPlaceholder?: string;
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  sort?: SortState | null;
  onToggleSort?: (field: string) => void;
  filters?: React.ReactNode;
  activeFilterCount?: number;
  onClearFilters?: () => void;
  onRetry?: () => void;
  pageSize?: number;
  onPageSizeChange?: (size: number) => void;
};

function getPageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "...")[] = [1];
  if (current > 3) pages.push("...");
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
    pages.push(i);
  }
  if (current < total - 2) pages.push("...");
  pages.push(total);
  return pages;
}

export function DataTable<T>({
  columns, rows, loading, error, total, page, totalPages, search, onSearch, onPage,
  searchPlaceholder = "Search...", rowKey, onRowClick, sort, onToggleSort,
  filters, activeFilterCount = 0, onClearFilters, onRetry,
  pageSize = 10, onPageSizeChange,
}: Props<T>) {
  const startItem = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, total);
  const pageNumbers = getPageNumbers(page, Math.max(1, totalPages));

  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-soft">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 border-b border-border/60 p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/60" />
            <Input
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="h-8 border-0 bg-muted/50 pl-8 text-sm shadow-none focus-visible:bg-card focus-visible:ring-1 focus-visible:ring-ring/40"
            />
            {search && (
              <button
                onClick={() => onSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          {filters}
          {activeFilterCount > 0 && onClearFilters && (
            <Button variant="ghost" size="sm" onClick={onClearFilters} className="h-8 text-xs text-muted-foreground">
              <X className="h-3 w-3 mr-1" /> Clear ({activeFilterCount})
            </Button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
            {total.toLocaleString()} record{total !== 1 ? "s" : ""}
          </span>
          {onPageSizeChange && (
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="h-8 rounded-md border border-border bg-card px-2 text-xs text-muted-foreground outline-none focus:ring-1 focus:ring-ring/40"
            >
              {[10, 25, 50, 100].map((s) => (
                <option key={s} value={s}>{s} / page</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-b border-border/60">
              {columns.map((c) => {
                const sortable = !!c.sortField && !!onToggleSort;
                const active = sort?.field === c.sortField;
                return (
                  <TableHead key={c.key} className={cn("h-10 text-xs font-medium", c.className)}>
                    {sortable ? (
                      <button
                        type="button"
                        onClick={() => onToggleSort!(c.sortField!)}
                        className="inline-flex items-center gap-1 uppercase tracking-wider transition-colors hover:text-foreground"
                      >
                        {c.header}
                        {active ? (
                          sort!.dir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                        ) : (
                          <ChevronsUpDown className="h-3 w-3 opacity-30" />
                        )}
                      </button>
                    ) : (
                      c.header
                    )}
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {error ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={columns.length} className="h-40 text-center">
                  <div className="flex flex-col items-center gap-3 text-muted-foreground">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                      <AlertCircle className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Something went wrong</p>
                      <p className="text-sm">{error}</p>
                    </div>
                    {onRetry && <Button variant="outline" size="sm" onClick={onRetry} className="h-8">Try again</Button>}
                  </div>
                </TableCell>
              </TableRow>
            ) : loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i} className="hover:bg-transparent">
                  {columns.map((c) => (
                    <TableCell key={c.key}><Skeleton className="h-4 w-3/4" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : rows.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={columns.length} className="h-40 text-center">
                  <div className="flex flex-col items-center gap-3 text-muted-foreground">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/60">
                      <Inbox className="h-6 w-6 text-muted-foreground/50" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">No records found</p>
                      <p className="text-sm">Try adjusting your search or filters.</p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, i) => (
                <TableRow
                  key={rowKey(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(
                    "row-enter group/row transition-colors",
                    onRowClick && "cursor-pointer hover:bg-muted/40"
                  )}
                  style={{ animationDelay: `${Math.min(i, 12) * 0.03}s` }}
                >
                  {columns.map((c) => (
                    <TableCell key={c.key} className={cn("py-2.5", c.className)}>
                      {c.render ? c.render(row) : String((row as Record<string, unknown>)[c.key] ?? "—")}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-4 border-t border-border/60 px-4 py-2.5">
          <span className="text-xs text-muted-foreground tabular-nums">
            Showing {startItem}–{endItem} of {total.toLocaleString()}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() => onPage(1)}
              disabled={page <= 1}
            >
              <ChevronsLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() => onPage(page - 1)}
              disabled={page <= 1}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>

            {pageNumbers.map((p, idx) =>
              p === "..." ? (
                <span key={`dots-${idx}`} className="px-1 text-muted-foreground/40">...</span>
              ) : (
                <Button
                  key={p}
                  variant={p === page ? "default" : "outline"}
                  size="icon"
                  className={cn(
                    "h-7 w-7 text-xs",
                    p === page && "bg-primary text-primary-foreground"
                  )}
                  onClick={() => onPage(p)}
                >
                  {p}
                </Button>
              )
            )}

            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() => onPage(page + 1)}
              disabled={page >= totalPages}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() => onPage(totalPages)}
              disabled={page >= totalPages}
            >
              <ChevronsRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
