'use client';

import * as React from 'react';
import { CalendarIcon, CalendarX } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { actionAtualizarExpedientePayload } from '../actions';

interface ExpedientePrazoPopoverProps {
  expedienteId: number;
  dataPrazoLegalParte: string | null | undefined;
  onSuccess?: () => void;
  children: React.ReactNode;
  align?: 'start' | 'center' | 'end';
  allowClear?: boolean;
}

function toDate(iso: string | null | undefined): Date | undefined {
  if (!iso) return undefined;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

export function ExpedientePrazoPopover({
  expedienteId,
  dataPrazoLegalParte,
  onSuccess,
  children,
  align = 'start',
  allowClear = false,
}: ExpedientePrazoPopoverProps) {
  const [open, setOpen] = React.useState(false);
  const [isPending, setIsPending] = React.useState(false);
  const [selected, setSelected] = React.useState<Date | undefined>(() =>
    toDate(dataPrazoLegalParte),
  );

  React.useEffect(() => {
    setSelected(toDate(dataPrazoLegalParte));
  }, [dataPrazoLegalParte, open]);

  const persist = React.useCallback(
    async (iso: string | null) => {
      const currentIso = dataPrazoLegalParte ?? null;
      if (iso === currentIso) {
        setOpen(false);
        return;
      }

      setIsPending(true);

      const result = await actionAtualizarExpedientePayload(expedienteId, {
        dataPrazoLegalParte: iso ?? undefined,
      });

      if (result.success) {
        toast.success('Prazo atualizado');
        onSuccess?.();
      } else {
        toast.error(result.message || 'Erro ao atualizar prazo');
      }
      setIsPending(false);
      setOpen(false);
    },
    [expedienteId, dataPrazoLegalParte, onSuccess],
  );

  const handleSelect = React.useCallback(
    (date: Date | undefined) => {
      setSelected(date);
      if (date) void persist(date.toISOString());
    },
    [persist],
  );

  const handleClear = React.useCallback(() => {
    setSelected(undefined);
    void persist(null);
  }, [persist]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          className={cn(
            /* design-system-escape: gap-1.5 gap sem token DS; px-1.5 padding direcional sem Inset equiv.; py-0.5 padding direcional sem Inset equiv.; -mx-1.5 sem equivalente DS; -my-0.5 sem equivalente DS */ 'inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 -mx-1.5 -my-0.5',
            'transition-colors hover:bg-muted/50 cursor-pointer',
            'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
            isPending && 'opacity-60 pointer-events-none',
          )}
        >
          {children}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className={cn(/* design-system-escape: p-0 → usar <Inset> */ "w-auto p-0 rounded-2xl glass-dropdown overflow-hidden")}
        align={align}
        side="bottom"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <div className={cn(/* design-system-escape: px-3 padding direcional sem Inset equiv.; pt-3 padding direcional sem Inset equiv.; pb-1.5 padding direcional sem Inset equiv. */ "px-3 pt-3 pb-1.5")}>
          <p className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading>; tracking-wider sem token DS */ "text-[10px] font-medium text-muted-foreground/40 uppercase tracking-wider")}>
            Prazo legal
          </p>
        </div>
        <Calendar
          mode="single"
          selected={selected}
          onSelect={handleSelect}
          initialFocus
        />
        {allowClear && dataPrazoLegalParte && (
          <div className={cn(/* design-system-escape: p-2 → usar <Inset> */ "border-t border-border/30 p-2")}>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              disabled={isPending}
              className="w-full justify-start text-muted-foreground"
            >
              <CalendarX className="size-3.5 mr-2" />
              Remover prazo
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

export function PrazoTriggerContent({
  dataPrazoLegalParte,
  size = 'sm',
  vencido = false,
}: {
  dataPrazoLegalParte: string | null | undefined;
  size?: 'sm' | 'md';
  vencido?: boolean;
}) {
  const label = dataPrazoLegalParte
    ? new Date(dataPrazoLegalParte).toLocaleDateString('pt-BR')
    : null;

  return (
    <>
      <CalendarIcon className={cn(
        'shrink-0',
        size === 'sm' ? 'size-3' : 'size-3.5',
        vencido ? 'text-destructive/70' : 'text-muted-foreground/50',
      )} />
      {label ? (
        <span className={cn(
          'tabular-nums',
          size === 'sm' ? /* design-system-escape: font-medium → className de <Text>/<Heading> */ 'text-[11px] font-medium' : /* design-system-escape: text-sm → migrar para <Text variant="body-sm">; font-medium → className de <Text>/<Heading> */ 'text-sm font-medium',
          vencido && /* design-system-escape: font-semibold → className de <Text>/<Heading> */ 'text-destructive font-semibold',
        )}>
          {label}
        </span>
      ) : (
        <span className={cn(
          'italic text-muted-foreground/50',
          size === 'sm' ? 'text-[11px]' : /* design-system-escape: text-sm → migrar para <Text variant="body-sm"> */ 'text-sm',
        )}>
          Sem prazo
        </span>
      )}
    </>
  );
}
