'use client';

import { useState, useMemo, useCallback } from 'react';
import { ChevronDown, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import { useGazetteStore } from './hooks/use-gazette-store';
import type { MeioComunicacao } from '@/app/(authenticated)/captura/comunica-cnj/domain';

// ── Tribunal data ──

const TRIBUNAIS = [
  'TRT-9',
  'TJ-PR',
  'TRT-2',
  'TJ-SP',
  'TST',
  'STF',
  'STJ',
] as const;

// ── Tipo data ──

const TIPOS_COMUNICACAO = [
  'Intimação',
  'Despacho',
  'Sentença',
  'Edital',
  'Certidão',
] as const;

// ── Meio data ──

const MEIOS = [
  { value: null, label: 'Todos' },
  { value: 'E' as MeioComunicacao, label: 'Edital (E)' },
  { value: 'D' as MeioComunicacao, label: 'Diário Eletrônico (D)' },
] as const;

// ── Helper: count active filters ──

function countActiveFilters(filtros: Record<string, unknown>): number {
  return Object.entries(filtros).filter(([, v]) => {
    if (v === undefined || v === null) return false;
    if (Array.isArray(v)) return v.length > 0;
    if (typeof v === 'object') return Object.keys(v as object).length > 0;
    return true;
  }).length;
}

// ── Multi-select checkbox list (reused by Fonte and Tipo) ──

function CheckboxList({
  items,
  selected,
  onToggle,
  searchable = false,
}: {
  items: readonly string[];
  selected: string[];
  onToggle: (item: string) => void;
  searchable?: boolean;
}) {
  const [search, setSearch] = useState('');

  const filtered = searchable
    ? items.filter((i) => i.toLowerCase().includes(search.toLowerCase()))
    : items;

  return (
    <div className="flex flex-col gap-1">
      {searchable && (
        <input
          type="text"
          placeholder="Buscar..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-1 rounded-md border border-border/30 bg-muted/20 px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
        />
      )}
      {filtered.map((item) => (
        <label
          key={item}
          className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-muted/40 transition-colors"
        >
          <input
            type="checkbox"
            checked={selected.includes(item)}
            onChange={() => onToggle(item)}
            className="size-3.5 rounded border-border accent-primary"
          />
          <span className="text-foreground">{item}</span>
        </label>
      ))}
      {filtered.length === 0 && (
        <span className="px-2 py-1.5 text-xs text-muted-foreground">
          Nenhum resultado
        </span>
      )}
    </div>
  );
}

// ── Main Component ──

export function GazetteFilterBar() {
  const filtros = useGazetteStore((s) => s.filtros);
  const setFiltros = useGazetteStore((s) => s.setFiltros);
  const limparFiltros = useGazetteStore((s) => s.limparFiltros);

  const activeCount = useMemo(
    () => countActiveFilters(filtros as unknown as Record<string, unknown>),
    [filtros],
  );

  // ── Toggle helpers ──

  const toggleFonte = useCallback(
    (tribunal: string) => {
      const current = filtros.fonte ?? [];
      const next = current.includes(tribunal)
        ? current.filter((t) => t !== tribunal)
        : [...current, tribunal];
      setFiltros({ fonte: next.length > 0 ? next : undefined });
    },
    [filtros.fonte, setFiltros],
  );

  const toggleTipo = useCallback(
    (tipo: string) => {
      const current = filtros.tipo ?? [];
      const next = current.includes(tipo)
        ? current.filter((t) => t !== tipo)
        : [...current, tipo];
      setFiltros({ tipo: next.length > 0 ? next : undefined });
    },
    [filtros.tipo, setFiltros],
  );

  const setMeio = useCallback(
    (meio: MeioComunicacao | null) => {
      setFiltros({ meio: meio });
    },
    [setFiltros],
  );

  // ── Derived labels ──

  const fonteLabel = filtros.fonte?.length
    ? filtros.fonte.length === 1
      ? filtros.fonte[0]
      : `${filtros.fonte.length} tribunais`
    : null;

  const tipoLabel = filtros.tipo?.length
    ? filtros.tipo.length === 1
      ? filtros.tipo[0]
      : `${filtros.tipo.length} tipos`
    : null;

  return (
    <div className="flex items-center justify-between gap-4 px-6 py-1.5">
      {/* Filter buttons */}
      <div className="flex items-center gap-1.5">
        {/* Fonte */}
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className={cn(
                'flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs transition-colors',
                fonteLabel
                  ? 'bg-info/10 border-info/20 text-info'
                  : 'border-border/30 text-muted-foreground hover:text-foreground hover:border-border/50',
              )}
            >
              Fonte{fonteLabel ? `: ${fonteLabel}` : ''}
              <ChevronDown className="size-3 opacity-60" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-52 p-2" align="start">
            <CheckboxList
              items={TRIBUNAIS}
              selected={filtros.fonte ?? []}
              onToggle={toggleFonte}
              searchable
            />
          </PopoverContent>
        </Popover>

        {/* Tipo */}
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className={cn(
                'flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs transition-colors',
                tipoLabel
                  ? 'bg-success/10 border-success/20 text-success'
                  : 'border-border/30 text-muted-foreground hover:text-foreground hover:border-border/50',
              )}
            >
              Tipo{tipoLabel ? `: ${tipoLabel}` : ''}
              <ChevronDown className="size-3 opacity-60" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-2" align="start">
            <CheckboxList
              items={TIPOS_COMUNICACAO}
              selected={filtros.tipo ?? []}
              onToggle={toggleTipo}
            />
          </PopoverContent>
        </Popover>

        {/* Período */}
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-md border border-border/30 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:border-border/50 transition-colors"
            >
              Período
              <ChevronDown className="size-3 opacity-60" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-3" align="start">
            <p className="text-xs text-muted-foreground">
              DateRangePicker (a ser conectado)
            </p>
          </PopoverContent>
        </Popover>

        {/* Advogado */}
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-md border border-border/30 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:border-border/50 transition-colors"
            >
              Advogado
              <ChevronDown className="size-3 opacity-60" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-3" align="start">
            <p className="text-xs text-muted-foreground">
              Combobox OAB (a ser conectado)
            </p>
          </PopoverContent>
        </Popover>

        {/* Meio */}
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-md border border-border/30 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:border-border/50 transition-colors"
            >
              Meio
              <ChevronDown className="size-3 opacity-60" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-2" align="start">
            <div className="flex flex-col gap-1">
              {MEIOS.map((m) => (
                <label
                  key={m.label}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-muted/40 transition-colors"
                >
                  <input
                    type="radio"
                    name="meio-filter"
                    checked={filtros.meio === m.value}
                    onChange={() => setMeio(m.value)}
                    className="size-3.5 accent-primary"
                  />
                  <span className="text-foreground">{m.label}</span>
                </label>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* + Filtro */}
        <button
          type="button"
          className="flex items-center gap-1 rounded-md border border-dashed border-border/40 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:border-border/60 transition-colors"
        >
          <Plus className="size-3" />
          Filtro
        </button>
      </div>

      {/* Right — Active filters summary */}
      <div className="flex items-center gap-2">
        {activeCount > 0 && (
          <>
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              Filtros ativos
              <span className="inline-flex items-center justify-center rounded-full bg-primary/10 px-1.5 text-[10px] font-medium text-primary tabular-nums">
                {activeCount}
              </span>
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={limparFiltros}
              className="h-auto px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <X className="mr-1 size-3" />
              Limpar
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
