'use client';

import * as React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useIsClient } from '@/app/_lib/hooks/use-is-client';

interface ClientOnlyTabsProps {
  defaultValue?: string;
  value?: string;
  className?: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onValueChange?: (value: string) => void;
}

/**
 * Wrapper para Tabs que renderiza apenas no cliente para evitar
 * hydration mismatch com React 19 + Radix UI.
 */
export function ClientOnlyTabs({
  defaultValue,
  value,
  className,
  children,
  fallback,
  onValueChange
}: ClientOnlyTabsProps) {
  const isClient = useIsClient();

  if (!isClient) {
    return fallback || (
      <div className="space-y-4">
        <div className="flex gap-2">
          <div className="h-9 w-32 animate-pulse bg-muted rounded-lg" />
          <div className="h-9 w-32 animate-pulse bg-muted rounded-lg" />
          <div className="h-9 w-32 animate-pulse bg-muted rounded-lg" />
        </div>
        <div className="h-64 w-full animate-pulse bg-muted rounded-lg" />
      </div>
    );
  }

  return (
    <Tabs 
      {...(value !== undefined ? { value } : { defaultValue })}
      className={className} 
      onValueChange={onValueChange}
    >
      {children}
    </Tabs>
  );
}

// Re-exportar outros componentes Tabs
export { TabsContent, TabsList, TabsTrigger };
