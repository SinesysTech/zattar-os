'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Text } from '@/components/ui/typography';
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
        className={cn(/* design-system-escape: px-4 padding direcional sem Inset equiv.; py-1.5 padding direcional sem Inset equiv. */ "sticky top-0 z-10 flex items-center inline-tight w-full px-4 py-1.5 backdrop-blur-sm bg-background/80 cursor-pointer group")}
      >
        <div className="h-px flex-1 bg-border/10" />
        <Text variant="overline" as="span" className="text-muted-foreground/65 whitespace-nowrap shrink-0">
          {label}
        </Text>
        <ChevronDown
          className={cn(
            'size-3 text-muted-foreground/55 transition-transform duration-200',
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
