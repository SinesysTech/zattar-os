'use client';

import * as React from 'react';
import { Check, ChevronDown, X } from 'lucide-react';
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

const POPOVER_CLASSES = /* design-system-escape: p-0 → usar <Inset> */ 'rounded-2xl glass-dropdown overflow-hidden p-0';

const MEIO_OPTIONS: { value: MeioComunicacao; label: string }[] = [
  { value: 'D', label: 'Diário Eletrônico' },
  { value: 'E', label: 'Edital' },
];

export type StatusKey = 'vinculado' | 'pendente' | 'orfao' | 'prazos';
export type StatusValue = StatusKey | null;

const STATUS_OPTIONS: { value: StatusKey; label: string }[] = [
  { value: 'vinculado', label: 'Vinculados' },
  { value: 'pendente', label: 'Pendentes' },
  { value: 'orfao', label: 'Órfãos' },
  { value: 'prazos', label: 'Prazos críticos' },
];

// ─── Trigger compartilhado ───────────────────────────────────────────

function FilterDropdownTrigger({
  label,
  active,
  onClear,
  open,
  children,
}: {
  label: string;
  active: boolean;
  onClear?: () => void;
  open: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        /* design-system-escape: px-2.5 padding direcional sem Inset equiv.; py-1.5 padding direcional sem Inset equiv.; */ 'flex items-center inline-snug rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition-colors cursor-pointer',
        active
          ? 'border-primary/20 bg-primary/5 text-primary'
          : 'border-border/15 text-muted-foreground/60 hover:bg-muted/30',
        open && 'ring-1 ring-ring',
      )}
    >
      {children}
      <span>{label}</span>
      {active && onClear ? (
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
          className={cn(/* design-system-escape: p-0.5 → usar <Inset> */ "ml-0.5 rounded-full p-0.5 hover:bg-primary/10 transition-colors")}
          aria-label={`Limpar ${label}`}
        >
          <X className="size-2.5" />
        </span>
      ) : (
        <ChevronDown
          className={cn('size-3 transition-transform', open && 'rotate-180')}
        />
      )}
    </div>
  );
}

// ─── Status Filter (padrão canônico Audiências) ──────────────────────

function StatusFilter({
  selected,
  onChange,
  counts,
}: {
  selected: StatusValue;
  onChange: (v: StatusValue) => void;
  counts: {
    vinculado: number;
    pendente: number;
    orfao: number;
    prazos: number;
  };
}) {
  const [open, setOpen] = React.useState(false);
  const label =
    STATUS_OPTIONS.find((o) => o.value === selected)?.label ?? 'Status';
  const countMap: Record<StatusKey, number> = {
    vinculado: counts.vinculado,
    pendente: counts.pendente,
    orfao: counts.orfao,
    prazos: counts.prazos,
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button">
          <FilterDropdownTrigger
            label={label}
            active={!!selected}
            onClear={selected ? () => onChange(null) : undefined}
            open={open}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className={cn(POPOVER_CLASSES, 'w-48')}
        align="start"
        side="bottom"
      >
        <div className={cn(/* design-system-escape: p-2 → usar <Inset> */ "flex flex-col p-2 stack-nano")}>
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(selected === opt.value ? null : opt.value);
                setOpen(false);
              }}
              className={cn(
                'w-full flex items-center inline-tight rounded-lg px-2.5 py-2 text-caption transition-colors cursor-pointer',
                selected === opt.value
                  ? 'bg-primary/8 text-primary'
                  : 'hover:bg-muted/30 text-muted-foreground/70',
              )}
            >
              <span>{opt.label}</span>
              <span className="text-[9px] ml-auto tabular-nums opacity-50">
                {countMap[opt.value]}
              </span>
              {selected === opt.value && <Check className="size-3" />}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ─── Tribunal Filter ─────────────────────────────────────────────────

function TribunalFilter({
  selected,
  onChange,
  tribunais,
}: {
  selected: string[];
  onChange: (v: string[] | undefined) => void;
  tribunais: string[];
}) {
  const [open, setOpen] = React.useState(false);
  const label =
    selected.length === 0
      ? 'Fonte'
      : selected.length === 1
        ? selected[0]
        : `${selected.length} tribunais`;

  const handleToggle = (sigla: string) => {
    const next = selected.includes(sigla)
      ? selected.filter((t) => t !== sigla)
      : [...selected, sigla];
    onChange(next.length > 0 ? next : undefined);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button">
          <FilterDropdownTrigger
            label={label}
            active={selected.length > 0}
            onClear={selected.length > 0 ? () => onChange(undefined) : undefined}
            open={open}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className={cn(POPOVER_CLASSES, 'w-56')}
        align="start"
        side="bottom"
      >
        <Command className="bg-transparent">
          <div className={cn("px-3 pt-3 pb-1.5")}>
            <CommandInput
              placeholder="Buscar tribunal..."
              className={cn("h-8 text-caption rounded-lg")}
            />
          </div>
          <CommandList className={cn("max-h-52 px-1.5 pb-1.5")}>
            <CommandEmpty>
              <span className="text-[11px] text-muted-foreground/65">
                Não encontrado
              </span>
            </CommandEmpty>
            <CommandGroup>
              {tribunais.map((sigla) => (
                <CommandItem
                  key={sigla}
                  value={sigla}
                  onSelect={() => handleToggle(sigla)}
                  className={cn("flex inline-tight rounded-lg text-caption px-2 py-1.5")}
                >
                  <div
                    className={cn(
                      'size-3.5 rounded border flex items-center justify-center',
                      selected.includes(sigla)
                        ? 'bg-primary border-primary'
                        : 'border-border/50',
                    )}
                  >
                    {selected.includes(sigla) && (
                      <Check className="size-2.5 text-primary-foreground" />
                    )}
                  </div>
                  <span className="tabular-nums">{sigla}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// ─── Tipo Filter ─────────────────────────────────────────────────────

function TipoFilter({
  selected,
  onChange,
  tipos,
  counts,
}: {
  selected: string[];
  onChange: (v: string[] | undefined) => void;
  tipos: string[];
  counts: Map<string, number>;
}) {
  const [open, setOpen] = React.useState(false);
  const label =
    selected.length === 0
      ? 'Tipo'
      : selected.length === 1
        ? selected[0]
        : `${selected.length} tipos`;
  const disabled = tipos.length === 0;

  const handleToggle = (tipo: string) => {
    const next = selected.includes(tipo)
      ? selected.filter((t) => t !== tipo)
      : [...selected, tipo];
    onChange(next.length > 0 ? next : undefined);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" disabled={disabled}>
          <FilterDropdownTrigger
            label={label}
            active={selected.length > 0}
            onClear={selected.length > 0 ? () => onChange(undefined) : undefined}
            open={open}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className={cn(POPOVER_CLASSES, 'w-64')}
        align="start"
        side="bottom"
      >
        <Command className="bg-transparent">
          <div className={cn("px-3 pt-3 pb-1.5")}>
            <CommandInput
              placeholder="Buscar tipo..."
              className={cn("h-8 text-caption rounded-lg")}
            />
          </div>
          <CommandList className={cn("max-h-52 px-1.5 pb-1.5")}>
            <CommandEmpty>
              <span className="text-[11px] text-muted-foreground/65">
                Não encontrado
              </span>
            </CommandEmpty>
            <CommandGroup>
              {tipos.map((tipo) => (
                <CommandItem
                  key={tipo}
                  value={tipo}
                  onSelect={() => handleToggle(tipo)}
                  className={cn("flex inline-tight rounded-lg text-caption px-2 py-1.5")}
                >
                  <div
                    className={cn(
                      'size-3.5 rounded border flex items-center justify-center',
                      selected.includes(tipo)
                        ? 'bg-primary border-primary'
                        : 'border-border/50',
                    )}
                  >
                    {selected.includes(tipo) && (
                      <Check className="size-2.5 text-primary-foreground" />
                    )}
                  </div>
                  <span>{tipo}</span>
                  <span className="text-[9px] ml-auto tabular-nums opacity-50">
                    {counts.get(tipo) ?? 0}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// ─── Meio Filter ─────────────────────────────────────────────────────

function MeioFilter({
  selected,
  onChange,
}: {
  selected: MeioComunicacao | null | undefined;
  onChange: (v: MeioComunicacao | null) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const label =
    MEIO_OPTIONS.find((o) => o.value === selected)?.label ?? 'Meio';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button">
          <FilterDropdownTrigger
            label={label}
            active={!!selected}
            onClear={selected ? () => onChange(null) : undefined}
            open={open}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className={cn(POPOVER_CLASSES, 'w-52')}
        align="start"
        side="bottom"
      >
        <div className={cn(/* design-system-escape: p-2 → usar <Inset> */ "flex flex-col p-2 stack-nano")}>
          {MEIO_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(selected === opt.value ? null : opt.value);
                setOpen(false);
              }}
              className={cn(
                'w-full flex items-center inline-tight rounded-lg px-2.5 py-2 text-caption transition-colors cursor-pointer',
                selected === opt.value
                  ? 'bg-primary/8 text-primary'
                  : 'hover:bg-muted/30 text-muted-foreground/70',
              )}
            >
              <span>{opt.label}</span>
              {selected === opt.value && (
                <Check className="size-3 ml-auto" />
              )}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ─── Período Filter ──────────────────────────────────────────────────

function PeriodoFilter({
  inicio,
  fim,
  onChange,
}: {
  inicio?: string;
  fim?: string;
  onChange: (periodo: { inicio: string; fim: string } | undefined) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const hasValue = Boolean(inicio || fim);
  const label = hasValue
    ? `${inicio ?? '...'} → ${fim ?? '...'}`
    : 'Período';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button">
          <FilterDropdownTrigger
            label={label}
            active={hasValue}
            onClear={hasValue ? () => onChange(undefined) : undefined}
            open={open}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className={cn(POPOVER_CLASSES, 'w-72 inset-card-compact')}
        align="start"
        side="bottom"
      >
        <div className={cn("flex flex-col stack-medium")}>
          <div className={cn("flex flex-col stack-snug")}>
            <Label htmlFor="cap-data-inicio">
              <Text variant="meta-label">Data início</Text>
            </Label>
            <Input
              id="cap-data-inicio"
              type="date"
              value={inicio ?? ''}
              onChange={(e) =>
                onChange({
                  inicio: e.target.value,
                  fim: fim ?? '',
                })
              }
            />
          </div>
          <div className={cn("flex flex-col stack-snug")}>
            <Label htmlFor="cap-data-fim">
              <Text variant="meta-label">Data fim</Text>
            </Label>
            <Input
              id="cap-data-fim"
              type="date"
              value={fim ?? ''}
              onChange={(e) =>
                onChange({
                  inicio: inicio ?? '',
                  fim: e.target.value,
                })
              }
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ─── Main ────────────────────────────────────────────────────────────

export interface CapturadasFilterBarProps {
  filtros: GazetteFilters;
  onChange: (partial: Partial<GazetteFilters>) => void;
  tribunais: string[];
  tiposComunicacao: string[];
  tipoCounts?: Map<string, number>;
  statusSelecionado: StatusValue;
  onStatusChange: (v: StatusValue) => void;
  statusCounts: {
    vinculado: number;
    pendente: number;
    orfao: number;
    prazos: number;
  };
}

export function CapturadasFilterBar({
  filtros,
  onChange,
  tribunais,
  tiposComunicacao,
  tipoCounts,
  statusSelecionado,
  onStatusChange,
  statusCounts,
}: CapturadasFilterBarProps) {
  return (
    <div className={cn("flex items-center inline-tight flex-wrap")}>
      <StatusFilter
        selected={statusSelecionado}
        onChange={onStatusChange}
        counts={statusCounts}
      />
      <TribunalFilter
        selected={filtros.fonte ?? []}
        onChange={(v) => onChange({ fonte: v })}
        tribunais={tribunais}
      />
      <TipoFilter
        selected={filtros.tipo ?? []}
        onChange={(v) => onChange({ tipo: v })}
        tipos={tiposComunicacao}
        counts={tipoCounts ?? new Map()}
      />
      <MeioFilter
        selected={filtros.meio}
        onChange={(v) => onChange({ meio: v })}
      />
      <PeriodoFilter
        inicio={filtros.periodo?.inicio}
        fim={filtros.periodo?.fim}
        onChange={(v) => onChange({ periodo: v })}
      />
    </div>
  );
}
