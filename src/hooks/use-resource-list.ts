"use client";
import * as React from "react";
import type { Paginated } from "@/types";

type Fetcher<T> = (params: { page: number; limit: number; search: string }) => Promise<Paginated<T>>;

export function useResourceList<T>(fetcher: Fetcher<T>, limit = 10) {
  const [rows, setRows] = React.useState<T[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState("");
  const [total, setTotal] = React.useState(0);
  const [totalPages, setTotalPages] = React.useState(1);
  const fetcherRef = React.useRef(fetcher);
  fetcherRef.current = fetcher;

  const load = React.useCallback(async (p: number, s: string) => {
    setLoading(true);
    try {
      const data = await fetcherRef.current({ page: p, limit, search: s });
      setRows(data.items);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  React.useEffect(() => {
    const t = setTimeout(() => load(page, search), search ? 350 : 0);
    return () => clearTimeout(t);
  }, [page, search, load]);

  const onSearch = (v: string) => { setSearch(v); setPage(1); };
  const refresh = () => load(page, search);

  return { rows, loading, page, setPage, search, onSearch, total, totalPages, refresh };
}
