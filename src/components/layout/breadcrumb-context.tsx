'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

interface BreadcrumbOverride {
  path: string;
  label: string;
}

interface BreadcrumbContextType {
  overrides: BreadcrumbOverride[];
  setOverride: (path: string, label: string) => void;
  clearOverride: (path: string) => void;
}

const BreadcrumbContext = createContext<BreadcrumbContextType>({
  overrides: [],
  setOverride: () => {},
  clearOverride: () => {},
});

export function BreadcrumbProvider({ children }: { children: ReactNode }) {
  const [overrides, setOverrides] = useState<BreadcrumbOverride[]>([]);

  const setOverride = useCallback((path: string, label: string) => {
    setOverrides((prev) => {
      const filtered = prev.filter((o) => o.path !== path);
      return [...filtered, { path, label }];
    });
  }, []);

  const clearOverride = useCallback((path: string) => {
    setOverrides((prev) => prev.filter((o) => o.path !== path));
  }, []);

  return (
    <BreadcrumbContext.Provider value={{ overrides, setOverride, clearOverride }}>
      {children}
    </BreadcrumbContext.Provider>
  );
}

export function useBreadcrumb() {
  return useContext(BreadcrumbContext);
}

export function useBreadcrumbOverride(path: string, label: string | undefined) {
  const { setOverride, clearOverride } = useBreadcrumb();

  useEffect(() => {
    if (label) {
      setOverride(path, label);
    }
    return () => clearOverride(path);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, label]);
}
