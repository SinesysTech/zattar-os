'use client';

import { cn } from '@/lib/utils';
import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Search } from 'lucide-react';
import type { TimelineItemEnriquecido } from '@/types/contracts/pje-trt';
import type { GrauProcesso } from '@/app/(authenticated)/partes';
import { Input } from '@/components/ui/input';
import { TimelineSidebarItem } from './timeline-sidebar-item';
import { Text } from '@/components/ui/typography';

type TimelineItemWithGrau = TimelineItemEnriquecido & {
  grauOrigem?: GrauProcesso;
};

interface TimelineSidebarProps {
  items: TimelineItemWithGrau[];
  selectedItemId: number | null;
  onSelectItem: (item: TimelineItemWithGrau) => void;
}

/**
 * Agrupa itens por data (formatada como "dd MMM yyyy")
 */
function groupByDate(
  items: TimelineItemWithGrau[]
): { label: string; items: TimelineItemWithGrau[] }[] {
  const groups: Map<string, TimelineItemWithGrau[]> = new Map();

  for (const item of items) {
    let dateKey: string;
    try {
      dateKey = format(new Date(item.data), 'dd MMM yyyy', { locale: ptBR });
    } catch {
      dateKey = 'Data desconhecida';
    }

    const existing = groups.get(dateKey);
    if (existing) {
      existing.push(item);
    } else {
      groups.set(dateKey, [item]);
    }
  }

  return Array.from(groups.entries()).map(([label, items]) => ({
    label,
    items,
  }));
}

export function TimelineSidebar({
  items,
  selectedItemId,
  onSelectItem,
}: TimelineSidebarProps) {
  const [search, setSearch] = useState('');

  // Ordenar por data desc e filtrar por busca
  const sortedAndFiltered = useMemo(() => {
    const sorted = [...items].sort(
      (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()
    );

    if (!search.trim()) return sorted;

    const term = search.toLowerCase();
    return sorted.filter((item) => item.titulo.toLowerCase().includes(term));
  }, [items, search]);

  const grouped = useMemo(
    () => groupByDate(sortedAndFiltered),
    [sortedAndFiltered]
  );

  const totalDocs = items.filter((i) => i.documento).length;
  const totalMovs = items.filter((i) => !i.documento).length;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className={cn(/* design-system-escape: p-3 → usar <Inset> */ "flex flex-col flex-none p-3 border-b stack-tight")}>
        <Text variant="caption">
          {items.length} {items.length === 1 ? 'item' : 'itens'} · {totalDocs}{' '}
          {totalDocs === 1 ? 'documento' : 'documentos'} · {totalMovs}{' '}
          {totalMovs === 1 ? 'movimento' : 'movimentos'}
        </Text>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Buscar na timeline..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={cn("h-8 pl-8 text-caption")}
          />
        </div>
      </div>

      {/* Lista scrollável */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {grouped.length === 0 ? (
          <Text variant="caption" className="p-4 text-center">
            Nenhum item encontrado
          </Text>
        ) : (
          grouped.map((group) => (
            <div key={group.label}>
              {/* Date separator */}
              <div className={cn("sticky top-0 z-10 bg-muted/80 backdrop-blur-sm px-3 py-1.5 border-b")}>
                <span className={cn( "text-[11px] font-medium text-muted-foreground uppercase")}>
                  {group.label}
                </span>
              </div>
              {/* Items */}
              {group.items.map((item) => (
                <TimelineSidebarItem
                  key={item.id}
                  item={item}
                  isSelected={item.id === selectedItemId}
                  onSelect={onSelectItem}
                />
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
