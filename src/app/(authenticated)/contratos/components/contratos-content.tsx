'use client';

/**
 * ContratosContent — Orquestrador Glass Briefing da página de contratos.
 * ============================================================================
 * Shell único que alterna entre Lista e Kanban sem navegar. Preserva toda a
 * moldura visual (Header → PulseStrip → InsightBanners → PipelineStepper →
 * ToolbarFilters) entre as duas views. O toggle muda apenas o conteúdo abaixo
 * da toolbar.
 *
 *   Header → PulseStrip → InsightBanners → PipelineStepper
 *          → [ContratosFilterBar · SearchInput · ViewToggle+Settings]
 *          → ContratosListWrapper   (view=lista)
 *          → ContratosKanbanView    (view=kanban)
 * ============================================================================
 */

import * as React from 'react';
import Link from 'next/link';
import { Plus, List, LayoutGrid, Kanban, SlidersHorizontal } from 'lucide-react';
import { Heading, Text } from '@/components/ui/typography';
import { Button } from '@/components/ui/button';
import { InsightBanner } from '@/app/(authenticated)/dashboard/widgets/primitives';
import { SearchInput } from '@/components/dashboard/search-input';
import type { ViewToggleOption } from '@/components/dashboard/view-toggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { ContratosPulseStats } from '../actions/types';
import type { ClienteInfo } from '../types';
import { useSegmentos, type SegmentoOption } from '../hooks/use-segmentos';
import { ContratosPulseStrip } from './contratos-pulse-strip';
import { ContratosListWrapper } from './contratos-list-wrapper';
import { ContratosKanbanView } from './contratos-kanban-view';
import {
  ContratosFilterBar,
  DEFAULT_CONTRATOS_SORT,
  type ContratosFilters,
  type ContratosSort,
} from './contratos-filter-bar';

// ─── Constants ──────────────────────────────────────────────────────────────

const VIEW_OPTIONS: ViewToggleOption[] = [
  { id: 'lista', icon: List, label: 'Lista' },
  { id: 'cards', icon: LayoutGrid, label: 'Cartões' },
  { id: 'kanban', icon: Kanban, label: 'Kanban' },
];

export type ContratosViewMode = 'lista' | 'cards' | 'kanban';

// ─── Props ──────────────────────────────────────────────────────────────────

export interface ContratosContentProps {
  /** View inicial — permite que a rota /kanban abra direto no quadro. */
  initialView?: ContratosViewMode;
  /**
   * Pulse stats pré-resolvidos no Server Component. Elimina o fetch via
   * Server Action em `useEffect`, que quebrava quando o proxy de auth
   * interceptava a requisição e devolvia 307.
   */
  initialStats?: ContratosPulseStats | null;
  /** Segmentos pré-resolvidos no Server Component. */
  initialSegmentos?: SegmentoOption[];
  /**
   * Usuários ativos pré-carregados no servidor para popular selects de
   * responsável (dialogs de alterar responsável, formulário de contrato,
   * bulk actions). Sem isso a lista degrada para apenas usuários que já
   * são responsáveis de algum contrato visível.
   */
  initialUsuarios?: ClienteInfo[];
}

// ─── Component ──────────────────────────────────────────────────────────────

export function ContratosContent({
  initialView = 'lista',
  initialStats = null,
  initialSegmentos,
  initialUsuarios = [],
}: ContratosContentProps = {}) {
  const [stats] = React.useState<ContratosPulseStats | null>(initialStats);
  const [createOpen, setCreateOpen] = React.useState(false);

  const [viewMode, setViewMode] = React.useState<ContratosViewMode>(initialView);
  const [search, setSearch] = React.useState('');
  const [filters, setFilters] = React.useState<ContratosFilters>({
    segmentoId: '',
    tipoContrato: '',
    tipoCobranca: '',
  });
  const [sort, setSort] = React.useState<ContratosSort>(DEFAULT_CONTRATOS_SORT);

  // ── Segmentos (necessário para auto-select no modo Kanban) ────────────────
  const { segmentos } = useSegmentos(initialSegmentos);

  // ── Auto-select primeiro segmento ao entrar em Kanban sem seleção ────────
  React.useEffect(() => {
    if (viewMode !== 'kanban') return;
    if (filters.segmentoId) return;
    if (segmentos.length === 0) return;
    setFilters((prev) => ({ ...prev, segmentoId: String(segmentos[0]!.id) }));
  }, [viewMode, filters.segmentoId, segmentos]);

  // ── Derived values ────────────────────────────────────────────────────────
  const currentSegmentoId = filters.segmentoId ? Number(filters.segmentoId) : null;
  const currentSegmentoNome = segmentos.find((s) => s.id === currentSegmentoId)?.nome ?? null;

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleViewChange = React.useCallback((value: string) => {
    setViewMode(value as ContratosViewMode);
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className={cn(/* design-system-escape: space-y-5 sem token DS */ "space-y-5")}>
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className={cn(/* design-system-escape: gap-4 → migrar para <Inline gap="default"> */ "flex items-end justify-between gap-4")}>
        <div>
          <Heading level="page">Contratos</Heading>
          <Text variant="caption" as="p" className="mt-0.5">
            Gerencie contratos por segmento, acompanhe estágios e pipeline de conversão.
          </Text>
        </div>
        <Button size="sm" className="rounded-xl" onClick={() => setCreateOpen(true)}>
          <Plus className="size-3.5" />
          Novo Contrato
        </Button>
      </div>

      {/* ── Pulse Strip (KPIs) ──────────────────────────────────── */}
      {stats ? (
        <ContratosPulseStrip
          assinadosNaoDistribuidos={stats.assinadosNaoDistribuidos}
          distribuidosMes={stats.distribuidosMes}
          assinadosMes={stats.assinadosMes}
          emContratacao={stats.emContratacao}
        />
      ) : null}

      {/* ── Insight Banners ─────────────────────────────────────── */}
      <div role="status" aria-live="polite" className={cn(/* design-system-escape: space-y-2 → migrar para <Stack gap="tight"> */ "space-y-2 empty:hidden")}>
        {stats && stats.vencendo30d > 0 && (
          <InsightBanner type="warning">
            {stats.vencendo30d} contrato{stats.vencendo30d !== 1 ? 's' : ''} vence
            {stats.vencendo30d !== 1 ? 'm' : ''} nos próximos 30 dias
          </InsightBanner>
        )}

        {stats && stats.semResponsavel > 0 && (
          <InsightBanner type="info">
            {stats.semResponsavel} contrato{stats.semResponsavel !== 1 ? 's' : ''} sem
            responsável atribuído
          </InsightBanner>
        )}
      </div>

      {/* ── View Controls (FilterBar + Search + ViewToggle + Settings) ─────── */}
      <div className={cn(/* design-system-escape: gap-3 gap sem token DS */ "flex flex-col sm:flex-row items-start sm:items-center gap-3")}>
        <ContratosFilterBar
          filters={filters}
          onChange={setFilters}
          sort={viewMode !== 'kanban' ? sort : undefined}
          onSortChange={viewMode !== 'kanban' ? setSort : undefined}
        />
        <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "flex items-center gap-2 flex-1 justify-end flex-wrap")}>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder={
              viewMode === 'kanban'
                ? 'Buscar cliente no quadro...'
                : 'Buscar cliente, parte, processo...'
            }
          />
          <div className={cn(/* design-system-escape: gap-0.5 gap sem token DS; p-0.5 → usar <Inset> */ "flex items-center gap-0.5 p-0.5 rounded-lg bg-border/6")}>
            {VIEW_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleViewChange(opt.id)}
                aria-label={opt.label}
                className={cn(
                  /* design-system-escape: p-1.5 → usar <Inset> */ 'p-1.5 rounded-md transition-all cursor-pointer',
                  viewMode === opt.id
                    ? 'bg-primary/12 text-primary'
                    : 'text-muted-foreground/55 hover:text-muted-foreground',
                )}
              >
                <opt.icon className="size-3.5" />
              </button>
            ))}
            <span className={cn(/* design-system-escape: mx-0.5 margin sem primitiva DS */ "mx-0.5 h-4 w-px bg-border/40")} aria-hidden="true" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="Configurações de contratos"
                  className={cn(/* design-system-escape: p-1.5 → usar <Inset> */ "p-1.5 rounded-md text-muted-foreground/55 hover:text-muted-foreground transition-all cursor-pointer")}
                >
                  <SlidersHorizontal className="size-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href="/app/contratos/tipos">Tipos de Contrato</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/app/contratos/tipos-cobranca">Tipos de Cobrança</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/app/contratos/pipelines">Pipelines</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* ── Conteúdo por view ───────────────────────────────────── */}
      {viewMode === 'kanban' ? (
        <ContratosKanbanView
          segmentoId={currentSegmentoId}
          segmentoNome={currentSegmentoNome}
          search={search}
        />
      ) : (
        <ContratosListWrapper
          viewLayout={viewMode === 'cards' ? 'cards' : 'lista'}
          createOpen={createOpen}
          onCreateOpenChange={setCreateOpen}
          busca={search}
          segmentoId={filters.segmentoId}
          tipoContrato={filters.tipoContrato}
          tipoCobranca={filters.tipoCobranca}
          ordenarPor={sort.campo}
          ordem={sort.ordem}
          usuariosOptions={initialUsuarios}
        />
      )}
    </div>
  );
}
