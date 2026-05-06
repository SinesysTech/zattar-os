'use client';

import { forwardRef } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Text } from '@/components/ui/typography';
import { cn } from '@/lib/utils';

interface TimelineNowMarkerProps {
  className?: string;
}

export const TimelineNowMarker = forwardRef<HTMLDivElement, TimelineNowMarkerProps>(
  function TimelineNowMarker({ className }, ref) {
    const hoje = format(new Date(), "dd MMM yyyy", { locale: ptBR });

    return (
      <div
        ref={ref}
        role="separator"
        aria-label="Momento atual"
        className={cn(/* design-system-escape: py-3 padding direcional sem Inset equiv.; px-2 padding direcional sem Inset equiv. */ 'py-3 px-2', className)}
      >
        <div className={cn("flex items-center inline-medium")}>
          <div className="h-px flex-1 bg-linear-to-r from-transparent via-primary/25 to-primary/25" />
          <div className={cn(/* design-system-escape: px-3 padding direcional sem Inset equiv.; py-1.5 padding direcional sem Inset equiv. */ "flex items-center inline-tight rounded-lg bg-primary/6 border border-primary/15 px-3 py-1.5")}>
            <div className="size-2 rounded-full bg-primary animate-pulse" />
            <Text variant="overline" as="span" className="text-primary/80">
              Hoje — {hoje}
            </Text>
          </div>
          <div className="h-px flex-1 bg-linear-to-l from-transparent via-primary/25 to-primary/25" />
        </div>
      </div>
    );
  }
);
