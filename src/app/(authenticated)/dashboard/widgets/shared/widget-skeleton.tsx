'use client';

import { cn } from '@/lib/utils';
import { GlassPanel } from '@/components/shared/glass-panel';

interface WidgetSkeletonProps {
  size?: 'sm' | 'md' | 'lg' | 'full';
}

export function WidgetSkeleton({ size = 'sm' }: WidgetSkeletonProps) {
  const heightClass = size === 'full' ? 'h-24' : size === 'md' || size === 'lg' ? 'h-52' : 'h-44';

  return (
    <GlassPanel depth={1} className={`p-5 ${heightClass}`}>
      <div className={cn(/* design-system-escape: gap-3 gap sem token DS */ "animate-pulse flex flex-col gap-3 h-full")}>
        <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "flex items-center gap-2")}>
          <div className="size-4 rounded bg-border/15" />
          <div className="h-3.5 w-28 rounded bg-border/15" />
        </div>
        <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "flex-1 flex flex-col gap-2 justify-center")}>
          <div className="h-3 w-full rounded bg-border/10" />
          <div className="h-3 w-3/4 rounded bg-border/10" />
          <div className="h-3 w-1/2 rounded bg-border/10" />
        </div>
      </div>
    </GlassPanel>
  );
}
