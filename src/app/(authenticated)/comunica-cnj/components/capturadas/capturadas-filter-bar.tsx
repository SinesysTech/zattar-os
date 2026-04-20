'use client';

import { ChevronDown, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/typography';
import { cn } from '@/lib/utils';
import type {
  GazetteFilters,
  MeioComunicacao,
} from '@/app/(authenticated)/comunica-cnj/domain';

const POPOVER_CLASSES = 'rounded-2xl glass-dropdown overflow-hidden p-0';

const MEIO_OPTIONS: { value: MeioComunicacao; label: string }[] = [
  { value: 'D', label: 'Diário Eletrônico' },
  { value: 'E', label: 'Edital' },
];

interface CapturadasFilterBarProps {
  filtros: GazetteFilters;
  onChange: (partial: Partial<GazetteFilters>) => void;
  tribunais: string[];
  tiposComunicacao: string[];
}

function FilterChipTrigger({
  label,
  value,
  onClear,
  disabled = false,
}: {
  label: string;
  value?: string;
  onClear?: () => void;
  disabled?: boolean;
}) {
  const hasValue = Boolean(value);
  return (
    <button
      type="button"
      disabled={disabled}
      className={cn(
        'flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors',
        hasValue
          ? 'border-primary/20 bg-primary/5 text-primary'
          : 'border-border/40 text-muted-foreground hover:bg-muted/30',
        disabled && 'cursor-not-allowed opacity-50',
      )}
    >
      <span>{label}</span>
      {hasValue && (
        <>
          <span className="opacity-60">·</span>
          <span className="max-w-24 truncate">{value}</span>
          {onClear && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  e.stopPropagation();
                  onClear();
                }
              }}
              className="rounded p-0.5 hover:bg-primary/15"
              aria-label={`Limpar ${label}`}
            >
              <X className="size-2.5" aria-hidden />
            </span>
          )}
        </>
      )}
      <ChevronDown className="size-3 opacity-50" aria-hidden />
    </button>
  );
}

/**
 * Filter bar da página de Capturadas, no padrão AudienciasFilterBar.
 * Popovers + chips inline, todos gravando no GazetteFilters.
 */
export function CapturadasFilterBar({
  filtros,
  onChange,
  tribunais,
  tiposComunicacao,
}: CapturadasFilterBarProps) {
  const fonteLabel =
    filtros.fonte && filtros.fonte.length > 0
      ? filtros.fonte.length === 1
        ? filtros.fonte[0]
        : `${filtros.fonte.length} tribunais`
      : undefined;

  const tipoLabel =
    filtros.tipo && filtros.tipo.length > 0
      ? filtros.tipo.length === 1
        ? filtros.tipo[0]
        : `${filtros.tipo.length} tipos`
      : undefined;

  const meioLabel = MEIO_OPTIONS.find((m) => m.value === filtros.meio)?.label;

  const periodoLabel =
    filtros.periodo?.inicio || filtros.periodo?.fim
      ? `${filtros.periodo?.inicio ?? '...'} → ${filtros.periodo?.fim ?? '...'}`
      : undefined;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Fonte (tribunais) */}
      <Popover>
        <PopoverTrigger asChild>
          <span>
            <FilterChipTrigger
              label="Fonte"
              value={fonteLabel}
              onClear={
                fonteLabel ? () => onChange({ fonte: undefined }) : undefined
              }
            />
          </span>
        </PopoverTrigger>
        <PopoverContent className={cn(POPOVER_CLASSES, 'w-64')} align="start">
          <Command>
            <CommandInput placeholder="Buscar tribunal..." />
            <CommandList>
              <CommandEmpty>Nenhum tribunal encontrado.</CommandEmpty>
              <CommandGroup>
                {tribunais.map((sigla) => {
                  const active = filtros.fonte?.includes(sigla) ?? false;
                  return (
                    <CommandItem
                      key={sigla}
                      value={sigla}
                      onSelect={() => {
                        const current = filtros.fonte ?? [];
                        const next = active
                          ? current.filter((t) => t !== sigla)
                          : [...current, sigla];
                        onChange({ fonte: next.length > 0 ? next : undefined });
                      }}
                    >
                      <span className="tabular-nums">{sigla}</span>
                      {active && (
                        <span className="ml-auto size-2 rounded-full bg-primary" aria-hidden />
                      )}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Tipo */}
      <Popover>
        <PopoverTrigger asChild>
          <span>
            <FilterChipTrigger
              label="Tipo"
              value={tipoLabel}
              onClear={
                tipoLabel ? () => onChange({ tipo: undefined }) : undefined
              }
              disabled={tiposComunicacao.length === 0}
            />
          </span>
        </PopoverTrigger>
        <PopoverContent className={cn(POPOVER_CLASSES, 'w-64')} align="start">
          <Command>
            <CommandInput placeholder="Buscar tipo..." />
            <CommandList>
              <CommandEmpty>Nenhum tipo encontrado.</CommandEmpty>
              <CommandGroup>
                {tiposComunicacao.map((tipo) => {
                  const active = filtros.tipo?.includes(tipo) ?? false;
                  return (
                    <CommandItem
                      key={tipo}
                      value={tipo}
                      onSelect={() => {
                        const current = filtros.tipo ?? [];
                        const next = active
                          ? current.filter((t) => t !== tipo)
                          : [...current, tipo];
                        onChange({ tipo: next.length > 0 ? next : undefined });
                      }}
                    >
                      {tipo}
                      {active && (
                        <span className="ml-auto size-2 rounded-full bg-primary" aria-hidden />
                      )}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Meio */}
      <Popover>
        <PopoverTrigger asChild>
          <span>
            <FilterChipTrigger
              label="Meio"
              value={meioLabel}
              onClear={
                meioLabel ? () => onChange({ meio: null }) : undefined
              }
            />
          </span>
        </PopoverTrigger>
        <PopoverContent className={cn(POPOVER_CLASSES, 'w-52 p-2')} align="start">
          <div className="flex flex-col gap-1">
            {MEIO_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() =>
                  onChange({
                    meio: filtros.meio === opt.value ? null : opt.value,
                  })
                }
                className={cn(
                  'flex items-center justify-between rounded-md px-3 py-2 text-sm transition-colors',
                  filtros.meio === opt.value
                    ? 'bg-primary/10 text-primary'
                    : 'text-foreground hover:bg-muted/40',
                )}
              >
                {opt.label}
                {filtros.meio === opt.value && (
                  <span className="size-2 rounded-full bg-primary" aria-hidden />
                )}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {/* Período */}
      <Popover>
        <PopoverTrigger asChild>
          <span>
            <FilterChipTrigger
              label="Período"
              value={periodoLabel}
              onClear={
                periodoLabel
                  ? () => onChange({ periodo: undefined })
                  : undefined
              }
            />
          </span>
        </PopoverTrigger>
        <PopoverContent className={cn(POPOVER_CLASSES, 'w-72 p-4')} align="start">
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="cap-data-inicio">
                <Text variant="meta-label">Data início</Text>
              </Label>
              <Input
                id="cap-data-inicio"
                type="date"
                value={filtros.periodo?.inicio ?? ''}
                onChange={(e) =>
                  onChange({
                    periodo: {
                      inicio: e.target.value,
                      fim: filtros.periodo?.fim ?? '',
                    },
                  })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cap-data-fim">
                <Text variant="meta-label">Data fim</Text>
              </Label>
              <Input
                id="cap-data-fim"
                type="date"
                value={filtros.periodo?.fim ?? ''}
                onChange={(e) =>
                  onChange({
                    periodo: {
                      inicio: filtros.periodo?.inicio ?? '',
                      fim: e.target.value,
                    },
                  })
                }
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
