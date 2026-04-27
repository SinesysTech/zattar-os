'use client';

import * as React from 'react';
import { Check, Tag, TagIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { actionAtualizarExpedientePayload } from '../actions';

interface TipoExpedienteOption {
  id: number;
  tipoExpediente?: string;
  tipo_expediente?: string;
}

interface ExpedienteTipoPopoverProps {
  expedienteId: number;
  tipoExpedienteId: number | null | undefined;
  tiposExpedientes: TipoExpedienteOption[];
  onSuccess?: () => void;
  children: React.ReactNode;
  align?: 'start' | 'center' | 'end';
}

function getTipoLabel(t: TipoExpedienteOption): string {
  return t.tipoExpediente || t.tipo_expediente || `Tipo ${t.id}`;
}

export function ExpedienteTipoPopover({
  expedienteId,
  tipoExpedienteId,
  tiposExpedientes,
  onSuccess,
  children,
  align = 'start',
}: ExpedienteTipoPopoverProps) {
  const [open, setOpen] = React.useState(false);
  const [isPending, setIsPending] = React.useState(false);

  const handleSelect = React.useCallback(
    async (tipoId: number | null) => {
      if (tipoId === (tipoExpedienteId ?? null)) {
        setOpen(false);
        return;
      }

      setIsPending(true);
      setOpen(false);

      const result = await actionAtualizarExpedientePayload(expedienteId, {
        tipoExpedienteId: tipoId,
      });

      if (result.success) {
        toast.success('Tipo atualizado');
        onSuccess?.();
      } else {
        toast.error(result.message || 'Erro ao atualizar tipo');
      }
      setIsPending(false);
    },
    [expedienteId, tipoExpedienteId, onSuccess],
  );

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
        className={cn(/* design-system-escape: p-0 → usar <Inset> */ "w-72 p-0 rounded-2xl glass-dropdown overflow-hidden")}
        align={align}
        side="bottom"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <Command className="bg-transparent">
          <div className={cn(/* design-system-escape: px-3 padding direcional sem Inset equiv.; pt-3 padding direcional sem Inset equiv.; pb-1.5 padding direcional sem Inset equiv. */ "px-3 pt-3 pb-1.5")}>
            <p className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading>; tracking-wider sem token DS */ "text-[10px] font-medium text-muted-foreground/40 uppercase tracking-wider mb-2")}>
              Tipo de expediente
            </p>
            <CommandInput
              placeholder="Buscar tipo..."
              className={cn(/* design-system-escape: text-xs → migrar para <Text variant="caption"> */ "h-8 text-xs rounded-lg")}
            />
          </div>
          <CommandList className={cn(/* design-system-escape: px-1.5 padding direcional sem Inset equiv.; pb-1.5 padding direcional sem Inset equiv. */ "max-h-64 px-1.5 pb-1.5")}>
            <CommandEmpty>
              <div className={cn(/* design-system-escape: gap-1 gap sem token DS; py-3 padding direcional sem Inset equiv. */ "flex flex-col items-center gap-1 py-3")}>
                <TagIcon className="size-4 text-muted-foreground/30" />
                <span className="text-[11px] text-muted-foreground/40">Nenhum tipo encontrado</span>
              </div>
            </CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="sem-tipo"
                onSelect={() => handleSelect(null)}
                className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight">; text-xs → migrar para <Text variant="caption">; px-2 padding direcional sem Inset equiv.; py-1.5 padding direcional sem Inset equiv. */ "gap-2 rounded-lg text-xs px-2 py-1.5")}
              >
                <Tag className="size-3.5 text-muted-foreground/40" />
                <span className="italic text-muted-foreground/60">Sem tipo</span>
                {!tipoExpedienteId && (
                  <Check className="size-3 ml-auto text-primary" />
                )}
              </CommandItem>
              {tiposExpedientes.map((tipo) => (
                <CommandItem
                  key={tipo.id}
                  value={getTipoLabel(tipo)}
                  onSelect={() => handleSelect(tipo.id)}
                  className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight">; text-xs → migrar para <Text variant="caption">; px-2 padding direcional sem Inset equiv.; py-1.5 padding direcional sem Inset equiv. */ "gap-2 rounded-lg text-xs px-2 py-1.5")}
                >
                  <Tag className="size-3.5 text-muted-foreground/40" />
                  <span>{getTipoLabel(tipo)}</span>
                  {tipoExpedienteId === tipo.id && (
                    <Check className="size-3 ml-auto text-primary shrink-0" />
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function TipoTriggerContent({
  tipoExpedienteId,
  tiposExpedientes,
  size = 'sm',
  showIcon = true,
}: {
  tipoExpedienteId: number | null | undefined;
  tiposExpedientes: TipoExpedienteOption[];
  size?: 'sm' | 'md';
  showIcon?: boolean;
}) {
  const tipo = tipoExpedienteId
    ? tiposExpedientes.find((t) => t.id === tipoExpedienteId)
    : null;
  const nome = tipo ? getTipoLabel(tipo) : null;

  if (nome) {
    return (
      <>
        {showIcon && (
          <Tag className={cn(
            'shrink-0 text-muted-foreground/50',
            size === 'sm' ? 'size-3' : 'size-3.5',
          )} />
        )}
        <span className={cn(
          'truncate',
          size === 'sm' ? /* design-system-escape: font-medium → className de <Text>/<Heading> */ 'text-[11px] font-medium text-foreground' : /* design-system-escape: text-sm → migrar para <Text variant="body-sm">; font-medium → className de <Text>/<Heading> */ 'text-sm font-medium text-foreground',
        )}>
          {nome}
        </span>
      </>
    );
  }

  return (
    <>
      {showIcon && (
        <Tag className={cn(
          'shrink-0 text-muted-foreground/30',
          size === 'sm' ? 'size-3' : 'size-3.5',
        )} />
      )}
      <span className={cn(
        'italic',
        size === 'sm' ? 'text-[11px] text-muted-foreground/50' : /* design-system-escape: text-sm → migrar para <Text variant="body-sm"> */ 'text-sm text-muted-foreground/50',
      )}>
        Sem tipo
      </span>
    </>
  );
}
