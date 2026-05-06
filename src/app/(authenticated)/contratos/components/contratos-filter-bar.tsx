'use client';

/**
 * ContratosFilterBar — Barra de filtros Glass Briefing para contratos.
 * ============================================================================
 * Segue o padrão de `AudienciasFilterBar` e `ExpedientesFilterBar`:
 * pills com `FilterDropdownTrigger`, popovers com `glass-dropdown` e clear
 * inline via `X`. Substitui os `FilterPopover` shadcn (visual dashed-border)
 * que eram herdeiros do padrão DataTable enterprise.
 * ============================================================================
 */

import * as React from 'react';
import { ArrowDownAZ, ArrowUpAZ, Check, ChevronDown, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Text } from '@/components/ui/typography';
import { cn } from '@/lib/utils';
import { actionListarSegmentos, type Segmento } from '../actions';
import {
  TIPO_CONTRATO_LABELS,
  TIPO_COBRANCA_LABELS,
  type ContratoSortBy,
  type Ordem,
  type TipoContrato,
  type TipoCobranca,
} from '../domain';

// ── Types ──────────────────────────────────────────────────────────────

export interface ContratosFilters {
  segmentoId: string;
  tipoContrato: string;
  tipoCobranca: string;
}

export interface ContratosSort {
  campo: ContratoSortBy;
  ordem: Ordem;
}

export const CONTRATOS_SORT_OPTIONS: Array<{ campo: ContratoSortBy; label: string }> = [
  { campo: 'cadastrado_em', label: 'Data de cadastro' },
  { campo: 'created_at', label: 'Criado em' },
  { campo: 'updated_at', label: 'Atualizado em' },
  { campo: 'status', label: 'Estágio' },
  { campo: 'tipo_contrato', label: 'Tipo de contrato' },
  { campo: 'segmento_id', label: 'Segmento' },
  { campo: 'id', label: 'ID' },
];

export const DEFAULT_CONTRATOS_SORT: ContratosSort = {
  campo: 'cadastrado_em',
  ordem: 'desc',
};

interface ContratosFilterBarProps {
  filters: ContratosFilters;
  onChange: (filters: ContratosFilters) => void;
  sort?: ContratosSort;
  onSortChange?: (sort: ContratosSort) => void;
}

// ── Shared helpers ─────────────────────────────────────────────────────

const POPOVER_CLASSES = /* design-system-escape: p-0 → usar <Inset> */ 'rounded-2xl glass-dropdown overflow-hidden p-0';

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
          onClick={(e) => {
            e.stopPropagation();
            onClear();
          }}
          className={cn(/* design-system-escape: p-0.5 → usar <Inset> */ "ml-0.5 rounded-full p-0.5 hover:bg-primary/10 transition-colors")}
        >
          <X className="size-2.5" />
        </span>
      ) : (
        <ChevronDown className={cn('size-3 transition-transform', open && 'rotate-180')} />
      )}
    </div>
  );
}

// ── Segmento Filter ────────────────────────────────────────────────────

function SegmentoFilter({
  selected,
  onChange,
}: {
  selected: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [segmentos, setSegmentos] = React.useState<Segmento[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  const fetchSegmentos = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await actionListarSegmentos();
      if (result.success) {
        setSegmentos((result.data ?? []).filter((s) => s.ativo));
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (open && segmentos.length === 0) {
      void fetchSegmentos();
    }
  }, [open, segmentos.length, fetchSegmentos]);

  const label = React.useMemo(() => {
    if (!selected) return 'Segmento';
    const found = segmentos.find((s) => String(s.id) === selected);
    return found?.nome ?? 'Segmento';
  }, [selected, segmentos]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button">
          <FilterDropdownTrigger
            label={label}
            active={!!selected}
            onClear={selected ? () => onChange('') : undefined}
            open={open}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent className={cn(POPOVER_CLASSES, 'w-56')} align="start" side="bottom">
        <Command className="bg-transparent">
          <div className={cn(/* design-system-escape: px-3 padding direcional sem Inset equiv.; pt-3 padding direcional sem Inset equiv.; pb-1.5 padding direcional sem Inset equiv. */ "px-3 pt-3 pb-1.5")}>
            <CommandInput placeholder="Buscar segmento..." className={cn("h-8 text-caption rounded-lg")} />
          </div>
          <CommandList className={cn(/* design-system-escape: px-1.5 padding direcional sem Inset equiv.; pb-1.5 padding direcional sem Inset equiv. */ "max-h-52 px-1.5 pb-1.5")}>
            {isLoading ? (
              <Text variant="caption" as="div" className={cn(/* design-system-escape: py-6 padding direcional sem Inset equiv. */ "py-6 text-center text-muted-foreground/65")}>Carregando...</Text>
            ) : (
              <>
                <CommandEmpty>
                  <Text variant="caption" as="span" className="text-muted-foreground/65">Nenhum segmento</Text>
                </CommandEmpty>
                <CommandGroup>
                  {segmentos.map((segmento) => {
                    const segId = String(segmento.id);
                    const isSelected = selected === segId;
                    return (
                      <CommandItem
                        key={segmento.id}
                        value={segmento.nome}
                        onSelect={() => {
                          onChange(isSelected ? '' : segId);
                          setOpen(false);
                        }}
                        className={cn(/* design-system-escape: px-2 padding direcional sem Inset equiv.; py-1.5 padding direcional sem Inset equiv. */ "inline-tight rounded-lg text-caption px-2 py-1.5")}
                      >
                        <span>{segmento.nome}</span>
                        {isSelected && <Check className="size-3 ml-auto text-primary shrink-0" />}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// ── Tipo Contrato Filter ───────────────────────────────────────────────

function TipoContratoFilter({
  selected,
  onChange,
}: {
  selected: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = React.useState(false);

  const options = React.useMemo(
    () => Object.entries(TIPO_CONTRATO_LABELS) as [TipoContrato, string][],
    [],
  );

  const label = selected
    ? TIPO_CONTRATO_LABELS[selected as TipoContrato] ?? 'Tipo'
    : 'Tipo';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button">
          <FilterDropdownTrigger
            label={label}
            active={!!selected}
            onClear={selected ? () => onChange('') : undefined}
            open={open}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent className={cn(POPOVER_CLASSES, 'w-48')} align="start" side="bottom">
        <div className={cn(/* design-system-escape: p-2 → usar <Inset> */ "p-2 stack-nano")}>
          {options.map(([value, optLabel]) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                onChange(selected === value ? '' : value);
                setOpen(false);
              }}
              className={cn(
                /* design-system-escape: px-2.5 padding direcional sem Inset equiv.; py-2 padding direcional sem Inset equiv. */ 'w-full flex items-center inline-tight rounded-lg px-2.5 py-2 text-caption transition-colors cursor-pointer',
                selected === value
                  ? 'bg-primary/8 text-primary'
                  : 'hover:bg-muted/30 text-muted-foreground/70',
              )}
            >
              <span>{optLabel}</span>
              {selected === value && <Check className="size-3 ml-auto" />}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ── Tipo Cobrança Filter ───────────────────────────────────────────────

function TipoCobrancaFilter({
  selected,
  onChange,
}: {
  selected: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = React.useState(false);

  const options = React.useMemo(
    () => Object.entries(TIPO_COBRANCA_LABELS) as [TipoCobranca, string][],
    [],
  );

  const label = selected
    ? TIPO_COBRANCA_LABELS[selected as TipoCobranca] ?? 'Cobrança'
    : 'Cobrança';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button">
          <FilterDropdownTrigger
            label={label}
            active={!!selected}
            onClear={selected ? () => onChange('') : undefined}
            open={open}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent className={cn(POPOVER_CLASSES, 'w-48')} align="start" side="bottom">
        <div className={cn(/* design-system-escape: p-2 → usar <Inset> */ "p-2 stack-nano")}>
          {options.map(([value, optLabel]) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                onChange(selected === value ? '' : value);
                setOpen(false);
              }}
              className={cn(
                /* design-system-escape: px-2.5 padding direcional sem Inset equiv.; py-2 padding direcional sem Inset equiv. */ 'w-full flex items-center inline-tight rounded-lg px-2.5 py-2 text-caption transition-colors cursor-pointer',
                selected === value
                  ? 'bg-primary/8 text-primary'
                  : 'hover:bg-muted/30 text-muted-foreground/70',
              )}
            >
              <span>{optLabel}</span>
              {selected === value && <Check className="size-3 ml-auto" />}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ── Sort Filter ────────────────────────────────────────────────────────

function SortFilter({
  sort,
  onChange,
}: {
  sort: ContratosSort;
  onChange: (sort: ContratosSort) => void;
}) {
  const [open, setOpen] = React.useState(false);

  const currentOption = CONTRATOS_SORT_OPTIONS.find((o) => o.campo === sort.campo);
  const label = currentOption ? currentOption.label : 'Ordenar';
  const SortIcon = sort.ordem === 'desc' ? ArrowDownAZ : ArrowUpAZ;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button">
          <FilterDropdownTrigger label={label} active open={open}>
            <SortIcon className="size-3" />
          </FilterDropdownTrigger>
        </button>
      </PopoverTrigger>
      <PopoverContent className={cn(POPOVER_CLASSES, 'w-56')} align="start" side="bottom">
        <div className={cn(/* design-system-escape: p-2 → usar <Inset> */ "p-2 stack-nano")}>
          <div className={cn(/* design-system-escape: px-2 padding direcional sem Inset equiv.; pt-1 padding direcional sem Inset equiv.; pb-1.5 padding direcional sem Inset equiv. */ "px-2 pt-1 pb-1.5 text-meta-label text-muted-foreground/70")}>
            Ordenar por
          </div>
          {CONTRATOS_SORT_OPTIONS.map(({ campo, label: optLabel }) => (
            <button
              key={campo}
              type="button"
              onClick={() => {
                onChange({ ...sort, campo });
                setOpen(false);
              }}
              className={cn(
                /* design-system-escape: px-2.5 padding direcional sem Inset equiv.; py-2 padding direcional sem Inset equiv. */ 'w-full flex items-center inline-tight rounded-lg px-2.5 py-2 text-caption transition-colors cursor-pointer',
                sort.campo === campo
                  ? 'bg-primary/8 text-primary'
                  : 'hover:bg-muted/30 text-muted-foreground/70',
              )}
            >
              <span>{optLabel}</span>
              {sort.campo === campo && <Check className="size-3 ml-auto" />}
            </button>
          ))}
          <div className={cn(/* design-system-escape: my-1.5 margin sem primitiva DS; mx-1 margin sem primitiva DS */ "h-px bg-border/40 my-1.5 mx-1")} />
          <div className={cn(/* design-system-escape: px-2 padding direcional sem Inset equiv.; pb-1 padding direcional sem Inset equiv. */ "px-2 pb-1 text-meta-label text-muted-foreground/70")}>
            Direção
          </div>
          {(['desc', 'asc'] as const).map((ord) => (
            <button
              key={ord}
              type="button"
              onClick={() => {
                onChange({ ...sort, ordem: ord });
                setOpen(false);
              }}
              className={cn(
                /* design-system-escape: px-2.5 padding direcional sem Inset equiv.; py-2 padding direcional sem Inset equiv. */ 'w-full flex items-center inline-tight rounded-lg px-2.5 py-2 text-caption transition-colors cursor-pointer',
                sort.ordem === ord
                  ? 'bg-primary/8 text-primary'
                  : 'hover:bg-muted/30 text-muted-foreground/70',
              )}
            >
              {ord === 'desc' ? <ArrowDownAZ className="size-3" /> : <ArrowUpAZ className="size-3" />}
              <span>{ord === 'desc' ? 'Mais recente primeiro' : 'Mais antigo primeiro'}</span>
              {sort.ordem === ord && <Check className="size-3 ml-auto" />}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ── Main Export ────────────────────────────────────────────────────────

export function ContratosFilterBar({
  filters,
  onChange,
  sort,
  onSortChange,
}: ContratosFilterBarProps) {
  return (
    <div className={cn("flex items-center inline-tight flex-wrap")}>
      <SegmentoFilter
        selected={filters.segmentoId}
        onChange={(segmentoId) => onChange({ ...filters, segmentoId })}
      />
      <TipoContratoFilter
        selected={filters.tipoContrato}
        onChange={(tipoContrato) => onChange({ ...filters, tipoContrato })}
      />
      <TipoCobrancaFilter
        selected={filters.tipoCobranca}
        onChange={(tipoCobranca) => onChange({ ...filters, tipoCobranca })}
      />
      {sort && onSortChange && <SortFilter sort={sort} onChange={onSortChange} />}
    </div>
  );
}
