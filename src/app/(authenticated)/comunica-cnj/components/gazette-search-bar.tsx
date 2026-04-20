'use client';

import { useRef, useState, useCallback, type KeyboardEvent } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGazetteStore } from './hooks/use-gazette-store';
import type { GazetteFilters, MeioComunicacao } from '@/app/(authenticated)/comunica-cnj/domain';

// ── Operator parsing ──

const OPERATORS = ['fonte', 'tipo', 'prazo', 'processo', 'parte', 'advogado', 'vinculado', 'meio', 'data'] as const;
type Operator = (typeof OPERATORS)[number];

const OPERATOR_LABELS: Record<string, string> = {
  fonte: 'Fonte',
  tipo: 'Tipo',
  processo: 'Processo',
  parte: 'Parte',
  advogado: 'Advogado',
  meio: 'Meio',
  data: 'Data',
  vinculado: 'Vinculado',
  texto: 'Texto',
};

function isOperator(key: string): key is Operator {
  return OPERATORS.includes(key as Operator);
}

function parseSearchInput(input: string): GazetteFilters {
  const filters: GazetteFilters = {};
  let remaining = input.trim();

  const operatorRegex = /(\w+):(\S+)/g;
  let match: RegExpExecArray | null;

  while ((match = operatorRegex.exec(input)) !== null) {
    const [full, key, value] = match;

    if (!isOperator(key)) continue;

    remaining = remaining.replace(full, '').trim();

    switch (key) {
      case 'fonte':
        filters.fonte = [value.toUpperCase()];
        break;
      case 'tipo':
        filters.tipo = [value];
        break;
      case 'processo':
        filters.processo = value;
        break;
      case 'parte':
        filters.parte = value;
        break;
      case 'meio': {
        const meioCast = value.toUpperCase();
        if (meioCast === 'E' || meioCast === 'D') {
          filters.meio = meioCast as MeioComunicacao;
        }
        break;
      }
      case 'data': {
        // Support data:YYYY-MM-DD or data:YYYY-MM-DD..YYYY-MM-DD range
        const rangeParts = value.split('..');
        if (rangeParts.length === 2) {
          filters.periodo = { inicio: rangeParts[0], fim: rangeParts[1] };
        } else {
          filters.periodo = { inicio: value, fim: value };
        }
        break;
      }
    }
  }

  if (remaining) {
    filters.texto = remaining;
  }

  return filters;
}

// ── Build interpreted chip labels from parsed filters ──

interface ParsedChip {
  key: string;
  label: string;
  value: string;
}

function buildParsedChips(filters: GazetteFilters): ParsedChip[] {
  const chips: ParsedChip[] = [];

  if (filters.texto) {
    chips.push({ key: 'texto', label: OPERATOR_LABELS.texto, value: filters.texto });
  }
  if (filters.fonte?.length) {
    for (const f of filters.fonte) {
      chips.push({ key: `fonte-${f}`, label: OPERATOR_LABELS.fonte, value: f });
    }
  }
  if (filters.tipo?.length) {
    for (const t of filters.tipo) {
      chips.push({ key: `tipo-${t}`, label: OPERATOR_LABELS.tipo, value: t });
    }
  }
  if (filters.processo) {
    chips.push({ key: 'processo', label: OPERATOR_LABELS.processo, value: filters.processo });
  }
  if (filters.parte) {
    chips.push({ key: 'parte', label: OPERATOR_LABELS.parte, value: filters.parte });
  }
  if (filters.meio) {
    const MEIO_LABELS: Record<string, string> = { E: 'Edital', D: 'Diário Eletrônico' };
    chips.push({ key: 'meio', label: OPERATOR_LABELS.meio, value: MEIO_LABELS[filters.meio] ?? filters.meio });
  }
  if (filters.periodo) {
    chips.push({
      key: 'periodo',
      label: OPERATOR_LABELS.data,
      value: filters.periodo.inicio === filters.periodo.fim
        ? filters.periodo.inicio
        : `${filters.periodo.inicio} — ${filters.periodo.fim}`,
    });
  }

  return chips;
}

// ── Component ──

export function GazetteSearchBar({ className }: { className?: string }) {
  const setFiltros = useGazetteStore((s) => s.setFiltros);
  const limparFiltros = useGazetteStore((s) => s.limparFiltros);

  const inputRef = useRef<HTMLInputElement>(null);
  const [inputValue, setInputValue] = useState('');
  const [parsedFilters, setParsedFilters] = useState<GazetteFilters | null>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Escape') {
        inputRef.current?.blur();
        return;
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        if (!inputValue.trim()) return;

        const filters = parseSearchInput(inputValue.trim());
        const hasFilters = Object.keys(filters).length > 0;

        if (hasFilters) {
          setParsedFilters(filters);
        }
      }
    },
    [inputValue],
  );

  const handleApply = useCallback(() => {
    if (!parsedFilters) return;
    setFiltros(parsedFilters);
    setParsedFilters(null);
  }, [parsedFilters, setFiltros]);

  const handleClear = useCallback(() => {
    setInputValue('');
    setParsedFilters(null);
    limparFiltros();
    inputRef.current?.focus();
  }, [limparFiltros]);

  const handleDismissPreview = useCallback(() => {
    setParsedFilters(null);
  }, []);

  const chips = parsedFilters ? buildParsedChips(parsedFilters) : [];
  const hasPreview = chips.length > 0;

  return (
    <div className={cn('relative flex flex-col gap-1.5', className)}>
      {/* Search input row */}
      <div
        className={cn(
          'flex items-center gap-2 px-3.5 py-2',
          'bg-muted/20 border border-border/30 rounded-lg',
          'min-w-75 transition-all',
          'focus-within:border-primary/30 focus-within:bg-muted/30',
        )}
      >
        {/* Keyboard shortcut badge */}
        <kbd className="shrink-0 select-none rounded border border-border/40 px-1 py-0.5 text-[10px] text-muted-foreground">
          ⌘K
        </kbd>

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Buscar publicações..."
          data-gazette-search
          className={cn(
            'flex-1 bg-transparent outline-none text-sm',
            'text-foreground placeholder:text-muted-foreground/40',
            'min-w-0',
          )}
          aria-label="Buscar publicações"
          autoComplete="off"
          spellCheck={false}
        />

        {/* Clear button */}
        {inputValue && (
          <button
            type="button"
            onClick={handleClear}
            className="shrink-0 rounded p-0.5 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
            aria-label="Limpar busca"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      {/* Parsed filters preview */}
      {hasPreview && (
        <div className="flex flex-wrap items-center gap-1.5">
          {chips.map((chip) => (
            <span
              key={chip.key}
              className="inline-flex items-center gap-1 rounded border border-primary/15 bg-primary/5 px-1.5 py-0.5 text-[10px] text-primary"
            >
              <span className="opacity-70">{chip.label}:</span>
              <span className="font-medium">{chip.value}</span>
            </span>
          ))}

          <div className="ml-auto flex items-center gap-1">
            <button
              type="button"
              onClick={handleApply}
              className="rounded border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary transition-colors hover:bg-primary/15"
            >
              Aplicar
            </button>
            <button
              type="button"
              onClick={handleDismissPreview}
              className="rounded border border-border/40 bg-muted/30 px-2 py-0.5 text-[10px] text-muted-foreground transition-colors hover:bg-muted/50"
            >
              Limpar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
