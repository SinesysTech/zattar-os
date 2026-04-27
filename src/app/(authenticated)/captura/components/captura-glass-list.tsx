'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import {
  Database,
  Gavel,
  Layers,
  Clock,
  FileSearch,
  Users,
  FileText,
  Archive,
  ChevronRight,
  ChevronLeft,
  Eye,
  Trash2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { CapturaStatusSemanticBadge } from '@/components/ui/semantic-badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/empty-state';
import { GlassPanel } from '@/components/shared/glass-panel';
import type { CapturaLog, TipoCaptura, StatusCaptura } from '../types';
import type { CapturaKpiData } from './captura-kpi-strip';
import { useCapturasLog } from '../hooks/use-capturas-log';
import { useAdvogadosMap } from '../hooks/use-advogados-map';
import { useCredenciaisMap } from '../hooks/use-credenciais-map';
import { CapturaEscopoBadge } from './captura-escopo-badge';

// =============================================================================
// TIPOS
// =============================================================================

interface CapturaGlassListProps {
  search?: string;
  filters?: { tipo: string | null; status: string | null; tribunal: string | null };
  onKpiUpdate?: (data: CapturaKpiData) => void;
  onView?: (captura: CapturaLog) => void;
}

// =============================================================================
// HELPERS
// =============================================================================

function getTipoIconBg(tipo: TipoCaptura): string {
  switch (tipo) {
    case 'acervo_geral': return 'bg-primary/[0.08]';
    case 'audiencias':
    case 'audiencias_designadas':
    case 'audiencias_realizadas':
    case 'audiencias_canceladas': return 'bg-info/[0.08]';
    case 'combinada': return 'bg-warning/[0.08]';
    case 'timeline': return 'bg-success/[0.08]';
    case 'pericias': return 'bg-destructive/[0.08]';
    case 'partes': return 'bg-primary/[0.08]';
    case 'pendentes':
    case 'expedientes_no_prazo':
    case 'expedientes_sem_prazo': return 'bg-info/[0.08]';
    case 'arquivados': return 'bg-muted-foreground/[0.08]';
    default: return 'bg-primary/[0.08]';
  }
}

function getTipoIconColor(tipo: TipoCaptura): string {
  switch (tipo) {
    case 'acervo_geral': return 'text-primary';
    case 'audiencias':
    case 'audiencias_designadas':
    case 'audiencias_realizadas':
    case 'audiencias_canceladas': return 'text-info';
    case 'combinada': return 'text-warning';
    case 'timeline': return 'text-success';
    case 'pericias': return 'text-destructive';
    case 'partes': return 'text-primary';
    case 'pendentes':
    case 'expedientes_no_prazo':
    case 'expedientes_sem_prazo': return 'text-info';
    case 'arquivados': return 'text-muted-foreground';
    default: return 'text-primary';
  }
}

function getTipoIcon(tipo: TipoCaptura): LucideIcon {
  switch (tipo) {
    case 'acervo_geral':
      return Database;
    case 'audiencias':
    case 'audiencias_designadas':
    case 'audiencias_realizadas':
    case 'audiencias_canceladas':
      return Gavel;
    case 'combinada':
      return Layers;
    case 'timeline':
      return Clock;
    case 'pericias':
      return FileSearch;
    case 'partes':
      return Users;
    case 'pendentes':
    case 'expedientes_no_prazo':
    case 'expedientes_sem_prazo':
      return FileText;
    case 'arquivados':
      return Archive;
    default:
      return Database;
  }
}

const TIPO_LABELS: Record<TipoCaptura, string> = {
  acervo_geral: 'Acervo Geral',
  arquivados: 'Arquivados',
  audiencias: 'Audiências',
  pendentes: 'Pendentes',
  partes: 'Partes',
  combinada: 'Combinada',
  audiencias_designadas: 'Audiências Designadas',
  audiencias_realizadas: 'Audiências Realizadas',
  audiencias_canceladas: 'Audiências Canceladas',
  expedientes_no_prazo: 'Expedientes no Prazo',
  expedientes_sem_prazo: 'Expedientes sem Prazo',
  pericias: 'Perícias',
  timeline: 'Timeline',
};

const STATUS_LABELS: Record<StatusCaptura, string> = {
  completed: 'Concluída',
  in_progress: 'Em Andamento',
  failed: 'Falha',
  pending: 'Pendente',
};

function formatarTipo(tipo: TipoCaptura): string {
  return TIPO_LABELS[tipo] ?? tipo;
}

function formatarDataHoraSeparado(iso: string): { data: string; hora: string } {
  try {
    const date = new Date(iso);
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return { data: `${dd}/${mm}`, hora: `${hh}:${min}` };
  } catch {
    return { data: '—', hora: '' };
  }
}

function calcularDuracao(captura: CapturaLog): string {
  if (!captura.concluido_em) return '—';
  try {
    const inicio = new Date(captura.iniciado_em).getTime();
    const fim = new Date(captura.concluido_em).getTime();
    const diffMs = fim - inicio;
    if (diffMs < 0) return '—';
    const totalSec = Math.floor(diffMs / 1000);
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    if (mins > 0) return `${mins}min ${secs}s`;
    return `${secs}s`;
  } catch {
    return '—';
  }
}

// =============================================================================
// GLASS ROW
// =============================================================================

function GlassRow({
  captura,
  credenciaisMap,
  onView,
}: {
  captura: CapturaLog;
  credenciaisMap: Map<number, { tribunal: string; grau: string }>;
  onView: () => void;
}) {
  const TipoIcon = getTipoIcon(captura.tipo_captura);
  const { data, hora } = formatarDataHoraSeparado(captura.iniciado_em);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onView}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onView(); } }}
      className={cn(
        'w-full text-left rounded-2xl border p-4 cursor-pointer glass-widget bg-transparent',
        'transition-all duration-200 ease-out',
        'hover:scale-[1.0025] hover:-translate-y-px hover:shadow-lg',
        captura.status === 'failed'
          ? 'border-destructive/20 hover:border-destructive/35'
          : captura.status === 'in_progress'
            ? 'border-info/20 hover:border-info/35'
            : 'border-border/20 hover:border-border/40',
      )}
    >
      <div className="grid grid-cols-[90px_1fr_200px_120px_80px_56px] gap-3 items-center">
        {/* Data + hora (ancoragem temporal) */}
        <div className="flex flex-col leading-tight">
          <span className="text-xs font-medium text-foreground/80 tabular-nums">{data}</span>
          <span className="text-[11px] text-muted-foreground/60 tabular-nums">{hora}</span>
        </div>

        {/* Ícone + tipo */}
        <div className="flex items-center gap-3 min-w-0">
          <div className={cn('w-9 h-9 rounded-[0.625rem] flex items-center justify-center shrink-0', getTipoIconBg(captura.tipo_captura))}>
            <TipoIcon className={cn('w-4 h-4', getTipoIconColor(captura.tipo_captura))} />
          </div>
          <span className="text-sm font-semibold truncate min-w-0">
            {formatarTipo(captura.tipo_captura)}
          </span>
        </div>

        {/* Escopo: tribunais + graus, texto único com tooltip */}
        <div className="flex items-center min-w-0">
          <CapturaEscopoBadge
            credencialIds={captura.credencial_ids}
            credenciaisMap={credenciaisMap}
          />
        </div>

        {/* Status badge */}
        <div className="flex items-center justify-end">
          <CapturaStatusSemanticBadge value={captura.status} className="text-[10px]">
            {STATUS_LABELS[captura.status] ?? captura.status}
          </CapturaStatusSemanticBadge>
        </div>

        {/* Duração */}
        <div className="text-right">
          <span className="text-xs text-muted-foreground/60 tabular-nums">
            {calcularDuracao(captura)}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onView(); }}
            className="size-7 rounded-md flex items-center justify-center text-muted-foreground/45 hover:bg-muted/30 hover:text-foreground transition-colors"
            aria-label="Ver detalhes"
          >
            <Eye className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={(e) => e.stopPropagation()}
            className="size-7 rounded-md flex items-center justify-center text-muted-foreground/45 hover:bg-destructive/10 hover:text-destructive transition-colors"
            aria-label="Excluir"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ListToolbar removido — informação já presente no KPI strip acima

// =============================================================================
// SKELETON
// =============================================================================

function ListSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: 5 }, (_, i) => (
        <GlassPanel key={i} depth={1} className="p-4">
          <div className="grid grid-cols-[90px_1fr_200px_120px_80px_56px] gap-3 items-center">
            <div className="flex flex-col gap-1">
              <Skeleton className="h-3 w-10" />
              <Skeleton className="h-3 w-10" />
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="w-9 h-9 rounded-[0.625rem]" />
              <Skeleton className="h-4 w-40" />
            </div>
            <Skeleton className="h-3 w-44" />
            <Skeleton className="h-5 w-20 rounded-full ml-auto" />
            <Skeleton className="h-3 w-12 ml-auto" />
            <div />
          </div>
        </GlassPanel>
      ))}
    </div>
  );
}

// ColumnHeaders removido — glass rows são auto-descritivos

// =============================================================================
// PAGINATION
// =============================================================================

function PaginationBar({
  paginacao,
  pagina,
  onPrev,
  onNext,
}: {
  paginacao: { pagina: number; limite: number; total: number; totalPaginas: number };
  pagina: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  const inicio = (pagina - 1) * paginacao.limite + 1;
  const fim = Math.min(pagina * paginacao.limite, paginacao.total);

  return (
    <div className="flex items-center justify-between mt-4 px-1">
      <span className="text-xs text-muted-foreground/60">
        {paginacao.total > 0 ? `${inicio}–${fim} de ${paginacao.total}` : '0 resultados'}
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onPrev}
          disabled={pagina <= 1}
          className={cn(
            'inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium',
            'border border-foreground/8 transition-all duration-150',
            'disabled:opacity-30 disabled:cursor-not-allowed',
            'hover:bg-foreground/6 hover:border-foreground/14',
          )}
        >
          <ChevronLeft className="w-3 h-3" />
          Anterior
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={pagina >= paginacao.totalPaginas}
          className={cn(
            'inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium',
            'border border-foreground/8 transition-all duration-150',
            'disabled:opacity-30 disabled:cursor-not-allowed',
            'hover:bg-foreground/6 hover:border-foreground/14',
          )}
        >
          Próxima
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export function CapturaGlassList({
  search,
  filters,
  onKpiUpdate,
  onView,
}: CapturaGlassListProps) {
  const [pagina, setPagina] = useState(1);

  const { capturas, paginacao, isLoading } = useCapturasLog({
    pagina,
    limite: 20,
    tipo_captura: (filters?.tipo as TipoCaptura) || undefined,
    status: (filters?.status as StatusCaptura) || undefined,
  });

  const { advogadosMap } = useAdvogadosMap();
  const { credenciaisMap } = useCredenciaisMap();

  const resolveTribunais = React.useCallback(
    (captura: CapturaLog): string[] => {
      if (!captura.credencial_ids?.length) return [];
      const tribunais = new Set<string>();
      for (const credId of captura.credencial_ids) {
        const info = credenciaisMap.get(credId);
        if (info) tribunais.add(info.tribunal);
      }
      return Array.from(tribunais);
    },
    [credenciaisMap]
  );

  // KPI update
  useEffect(() => {
    if (!onKpiUpdate) return;
    const total = paginacao?.total ?? 0;
    const sucesso = capturas.filter((c) => c.status === 'completed').length;
    const emAndamento = capturas.filter((c) => c.status === 'in_progress').length;
    const falhas = capturas.filter((c) => c.status === 'failed').length;
    const taxaSucesso = capturas.length > 0 ? Math.round((sucesso / capturas.length) * 100) : 0;
    onKpiUpdate({ total, sucesso, emAndamento, falhas, taxaSucesso });
  }, [capturas, paginacao, onKpiUpdate]);

  // Reset page when filters change
  useEffect(() => {
    setPagina(1);
  }, [filters?.tipo, filters?.status, filters?.tribunal]);

  // Client-side search + tribunal filter
  const filtered = React.useMemo(() => {
    let result = capturas;

    // Tribunal filter (client-side since API doesn't support it)
    if (filters?.tribunal) {
      result = result.filter((c) => resolveTribunais(c).includes(filters.tribunal as string));
    }

    // Text search
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((c) => {
        const tipoLabel = formatarTipo(c.tipo_captura).toLowerCase();
        const advogado = c.advogado_id ? (advogadosMap.get(c.advogado_id) ?? '').toLowerCase() : '';
        const tribunais = resolveTribunais(c).join(' ').toLowerCase();
        return tipoLabel.includes(q) || advogado.includes(q) || tribunais.includes(q);
      });
    }

    return result;
  }, [capturas, search, filters?.tribunal, advogadosMap, resolveTribunais]);

  if (isLoading) return <ListSkeleton />;

  if (filtered.length === 0) {
    return (
      <EmptyState
        icon={FileSearch}
        title="Nenhuma captura encontrada"
        description="Tente ajustar os filtros ou aguarde novas capturas serem realizadas."
      />
    );
  }

  return (
    <div className="flex flex-col gap-2">
        {filtered.map((captura) => (
          <GlassRow
            key={captura.id}
            captura={captura}
            credenciaisMap={credenciaisMap}
            onView={() => onView?.(captura)}
          />
        ))}
      {paginacao && paginacao.totalPaginas > 1 && (
        <PaginationBar
          paginacao={paginacao}
          pagina={pagina}
          onPrev={() => setPagina((p) => Math.max(1, p - 1))}
          onNext={() => setPagina((p) => Math.min(paginacao.totalPaginas, p + 1))}
        />
      )}
    </div>
  );
}
