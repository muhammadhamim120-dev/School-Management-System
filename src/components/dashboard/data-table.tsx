"use client";
import * as React from "react";
import { Search, ChevronLeft, ChevronRight, Inbox, ArrowUp, ArrowDown, ChevronsUpDown, AlertCircle, X } from "lucide-react";
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
  /** If set, the header becomes a sort toggle using this backend field name. */
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
  /** Sorting (optional). */
  sort?: SortState | null;
  onToggleSort?: (field: string) => void;
  /** Filter controls rendered in the toolbar (optional). */
  filters?: React.ReactNode;
  activeFilterCount?: number;
  onClearFilters?: () => void;
  onRetry?: () => void;
};

export function DataTable<T>({
  columns, rows, loading, error, total, page, totalPages, search, onSearch, onPage,
  searchPlaceholder = "Search...", rowKey, onRowClick, sort, onToggleSort,
  filters, activeFilterCount = 0, onClearFilters, onRetry,
}: Props<T>) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-soft">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 border-b border-border p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="h-9 border-transparent bg-muted/60 pl-9 shadow-none focus-visible:bg-card focus-visible:border-ring"
            />
          </div>
          {filters}
          {activeFilterCount > 0 && onClearFilters && (
            <Button variant="ghost" size="sm" onClick={onClearFilters} className="text-muted-foreground">
              <X className="h-3.5 w-3.5" /> Clear
            </Button>
          )}
        </div>
        <span className="shrink-0 text-sm text-muted-foreground tabular-nums">
          {total.toLocaleString()} record{total !== 1 ? "s" : ""}
        </span>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {columns.map((c) => {
              const sortable = !!c.sortField && !!onToggleSort;
              const active = sort?.field === c.sortField;
              return (
                <TableHead key={c.key} className={c.className}>
                  {sortable ? (
                    <button
                      type="button"
                      onClick={() => onToggleSort!(c.sortField!)}
                      className="inline-flex items-center gap-1 uppercase tracking-wider transition-colors hover:text-foreground"
                    >
                      {c.header}
                      {active ? (
                        sort!.dir === "asc" ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronsUpDown className="h-3.5 w-3.5 opacity-40" />
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
                  {onRetry && <Button variant="outline" size="sm" onClick={onRetry}>Try again</Button>}
                </div>
              </TableCell>
            </TableRow>
          ) : loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <TableRow key={i} className="hover:bg-transparent">
                {columns.map((c) => (
                  <TableCell key={c.key}><Skeleton className="h-5 w-3/4" /></TableCell>
                ))}
              </TableRow>
            ))
          ) : rows.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={columns.length} className="h-40 text-center">
                <div className="flex flex-col items-center gap-3 text-muted-foreground">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                    <Inbox className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">No records found</p>
                    <p className="text-sm">Try adjusting your search or filters.</p>
                  </div>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow
                key={rowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(onRowClick && "cursor-pointer")}
              >
                {columns.map((c) => (
                  <TableCell key={c.key} className={c.className}>
                    {c.render ? c.render(row) : String((row as Record<string, unknown>)[c.key] ?? "—")}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Pagination */}
      <div className="flex items-center justify-between gap-4 border-t border-border p-3">
        <span className="text-sm text-muted-foreground tabular-nums">
          Page {page} of {Math.max(1, totalPages)}
        </span>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => onPage(page - 1)} disabled={page <= 1}>
            <ChevronLeft className="h-4 w-4" /> Previous
          </Button>
          <Button variant="outline" size="sm" onClick={() => onPage(page + 1)} disabled={page >= totalPages}>
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
