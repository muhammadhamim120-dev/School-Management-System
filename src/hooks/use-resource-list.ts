"use client";
import * as React from "react";
import type { Paginated } from "@/types";
import type { ListParams } from "@/services/api-client";

type Fetcher<T> = (params: ListParams) => Promise<Paginated<T>>;

export type SortState = { field: string; dir: "asc" | "desc" };

export function useResourceList<T>(fetcher: Fetcher<T>, limit = 10) {
  const [rows, setRows] = React.useState<T[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState("");
  const [filters, setFiltersState] = React.useState<Record<string, string | undefined>>({});
  const [sort, setSortState] = React.useState<SortState | null>(null);
  const [total, setTotal] = React.useState(0);
  const [totalPages, setTotalPages] = React.useState(1);

  const fetcherRef = React.useRef(fetcher);
  fetcherRef.current = fetcher;

  const load = React.useCallback(
    async (p: number, s: string, f: Record<string, string | undefined>, srt: SortState | null) => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetcherRef.current({
          page: p,
          limit,
          search: s,
          filters: f,
          sortField: srt?.field,
          sortDir: srt?.dir,
        });
        setRows(data.items);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      } catch (e) {
        setRows([]);
        setTotal(0);
        setTotalPages(1);
        setError((e as Error).message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    },
    [limit]
  );

  // Debounce only search-driven changes; filters/sort/page apply immediately.
  React.useEffect(() => {
    const t = setTimeout(() => load(page, search, filters, sort), search ? 350 : 0);
    return () => clearTimeout(t);
  }, [page, search, filters, sort, load]);

  const onSearch = (v: string) => {
    setSearch(v);
    setPage(1);
  };

  const setFilter = (key: string, value: string | undefined) => {
    setFiltersState((prev) => ({ ...prev, [key]: value || undefined }));
    setPage(1);
  };

  const clearFilters = () => {
    setFiltersState({});
    setSearch("");
    setPage(1);
  };

  const toggleSort = (field: string) => {
    setSortState((prev) => {
      if (prev?.field !== field) return { field, dir: "asc" };
      if (prev.dir === "asc") return { field, dir: "desc" };
      return null; // third click clears sort
    });
    setPage(1);
  };

  const refresh = () => load(page, search, filters, sort);

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  return {
    rows,
    loading,
    error,
    page,
    setPage,
    search,
    onSearch,
    filters,
    setFilter,
    clearFilters,
    activeFilterCount,
    sort,
    toggleSort,
    total,
    totalPages,
    refresh,
  };
}
