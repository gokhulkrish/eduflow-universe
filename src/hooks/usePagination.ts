import { useMemo, useState, useCallback } from "react";

export function usePagination<T>({ data, pageSize: initialPageSize = 10 }: { data: T[]; pageSize?: number }) {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSizeState] = useState(initialPageSize);

  const setPageSize = useCallback((size: number) => {
    setPageSizeState(size);
    setPage(0);
  }, []);

  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);

  const pageData = useMemo(
    () => data.slice(safePage * pageSize, (safePage + 1) * pageSize),
    [data, safePage, pageSize]
  );

  return {
    page: safePage,
    totalPages,
    pageData,
    total: data.length,
    setPage: (p: number) => setPage(Math.max(0, Math.min(p, totalPages - 1))),
    next: () => setPage((p) => Math.min(p + 1, totalPages - 1)),
    prev: () => setPage((p) => Math.max(p - 1, 0)),
    from: safePage * pageSize + 1,
    to: Math.min((safePage + 1) * pageSize, data.length),
    pageSize,
    setPageSize,
  };
}
