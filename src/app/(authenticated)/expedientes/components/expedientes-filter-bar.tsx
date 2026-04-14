'use client';

import * as React from 'react';
import { Check, ChevronDown, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import {
  CodigoTribunal,
  GRAU_TRIBUNAL_LABELS,
  GrauTribunal,
  ORIGEM_EXPEDIENTE_LABELS,
  OrigemExpediente,
} from '../domain';

// ── Types ──────────────────────────────────────────────────────────────

export interface ExpedientesFilterBarFilters {
  trt: string | null;
  grau: string | null;
  origem: string | null;
  responsavel: string | null;
  tipo: string | null;
}

interface ExpedientesFilterBarProps {
  filters: ExpedientesFilterBarFilters;
  onChange: (filters: ExpedientesFilterBarFilters) => void;
  usuarios: { id: number; nomeExibicao?: string | null; nomeCompleto?: string | null }[];
  tiposExpedientes: { id: number; tipoExpediente?: string }[];
}

// ── Shared ─────────────────────────────────────────────────────────────

const POPOVER_CLASSES = 'rounded-2xl glass-dropdown overflow-hidden p-0';

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
        'flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition-colors cursor-pointer',
        active
          ? 'border-primary/20 bg-primary/5 text-primary'
          : 'border-border/15 text-muted-foreground/60 hover:bg-muted/30',
        open && 'ring-1 ring-ring'
      )}
    >
      <span>{label}</span>
      {active && onClear ? (
        <span
          role="button"
          onClick={(e) => {
            e.stopPropagation();
            onClear();
          }}
          className="ml-0.5 rounded-full p-0.5 hover:bg-primary/10 transition-colors"
        >
          <X className="size-2.5" />
        </span>
      ) : (
        <ChevronDown className={cn('size-3 transition-transform', open && 'rotate-180')} />
      )}
    </div>
  );
}

// ── Generic simple filter ─────────────────────────────────────────────

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
        <div className="p-2 space-y-0.5 max-h-56 overflow-y-auto">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(selected === opt.value ? null : opt.value);
                setOpen(false);
              }}
              className={cn(
                'w-full flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs transition-colors cursor-pointer',
                selected === opt.value
                  ? 'bg-primary/8 text-primary'
                  : 'hover:bg-muted/30 text-muted-foreground/70'
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

// ── Static option sets ────────────────────────────────────────────────

const TRIBUNAL_OPTIONS = CodigoTribunal.map((trt) => ({ value: trt, label: trt }));

const GRAU_OPTIONS = Object.entries(GRAU_TRIBUNAL_LABELS).map(
  ([value, label]) => ({ value, label })
);

const ORIGEM_OPTIONS = Object.entries(ORIGEM_EXPEDIENTE_LABELS).map(
  ([value, label]) => ({ value, label })
);

// ── Main Export ─────────────────────────────────────────────────────────

export function ExpedientesFilterBar({
  filters,
  onChange,
  usuarios,
  tiposExpedientes,
}: ExpedientesFilterBarProps) {
  const responsavelOptions = React.useMemo(
    () => [
      { value: 'null', label: 'Sem Responsavel' },
      ...usuarios.map((u) => ({
        value: String(u.id),
        label: u.nomeExibicao || u.nomeCompleto || `Usuario ${u.id}`,
      })),
    ],
    [usuarios]
  );

  const tipoOptions = React.useMemo(
    () =>
      tiposExpedientes.map((t) => ({
        value: String(t.id),
        label: t.tipoExpediente || `Tipo ${t.id}`,
      })),
    [tiposExpedientes]
  );

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <SimpleFilter
        label="Tribunal"
        options={TRIBUNAL_OPTIONS}
        selected={filters.trt}
        onChange={(trt) => onChange({ ...filters, trt })}
      />
      <SimpleFilter
        label="Grau"
        options={GRAU_OPTIONS}
        selected={filters.grau}
        onChange={(grau) => onChange({ ...filters, grau })}
      />
      <SimpleFilter
        label="Origem"
        options={ORIGEM_OPTIONS}
        selected={filters.origem}
        onChange={(origem) => onChange({ ...filters, origem })}
      />
      <SimpleFilter
        label="Responsavel"
        options={responsavelOptions}
        selected={filters.responsavel}
        onChange={(responsavel) => onChange({ ...filters, responsavel })}
      />
      <SimpleFilter
        label="Tipo"
        options={tipoOptions}
        selected={filters.tipo}
        onChange={(tipo) => onChange({ ...filters, tipo })}
      />
    </div>
  );
}
