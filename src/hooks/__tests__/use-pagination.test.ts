import { renderHook, act } from '@testing-library/react';
import { usePagination } from '../use-pagination';

describe('usePagination', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return default initial state', () => {
    const { result } = renderHook(() => usePagination());

    expect(result.current.pageIndex).toBe(0);
    expect(result.current.pageSize).toBe(10);
    expect(result.current.pagination).toEqual({
      pageIndex: 0,
      pageSize: 10,
    });
  });

  it('should accept custom initial page', () => {
    const { result } = renderHook(() => usePagination({ initialPage: 2 }));

    expect(result.current.pageIndex).toBe(2);
    expect(result.current.pageSize).toBe(10);
  });

  it('should accept custom initial page size', () => {
    const { result } = renderHook(() => usePagination({ initialPageSize: 20 }));

    expect(result.current.pageIndex).toBe(0);
    expect(result.current.pageSize).toBe(20);
  });

  it('should accept both custom initial page and page size', () => {
    const { result } = renderHook(() =>
      usePagination({ initialPage: 3, initialPageSize: 50 })
    );

    expect(result.current.pageIndex).toBe(3);
    expect(result.current.pageSize).toBe(50);
  });

  it('should update page index', () => {
    const { result } = renderHook(() => usePagination());

    expect(result.current.pageIndex).toBe(0);

    act(() => {
      result.current.setPageIndex(5);
    });

    expect(result.current.pageIndex).toBe(5);
  });

  it('should update page size', () => {
    const { result } = renderHook(() => usePagination());

    expect(result.current.pageSize).toBe(10);

    act(() => {
      result.current.setPageSize(50);
    });

    expect(result.current.pageSize).toBe(50);
  });

  it('should keep pagination object synchronized with state', () => {
    const { result } = renderHook(() => usePagination());

    expect(result.current.pagination).toEqual({
      pageIndex: 0,
      pageSize: 10,
    });

    act(() => {
      result.current.setPageIndex(3);
    });

    expect(result.current.pagination).toEqual({
      pageIndex: 3,
      pageSize: 10,
    });

    act(() => {
      result.current.setPageSize(25);
    });

    expect(result.current.pagination).toEqual({
      pageIndex: 3,
      pageSize: 25,
    });
  });

  it('should handle multiple state updates', () => {
    const { result } = renderHook(() => usePagination());

    act(() => {
      result.current.setPageIndex(1);
    });
    expect(result.current.pageIndex).toBe(1);

    act(() => {
      result.current.setPageIndex(2);
    });
    expect(result.current.pageIndex).toBe(2);

    act(() => {
      result.current.setPageSize(20);
    });
    expect(result.current.pageSize).toBe(20);

    act(() => {
      result.current.setPageSize(30);
    });
    expect(result.current.pageSize).toBe(30);

    expect(result.current.pagination).toEqual({
      pageIndex: 2,
      pageSize: 30,
    });
  });

  it('should handle edge case of page index 0', () => {
    const { result } = renderHook(() => usePagination({ initialPage: 5 }));

    expect(result.current.pageIndex).toBe(5);

    act(() => {
      result.current.setPageIndex(0);
    });

    expect(result.current.pageIndex).toBe(0);
  });

  it('should handle large page numbers', () => {
    const { result } = renderHook(() => usePagination());

    act(() => {
      result.current.setPageIndex(9999);
    });

    expect(result.current.pageIndex).toBe(9999);
  });

  it('should handle large page sizes', () => {
    const { result } = renderHook(() => usePagination());

    act(() => {
      result.current.setPageSize(1000);
    });

    expect(result.current.pageSize).toBe(1000);
  });
});
