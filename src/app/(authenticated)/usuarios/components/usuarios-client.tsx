'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Settings } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';
import { Button } from '@/components/ui/button';
import { Heading } from '@/components/ui/typography';
import { Skeleton } from '@/components/ui/skeleton';
import { InsightBanner } from '@/app/(authenticated)/dashboard/mock/widgets/primitives';
import { useUsuarios } from '../hooks/use-usuarios';
import { useCargos } from '../hooks/use-cargos';
import { UserKpiStrip } from './list/user-kpi-strip';
import { UsuariosToolbar, type UsuariosViewMode } from './list/usuarios-toolbar';
import { UsuariosGridView } from './list/usuarios-grid-view';
import { UsuariosListView } from './list/usuarios-list-view';
import { calcularCompleteness } from './shared/completeness-utils';
import { CargosManagementDialog } from './cargos/cargos-management-dialog';
import { UsuarioCreateDialog } from './forms/usuario-create-dialog';
import type { Usuario } from '../domain';

// ─── Lazy-load organograma ───────────────────────────────────────────────────
const UsuariosOrgView = React.lazy(() =>
  import('./list/usuarios-org-view').then((m) => ({ default: m.UsuariosOrgView }))
);

// ─── Skeleton grid (reutilizado como fallback) ───────────────────────────────
function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="h-48 rounded-2xl" />
      ))}
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export function UsuariosClient() {
  const router = useRouter();

  // View / filter state
  const [viewMode, setViewMode] = React.useState<UsuariosViewMode>('grid');
  const [activeTab, setActiveTab] = React.useState('todos');
  const [search, setSearch] = React.useState('');
  const [cargoFiltro, setCargoFiltro] = React.useState('all');

  // Dialog state
  const [createOpen, setCreateOpen] = React.useState(false);
  const [cargosOpen, setCargosOpen] = React.useState(false);

  // Data
  const searchDebounced = useDebounce(search, 500);
  const { usuarios, isLoading, refetch } = useUsuarios({ busca: searchDebounced || undefined });
  const { cargos } = useCargos();

  // ─── Derived state ─────────────────────────────────────────────────────────

  const counts = React.useMemo(() => {
    const total = usuarios.length;
    const ativos = usuarios.filter((u) => u.ativo).length;
    const inativos = total - ativos;
    const comOab = usuarios.filter((u) => Boolean(u.oab)).length;
    return { total, ativos, inativos, comOab };
  }, [usuarios]);

  const filteredUsuarios = React.useMemo(() => {
    let result = usuarios;

    // Filter by active tab
    if (activeTab === 'ativos') {
      result = result.filter((u) => u.ativo);
    } else if (activeTab === 'inativos') {
      result = result.filter((u) => !u.ativo);
    } else if (activeTab === 'com-oab') {
      result = result.filter((u) => Boolean(u.oab));
    }

    // Filter by cargo
    if (cargoFiltro !== 'all') {
      result = result.filter((u) => u.cargo?.id?.toString() === cargoFiltro);
    }

    return result;
  }, [usuarios, activeTab, cargoFiltro]);

  const incompletosCount = React.useMemo(() => {
    return usuarios.filter((u) => {
      if (!u.ativo) return false;
      const { score } = calcularCompleteness(u);
      return score < 70;
    }).length;
  }, [usuarios]);

  const subtitle = `${counts.total} membros · ${counts.ativos} ativos · ${cargos.length} cargos`;

  const cargosOptions = React.useMemo(
    () => cargos.map((c) => ({ value: c.id.toString(), label: c.nome })),
    [cargos],
  );

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleView = React.useCallback(
    (usuario: Usuario) => {
      router.push(`/app/usuarios/${usuario.id}`);
    },
    [router],
  );

  const handleCreateSuccess = React.useCallback(() => {
    refetch();
  }, [refetch]);

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <Heading level="page">Usuários</Heading>
          <p className="text-sm text-muted-foreground/50 mt-0.5">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9"
            onClick={() => setCargosOpen(true)}
          >
            <Settings className="h-4 w-4" />
            Cargos
          </Button>
          <Button
            type="button"
            size="sm"
            className="h-9"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Novo Usuário
          </Button>
        </div>
      </div>

      {/* KPI Strip */}
      {!isLoading && <UserKpiStrip usuarios={usuarios} />}

      {/* Insight Banner */}
      {!isLoading && incompletosCount > 0 && (
        <InsightBanner type="warning">
          {incompletosCount} {incompletosCount === 1 ? 'membro ativo tem' : 'membros ativos têm'} perfil incompleto (abaixo de 70%).
        </InsightBanner>
      )}

      {/* Toolbar */}
      <UsuariosToolbar
        counts={counts}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        search={search}
        onSearchChange={setSearch}
        viewMode={viewMode}
        onViewModeChange={(mode) => setViewMode(mode as UsuariosViewMode)}
        cargoFiltro={cargoFiltro}
        onCargoFiltroChange={setCargoFiltro}
        cargosOptions={cargosOptions}
      />

      {/* Content */}
      {isLoading ? (
        <SkeletonGrid />
      ) : viewMode === 'grid' ? (
        <UsuariosGridView usuarios={filteredUsuarios} onView={handleView} />
      ) : viewMode === 'lista' ? (
        <UsuariosListView usuarios={filteredUsuarios} onView={handleView} />
      ) : (
        <React.Suspense fallback={<SkeletonGrid />}>
          <UsuariosOrgView usuarios={filteredUsuarios} onView={handleView} />
        </React.Suspense>
      )}

      {/* Dialogs */}
      <CargosManagementDialog open={cargosOpen} onOpenChange={setCargosOpen} />
      {createOpen && (
        <UsuarioCreateDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          onSuccess={handleCreateSuccess}
        />
      )}
    </div>
  );
}
