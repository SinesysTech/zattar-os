'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TimelineSidebarItem } from '../timeline/timeline-sidebar-item';
import type { TimelineItemUnificado } from '../timeline/types';

interface TimelineMonthGroupProps {
  label: string;
  items: TimelineItemUnificado[];
  selectedItemId: number | null;
  onSelectItem: (item: TimelineItemUnificado) => void;
  defaultExpanded?: boolean;
  isFuture?: boolean;
}

export function TimelineMonthGroup({
  label,
  items,
  selectedItemId,
  onSelectItem,
  defaultExpanded = true,
  isFuture = false,
}: TimelineMonthGroupProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  if (items.length === 0) return null;

  return (
    <div role="group" aria-label={`Mês: ${label}`}>
      <button
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
        className="sticky top-0 z-10 flex items-center gap-2 w-full px-4 py-1.5 backdrop-blur-sm bg-background/80 cursor-pointer group"
      >
        <div className="h-px flex-1 bg-border/10" />
        <span className="text-[9px] uppercase tracking-wider text-muted-foreground/40 font-semibold whitespace-nowrap shrink-0">
          {label}
        </span>
        <ChevronDown
          className={cn(
            'size-3 text-muted-foreground/30 transition-transform duration-200',
            !isExpanded && '-rotate-90'
          )}
        />
        <div className="h-px flex-1 bg-border/10" />
      </button>

      {isExpanded && (
        <div className={cn(isFuture && 'opacity-70')}>
          {items.map((item, index) => (
            <TimelineSidebarItem
              key={item.id}
              item={item}
              isSelected={item.id === selectedItemId}
              isFirst={index === 0}
              isLast={index === items.length - 1}
              onSelect={onSelectItem}
            />
          ))}
        </div>
      )}
    </div>
  );
}
