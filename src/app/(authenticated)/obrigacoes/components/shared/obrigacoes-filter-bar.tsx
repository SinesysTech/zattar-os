'use client';

import * as React from 'react';
import { Check, ChevronDown, X } from 'lucide-react';

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Text } from '@/components/ui/typography';
import { cn } from '@/lib/utils';

import {
  STATUS_LABELS,
  TIPO_LABELS,
  DIRECAO_LABELS,
  type StatusAcordo,
  type TipoObrigacao,
  type DirecaoPagamento,
} from '../../domain';

export type ObrigacoesStatusFilter = StatusAcordo | 'todos';

export interface ObrigacoesFilterBarFilters {
  status: ObrigacoesStatusFilter;
  tipo: TipoObrigacao | null;
  direcao: DirecaoPagamento | null;
}

interface ObrigacoesFilterBarProps {
  filters: ObrigacoesFilterBarFilters;
  onChange: (filters: ObrigacoesFilterBarFilters) => void;
}

const POPOVER_CLASSES = /* design-system-escape: p-0 → usar <Inset> */ 'rounded-2xl glass-dropdown overflow-hidden p-0';

function FilterDropdownTrigger({
  label,
  active,
  onClear,
  open,
}: {
  label: string;
  active: boolean;
  onClear?: () => void;
  open: boolean;
}) {
  return (
    <div
      className={cn(
        /* design-system-escape: gap-1.5 gap sem token DS; px-2.5 padding direcional sem Inset equiv.; py-1.5 padding direcional sem Inset equiv.; font-medium → className de <Text>/<Heading> */ 'flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition-colors cursor-pointer',
        active
          ? 'border-primary/40 bg-primary/15 text-primary'
          : 'border-border/50 bg-muted/50 text-foreground/70 hover:bg-muted/80 hover:border-border/70',
        open && 'ring-1 ring-ring',
      )}
    >
      <Text variant="label" as="span">{label}</Text>
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

const STATUS_OPTIONS: { value: ObrigacoesStatusFilter; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'pendente', label: STATUS_LABELS.pendente },
  { value: 'pago_parcial', label: STATUS_LABELS.pago_parcial },
  { value: 'pago_total', label: STATUS_LABELS.pago_total },
  { value: 'atrasado', label: STATUS_LABELS.atrasado },
];

function StatusFilter({
  selected,
  onChange,
}: {
  selected: ObrigacoesStatusFilter;
  onChange: (v: ObrigacoesStatusFilter) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const label =
    STATUS_OPTIONS.find((o) => o.value === selected)?.label ?? 'Todos';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button">
          <FilterDropdownTrigger
            label={label}
            active={selected !== 'todos'}
            open={open}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent className={cn(POPOVER_CLASSES, 'w-48')} align="start" side="bottom">
        <div className={cn(/* design-system-escape: p-2 → usar <Inset>; space-y-0.5 sem token DS */ "p-2 space-y-0.5")}>
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={cn(
                /* design-system-escape: gap-2 → migrar para <Inline gap="tight">; px-2.5 padding direcional sem Inset equiv.; py-2 padding direcional sem Inset equiv. */ 'w-full flex items-center gap-2 rounded-lg px-2.5 py-2 text-caption transition-colors cursor-pointer',
                selected === opt.value
                  ? 'bg-primary/8 text-primary'
                  : 'hover:bg-muted/30 text-muted-foreground/70',
              )}
            >
              <span>{opt.label}</span>
              {selected === opt.value && <Check className="size-3 ml-auto" />}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function SimpleFilter({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  selected: string | null;
  onChange: (v: string | null) => void;
}) {
  const [open, setOpen] = React.useState(false);

  const displayLabel = selected
    ? options.find((o) => o.value === selected)?.label ?? label
    : label;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button">
          <FilterDropdownTrigger
            label={displayLabel}
            active={!!selected}
            onClear={selected ? () => onChange(null) : undefined}
            open={open}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent className={cn(POPOVER_CLASSES, 'w-48')} align="start" side="bottom">
        <div className={cn(/* design-system-escape: p-2 → usar <Inset>; space-y-0.5 sem token DS */ "p-2 space-y-0.5 max-h-56 overflow-y-auto")}>
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(selected === opt.value ? null : opt.value);
                setOpen(false);
              }}
              className={cn(
                /* design-system-escape: gap-2 → migrar para <Inline gap="tight">; px-2.5 padding direcional sem Inset equiv.; py-2 padding direcional sem Inset equiv. */ 'w-full flex items-center gap-2 rounded-lg px-2.5 py-2 text-caption transition-colors cursor-pointer',
                selected === opt.value
                  ? 'bg-primary/8 text-primary'
                  : 'hover:bg-muted/30 text-muted-foreground/70',
              )}
            >
              <span>{opt.label}</span>
              {selected === opt.value && <Check className="size-3 ml-auto" />}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

const TIPO_OPTIONS = Object.entries(TIPO_LABELS).map(([value, label]) => ({
  value,
  label,
}));

const DIRECAO_OPTIONS = Object.entries(DIRECAO_LABELS).map(([value, label]) => ({
  value,
  label,
}));

export function ObrigacoesFilterBar({ filters, onChange }: ObrigacoesFilterBarProps) {
  return (
    <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "flex items-center gap-2 flex-wrap")}>
      <StatusFilter
        selected={filters.status}
        onChange={(status) => onChange({ ...filters, status })}
      />
      <SimpleFilter
        label="Tipo"
        options={TIPO_OPTIONS}
        selected={filters.tipo}
        onChange={(tipo) =>
          onChange({ ...filters, tipo: tipo as TipoObrigacao | null })
        }
      />
      <SimpleFilter
        label="Direção"
        options={DIRECAO_OPTIONS}
        selected={filters.direcao}
        onChange={(direcao) =>
          onChange({ ...filters, direcao: direcao as DirecaoPagamento | null })
        }
      />
    </div>
  );
}
