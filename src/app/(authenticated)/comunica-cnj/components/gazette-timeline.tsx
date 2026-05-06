'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Text } from '@/components/ui/typography';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface TimelineItem {
  id: string | number;
  badge: ReactNode;
  date: string;
  text: string;
  subtext?: string;
  isCurrent?: boolean;
}

export interface GazetteTimelineProps {
  items: TimelineItem[];
}

// ─── GazetteTimeline ────────────────────────────────────────────────────────

export function GazetteTimeline({ items }: GazetteTimelineProps) {
  if (items.length === 0) return null;

  return (
    <div className={cn(/* design-system-escape: gap-3 gap sem token DS */ "relative flex flex-col gap-3")}>
      {/* Vertical line */}
      <div
        className="absolute bottom-2 left-1 top-2 w-px bg-border/50"
        aria-hidden
      />

      {items.map((item) => (
        <div key={item.id} className={cn(/* design-system-escape: gap-3 gap sem token DS; pl-5 padding direcional sem Inset equiv. */ "relative flex items-start gap-3 pl-5")}>
          {/* Dot */}
          <div
            className={cn(
              'absolute left-0 top-2.5 z-10 size-2 rounded-full',
              item.isCurrent
                ? 'bg-primary shadow-[0_0_6px_var(--primary)]'
                : 'border-2 border-muted-foreground/30 bg-transparent',
            )}
            aria-hidden
          />

          {/* Card */}
          <div
            className={cn(
              /* design-system-escape: p-2 → usar <Inset> */ 'flex-1 rounded-lg p-2',
              item.isCurrent
                ? 'border border-primary/15 bg-primary/5'
                : 'border border-border/30 bg-muted/20',
            )}
          >
            {/* Header: badge + date */}
            <div className={cn("mb-0.5 flex items-center justify-between inline-tight")}>
              <div className="shrink-0">{item.badge}</div>
              <Text variant="micro-caption" className="whitespace-nowrap">
                {item.date}
              </Text>
            </div>

            {/* Text */}
            <Text variant="caption" className="line-clamp-2">
              {item.text}
            </Text>

            {/* Subtext (deadline warning) */}
            {item.subtext && (
              <p className="mt-0.5 text-[10px] text-destructive/80">{item.subtext}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
