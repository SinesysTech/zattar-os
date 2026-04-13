'use client';

import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

// ── Types ──

interface GazetteColumnConfigProps {
  trigger: React.ReactNode;
}

// ── Constants ──

type ColumnId = 'tipo' | 'processo' | 'orgao' | 'fonte' | 'data' | 'prazo' | 'status';

const COLUMNS: ReadonlyArray<{ id: ColumnId; label: string }> = [
  { id: 'tipo', label: 'Tipo' },
  { id: 'processo', label: 'Processo' },
  { id: 'orgao', label: 'Órgão' },
  { id: 'fonte', label: 'Fonte' },
  { id: 'data', label: 'Data' },
  { id: 'prazo', label: 'Prazo' },
  { id: 'status', label: 'Status' },
];

const DEFAULT_VISIBILITY: Record<ColumnId, boolean> = {
  tipo: true,
  processo: true,
  orgao: true,
  fonte: true,
  data: true,
  prazo: true,
  status: true,
};

// ── Main Component ──

export function GazetteColumnConfig({ trigger }: GazetteColumnConfigProps) {
  const [visibility, setVisibility] = useState<Record<ColumnId, boolean>>(DEFAULT_VISIBILITY);

  const handleToggle = (id: ColumnId, checked: boolean) => {
    setVisibility((prev) => ({ ...prev, [id]: checked }));
  };

  const handleRestore = () => {
    setVisibility({ ...DEFAULT_VISIBILITY });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent className="w-56 p-3" align="end">
        {/* Header */}
        <p className="text-xs font-semibold text-foreground mb-2.5">Colunas Visíveis</p>

        {/* Column list */}
        <div className="space-y-1">
          {COLUMNS.map((col) => (
            <div
              key={col.id}
              className={cn(
                'flex items-center justify-between py-1 px-1.5 rounded-md transition-colors',
                'hover:bg-muted/40',
              )}
            >
              <span className="text-xs text-foreground/80">{col.label}</span>
              <Switch
                checked={visibility[col.id]}
                onCheckedChange={(checked) => handleToggle(col.id, checked)}
                aria-label={`Alternar coluna ${col.label}`}
                className="scale-75 origin-right"
              />
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="pt-2.5 border-t border-border/40 mt-2">
          <button
            type="button"
            onClick={handleRestore}
            className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
          >
            Restaurar Padrão
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
