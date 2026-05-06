'use client';

/**
 * EspecialidadesPageClient — Gestão do catálogo de especialidades de perícia.
 * ============================================================================
 * `especialidades_pericia` é um catálogo sincronizado do PJE — não criamos/
 * deletamos registros localmente. O admin controla apenas a visibilidade na UI
 * via toggle `ativo/inativo`.
 *
 * Seguindo o padrão de contratos/tipos mas com Server Actions diretas (não
 * API routes), porque os dados são locais ao módulo.
 * ============================================================================
 */

import { cn } from '@/lib/utils';
import * as React from 'react';
import { ArrowLeft, Search } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

import { GlassPanel } from '@/components/shared/glass-panel';
import { AppBadge } from '@/components/ui/app-badge';
import { Button } from '@/components/ui/button';
import { Heading, Text } from '@/components/ui/typography';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';

import {
  actionAlterarAtivoEspecialidade,
  actionListarTodasEspecialidadesPericia,
} from '../actions';

// =============================================================================
// TIPOS
// =============================================================================

interface EspecialidadeRow {
  id: number;
  descricao: string;
  trt: string;
  grau: string;
  ativo: boolean;
  updatedAt: string;
}

// =============================================================================
// COMPONENTE
// =============================================================================

export function EspecialidadesPageClient() {
  const [items, setItems] = React.useState<EspecialidadeRow[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState('');
  const [togglingId, setTogglingId] = React.useState<number | null>(null);

  const buscar = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await actionListarTodasEspecialidadesPericia();
      if (!result.success) {
        throw new Error(result.message);
      }
      const payload = result.data as { especialidades: EspecialidadeRow[] };
      setItems(payload.especialidades);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar');
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void buscar();
  }, [buscar]);

  const handleToggle = React.useCallback(
    async (item: EspecialidadeRow) => {
      setTogglingId(item.id);
      try {
        const fd = new FormData();
        fd.append('id', String(item.id));
        fd.append('ativo', String(!item.ativo));
        const result = await actionAlterarAtivoEspecialidade(fd);
        if (!result.success) throw new Error(result.message);

        // Otimista: atualiza localmente sem refetch completo
        setItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, ativo: !i.ativo } : i)),
        );
        toast.success(result.message);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Erro ao atualizar');
      } finally {
        setTogglingId(null);
      }
    },
    [],
  );

  const filtered = React.useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter(
      (i) =>
        i.descricao.toLowerCase().includes(q) ||
        i.trt.toLowerCase().includes(q),
    );
  }, [items, search]);

  const total = items.length;
  const ativas = items.filter((i) => i.ativo).length;

  // Agrupa por TRT para facilitar a leitura do catálogo
  const grouped = React.useMemo(() => {
    const map = new Map<string, EspecialidadeRow[]>();
    for (const item of filtered) {
      const key = item.trt;
      const list = map.get(key) ?? [];
      list.push(item);
      map.set(key, list);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  return (
    <div className={cn(/* design-system-escape: space-y-5 sem token DS */ "space-y-5")}>
      {/* ── Header ──────────────────────────────────────────── */}
      <div className={cn(/* design-system-escape: gap-4 → migrar para <Inline gap="default"> */ "flex items-end justify-between gap-4")}>
        <div>
          <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "flex items-center gap-2 mb-1")}>
            <Button
              asChild
              variant="ghost"
              size="sm"
              className={cn(/* design-system-escape: px-2 padding direcional sem Inset equiv. */ "h-7 px-2 text-muted-foreground/70")}
            >
              <Link href="/pericias">
                <ArrowLeft className="size-3.5" />
                Perícias
              </Link>
            </Button>
          </div>
          <Heading level="page">Especialidades</Heading>
          {!isLoading && (
            <p className={cn("text-body-sm text-muted-foreground/70 mt-0.5")}>
              {ativas} ativa{ativas !== 1 ? 's' : ''} · {total} no catálogo ·
              sincronizado do PJE
            </p>
          )}
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/50 pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar descrição ou TRT..."
            className={cn(/* design-system-escape: pl-8 padding direcional sem Inset equiv. */ "h-9 w-72 pl-8 bg-card")}
          />
        </div>
      </div>

      {/* ── Lista agrupada por TRT ─────────────────────────── */}
      {isLoading ? (
        <div className={cn(/* design-system-escape: space-y-3 sem token DS */ "space-y-3")}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
      ) : error ? (
        <GlassPanel depth={1} className={cn(/* design-system-escape: p-12 → usar <Inset> */ "p-12 text-center")}>
          <p className={cn("text-body-sm text-destructive")}>{error}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => void buscar()}
          >
            Tentar novamente
          </Button>
        </GlassPanel>
      ) : filtered.length === 0 ? (
        <GlassPanel depth={1} className={cn(/* design-system-escape: p-12 → usar <Inset> */ "p-12 text-center")}>
          <p className={cn("text-body-sm text-muted-foreground")}>
            {search
              ? 'Nenhuma especialidade encontrada para esta busca.'
              : 'Nenhuma especialidade no catálogo.'}
          </p>
        </GlassPanel>
      ) : (
        <div className={cn(/* design-system-escape: space-y-4 → migrar para <Stack gap="default"> */ "space-y-4")}>
          {grouped.map(([trt, rows]) => (
            <GlassPanel key={trt} depth={1} className="overflow-hidden">
              <div className={cn(/* design-system-escape: px-4 padding direcional sem Inset equiv.; py-2.5 padding direcional sem Inset equiv. */ "flex items-center justify-between px-4 py-2.5 border-b border-border/30 bg-muted/20")}>
                <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "flex items-center gap-2")}>
                  <span className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading>; tracking-wider sem token DS */ "text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60")}>
                    Tribunal
                  </span>
                  <AppBadge variant="outline">{trt}</AppBadge>
                </div>
                <span className="text-[10px] tabular-nums text-muted-foreground/60">
                  {rows.filter((r) => r.ativo).length} / {rows.length} ativa
                  {rows.length !== 1 ? 's' : ''}
                </span>
              </div>

              <div
                role="table"
                aria-label={`Especialidades do tribunal ${trt}`}
                className="divide-y divide-border/20"
              >
                <div
                  role="row"
                  className={cn(/* design-system-escape: gap-4 → migrar para <Inline gap="default">; px-4 padding direcional sem Inset equiv.; py-2 padding direcional sem Inset equiv.; tracking-wider sem token DS */ "grid grid-cols-[1fr_100px_120px_100px] gap-4 px-4 py-2 text-[10px] uppercase tracking-wider text-muted-foreground/60")}
                >
                  <span>Descrição</span>
                  <span>Grau</span>
                  <span>Status</span>
                  <span className="text-right">Visível</span>
                </div>
                {rows.map((item) => (
                  <div
                    key={item.id}
                    role="row"
                    className={cn(/* design-system-escape: gap-4 → migrar para <Inline gap="default">; px-4 padding direcional sem Inset equiv.; py-2.5 padding direcional sem Inset equiv. */ "grid grid-cols-[1fr_100px_120px_100px] gap-4 items-center px-4 py-2.5 hover:bg-muted/20 transition-colors")}
                  >
                    <span className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "text-body-sm font-medium text-foreground/90 truncate")}>
                      {item.descricao}
                    </span>
                    <Text variant="caption">
                      {item.grau === 'primeiro_grau' ? '1º Grau' : '2º Grau'}
                    </Text>
                    <span>
                      <AppBadge
                        variant={item.ativo ? 'success' : 'secondary'}
                      >
                        {item.ativo ? 'Ativa' : 'Oculta'}
                      </AppBadge>
                    </span>
                    <div className="flex justify-end">
                      <Switch
                        checked={item.ativo}
                        disabled={togglingId === item.id}
                        onCheckedChange={() => void handleToggle(item)}
                        aria-label={`${item.ativo ? 'Ocultar' : 'Mostrar'} ${item.descricao}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </GlassPanel>
          ))}
        </div>
      )}
    </div>
  );
}
