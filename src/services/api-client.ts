import type { ApiResponse, Paginated } from "@/types";

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const json = (await res.json()) as ApiResponse<T>;
  if (!res.ok || !json.success) {
    throw new Error(json.error || "Request failed");
  }
  return json.data as T;
}

export type ListParams = {
  page?: number;
  limit?: number;
  search?: string;
  sortField?: string;
  sortDir?: "asc" | "desc";
  /** Arbitrary equality filters, e.g. { status, classId, sectionId }. Empty values are ignored. */
  filters?: Record<string, string | undefined>;
};

function qs(params?: ListParams) {
  const p = new URLSearchParams();
  if (params?.page) p.set("page", String(params.page));
  if (params?.limit) p.set("limit", String(params.limit));
  if (params?.search) p.set("search", params.search);
  if (params?.sortField) p.set("sortField", params.sortField);
  if (params?.sortDir) p.set("sortDir", params.sortDir);
  if (params?.filters) {
    for (const [key, value] of Object.entries(params.filters)) {
      if (value) p.set(key, value);
    }
  }
  const s = p.toString();
  return s ? `?${s}` : "";
}

export function createResource<TList, TInput, TOne = TList>(resource: string) {
  const base = `/api/${resource}`;
  return {
    list: (params?: ListParams) => request<Paginated<TList>>(`${base}${qs(params)}`),
    get: (id: string) => request<TOne>(`${base}/${id}`),
    create: (data: TInput) => request<TOne>(base, { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: Partial<TInput>) =>
      request<TOne>(`${base}/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    remove: (id: string) => request<{ id: string }>(`${base}/${id}`, { method: "DELETE" }),
  };
}

export { request };
