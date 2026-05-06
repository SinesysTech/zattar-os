'use client';

/**
 * PericiasListWrapper — View de lista (Glass List).
 * ============================================================================
 * Renderiza `PericiasGlassList` (cards glass por perícia) + paginação própria.
 * Toolbar vive no PericiasClient pai.
 * ============================================================================
 */

import { cn } from '@/lib/utils';
import * as React from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';

import type {
  Pericia,
  UsuarioOption,
  EspecialidadePericiaOption,
  PeritoOption,
} from '../domain';
import { SituacaoPericiaCodigo } from '../domain';
import { usePericias } from '../hooks/use-pericias';

import { PericiasGlassList } from './pericias-glass-list';
import { PericiaDetalhesDialog } from './pericia-detalhes-dialog';
import type {
  SituacaoFilterType,
  ResponsavelFilterType,
  LaudoFilterType,
} from './pericias-filter-bar';

// =============================================================================
// TIPOS
// =============================================================================

export interface PericiasListWrapperProps {
  busca: string;
  situacaoFilter: SituacaoFilterType;
  responsavelFilter: ResponsavelFilterType;
  laudoFilter: LaudoFilterType;
  tribunalFilter: string;
  grauFilter: string;
  especialidadeFilter: string;
  peritoFilter: string;
  dateRange?: { from?: Date; to?: Date };
  usuarios: UsuarioOption[];
  especialidades: EspecialidadePericiaOption[];
  peritos: PeritoOption[];
  refetchKey: number;
}

// =============================================================================
// COMPONENTE
// =============================================================================

const PAGE_SIZE = 25;

export function PericiasListWrapper({
  busca,
  situacaoFilter,
  responsavelFilter,
  laudoFilter,
  tribunalFilter,
  grauFilter,
  especialidadeFilter,
  peritoFilter,
  dateRange,
  usuarios,
  refetchKey,
}: PericiasListWrapperProps) {
  const [pageIndex, setPageIndex] = React.useState(0);

  // ---------- Dialog ----------
  const [selectedPericia, setSelectedPericia] =
    React.useState<Pericia | null>(null);
  const [isDetailOpen, setIsDetailOpen] = React.useState(false);

  // Reset page when filters/busca change
  React.useEffect(() => {
    setPageIndex(0);
  }, [
    busca,
    situacaoFilter,
    responsavelFilter,
    laudoFilter,
    tribunalFilter,
    grauFilter,
    especialidadeFilter,
    peritoFilter,
    dateRange,
  ]);

  // ---------- Hook params ----------
  const hookParams = React.useMemo(() => {
    const params: Record<string, unknown> = {
      pagina: pageIndex + 1,
      limite: PAGE_SIZE,
      busca: busca || undefined,
    };

    if (situacaoFilter !== 'todos') {
      params.situacaoCodigo = situacaoFilter;
    } else {
      params.situacoesExcluidas = [
        SituacaoPericiaCodigo.FINALIZADA,
        SituacaoPericiaCodigo.CANCELADA,
      ];
    }

    if (responsavelFilter === 'sem_responsavel') {
      params.semResponsavel = true;
    } else if (typeof responsavelFilter === 'number') {
      params.responsavelId = responsavelFilter;
    }

    if (laudoFilter === 'sim') params.laudoJuntado = true;
    if (laudoFilter === 'nao') params.laudoJuntado = false;

    if (dateRange?.from)
      params.prazoEntregaInicio = format(dateRange.from, 'yyyy-MM-dd');
    if (dateRange?.to)
      params.prazoEntregaFim = format(dateRange.to, 'yyyy-MM-dd');

    if (tribunalFilter) params.trt = tribunalFilter;
    if (grauFilter) params.grau = grauFilter;
    if (especialidadeFilter)
      params.especialidadeId = parseInt(especialidadeFilter, 10);
    if (peritoFilter) params.peritoId = parseInt(peritoFilter, 10);

    return params;
  }, [
    pageIndex,
    busca,
    situacaoFilter,
    responsavelFilter,
    laudoFilter,
    tribunalFilter,
    grauFilter,
    especialidadeFilter,
    peritoFilter,
    dateRange,
  ]);

  const { pericias, paginacao, isLoading, refetch } = usePericias(hookParams);

  React.useEffect(() => {
    if (refetchKey > 0) {
      refetch();
    }
  }, [refetchKey, refetch]);

  const total = paginacao?.total ?? 0;
  const totalPages = paginacao?.totalPaginas ?? 0;

  const handleViewDetail = React.useCallback((p: Pericia) => {
    setSelectedPericia(p);
    setIsDetailOpen(true);
  }, []);

  return (
    <div className={cn("stack-default")}>
      <PericiasGlassList
        pericias={pericias}
        isLoading={isLoading}
        onViewDetail={handleViewDetail}
        usuarios={usuarios}
      />

      {/* Pagination simples */}
      {totalPages > 1 && (
        <div className={cn(/* design-system-escape: pt-2 padding direcional sem Inset equiv. */ "flex items-center justify-between text-[11px] text-muted-foreground/70 pt-2")}>
          <span className="tabular-nums">
            Mostrando{' '}
            <span className={cn( "text-foreground font-medium")}>
              {pageIndex * PAGE_SIZE + 1}
            </span>
            –
            <span className={cn( "text-foreground font-medium")}>
              {Math.min((pageIndex + 1) * PAGE_SIZE, total)}
            </span>{' '}
            de <span className={cn( "text-foreground font-medium")}>{total}</span>
          </span>
          <div className={cn("flex items-center inline-tight")}>
            <Button
              variant="outline"
              size="sm"
              disabled={pageIndex === 0}
              onClick={() => setPageIndex((i) => Math.max(0, i - 1))}
            >
              Anterior
            </Button>
            <span className="text-[11px] tabular-nums">
              Página {pageIndex + 1} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={pageIndex >= totalPages - 1}
              onClick={() =>
                setPageIndex((i) => Math.min(totalPages - 1, i + 1))
              }
            >
              Próxima
            </Button>
          </div>
        </div>
      )}

      <PericiaDetalhesDialog
        pericia={selectedPericia}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
      />
    </div>
  );
}
