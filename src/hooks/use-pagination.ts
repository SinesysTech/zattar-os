import { useState } from "react";

interface UsePaginationProps {
  initialPage?: number;
  initialPageSize?: number;
}

interface UsePaginationReturn {
  pageIndex: number;
  pageSize: number;
  setPageIndex: (pageIndex: number) => void;
  setPageSize: (pageSize: number) => void;
  pagination: {
    pageIndex: number;
    pageSize: number;
  };
}

export function usePagination({
  initialPage = 0,
  initialPageSize = 10,
}: UsePaginationProps = {}): UsePaginationReturn {
  const [pageIndex, setPageIndex] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);

  return {
    pageIndex,
    pageSize,
    setPageIndex,
    setPageSize,
    pagination: {
      pageIndex,
      pageSize,
    },
  };
}
