'use client';

import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGazetteStore } from './hooks/use-gazette-store';
import type { GazetteFilters } from '@/app/(authenticated)/captura/comunica-cnj/domain';

// ── Chip color mapping by filter category ──

const CHIP_STYLES: Record<string, string> = {
  fonte: 'bg-info/5 border-info/15 text-info',
  tipo: 'bg-success/5 border-success/15 text-success',
  periodo: 'bg-warning/5 border-warning/15 text-warning',
  meio: 'bg-muted/10 border-border text-muted-foreground',
};

const CATEGORY_LABELS: Record<string, string> = {
  fonte: 'Fonte',
  tipo: 'Tipo',
  periodo: 'Período',
  meio: 'Meio',
};

const MEIO_LABELS: Record<string, string> = {
  E: 'Edital',
  D: 'Diário Eletrônico',
};

// ── Build chips from active filters ──

interface ChipData {
  key: string;
  category: string;
  label: string;
  value: string;
}

function buildChips(filtros: GazetteFilters): ChipData[] {
  const chips: ChipData[] = [];

  if (filtros.fonte?.length) {
    for (const f of filtros.fonte) {
      chips.push({
        key: `fonte-${f}`,
        category: 'fonte',
        label: CATEGORY_LABELS.fonte,
        value: f,
      });
    }
  }

  if (filtros.tipo?.length) {
    for (const t of filtros.tipo) {
      chips.push({
        key: `tipo-${t}`,
        category: 'tipo',
        label: CATEGORY_LABELS.tipo,
        value: t,
      });
    }
  }

  if (filtros.periodo) {
    chips.push({
      key: 'periodo',
      category: 'periodo',
      label: CATEGORY_LABELS.periodo,
      value: `${filtros.periodo.inicio} — ${filtros.periodo.fim}`,
    });
  }

  if (filtros.meio) {
    chips.push({
      key: 'meio',
      category: 'meio',
      label: CATEGORY_LABELS.meio,
      value: MEIO_LABELS[filtros.meio] ?? filtros.meio,
    });
  }

  return chips;
}

// ── Main Component ──

export function GazetteFilterChips() {
  const filtros = useGazetteStore((s) => s.filtros);
  const setFiltros = useGazetteStore((s) => s.setFiltros);

  const chips = buildChips(filtros);

  if (chips.length === 0) return null;

  const handleRemove = (chip: ChipData) => {
    switch (chip.category) {
      case 'fonte': {
        const next = (filtros.fonte ?? []).filter((f) => f !== chip.value);
        setFiltros({ fonte: next.length > 0 ? next : undefined });
        break;
      }
      case 'tipo': {
        const next = (filtros.tipo ?? []).filter((t) => t !== chip.value);
        setFiltros({ tipo: next.length > 0 ? next : undefined });
        break;
      }
      case 'periodo':
        setFiltros({ periodo: undefined });
        break;
      case 'meio':
        setFiltros({ meio: undefined });
        break;
    }
  };

  return (
    <div className="flex gap-1.5 flex-wrap px-6 pb-1.5">
      {chips.map((chip) => (
        <span
          key={chip.key}
          className={cn(
            'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] transition-colors',
            CHIP_STYLES[chip.category] ?? 'bg-muted/10 border-border text-muted-foreground',
          )}
        >
          <span className="opacity-70">{chip.label}:</span>
          <span className="font-medium">{chip.value}</span>
          <button
            type="button"
            onClick={() => handleRemove(chip)}
            className="ml-0.5 rounded-full p-0.5 hover:bg-foreground/10 transition-colors"
            aria-label={`Remover filtro ${chip.label}: ${chip.value}`}
          >
            <X className="size-2.5" />
          </button>
        </span>
      ))}
    </div>
  );
}
