'use client';

/**
 * Página de listagem de partes contrárias transitórias pendentes.
 *
 * Acessada via link do widget do dashboard e via navegação direta.
 * Permite busca por nome e promoção inline via PromoverTransitoriaDialog.
 */

import * as React from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import { PageShell } from '@/components/shared/page-shell';
import { GlassPanel } from '@/components/shared/glass-panel';
import { CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Heading, Text } from '@/components/ui/typography';
import { SearchInput } from '@/components/dashboard/search-input';
import { cn } from '@/lib/utils';
import { PromoverTransitoriaDialog } from '../components/partes-contrarias/promover-transitoria-dialog';
import {
  actionListarTransitoriasPendentes,
  type ParteContrariaTransitoria,
} from '@/shared/partes-contrarias-transitorias';

const PAGE_SIZE = 25;

export function TransitoriasListClient() {
  const [rows, setRows] = React.useState<ParteContrariaTransitoria[]>([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [selectedId, setSelectedId] = React.useState<number | null>(null);
  const [refreshTick, setRefreshTick] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);

    actionListarTransitoriasPendentes({
      limit: PAGE_SIZE,
      offset: 0,
      search: search.trim() || null,
    })
      .then((resp) => {
        if (cancelled) return;
        if (resp.success && resp.data) {
          setRows(resp.data.rows);
          setTotal(resp.data.total);
        } else {
          setRows([]);
          setTotal(0);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [search, refreshTick]);

  const handleCompletar = (id: number) => {
    setSelectedId(id);
    setDialogOpen(true);
  };

  const handleSuccess = () => {
    setRefreshTick((t) => t + 1);
  };

  return (
    <PageShell
      title="Cadastros pendentes"
      description="Partes contrárias que aguardam preenchimento completo para serem vinculadas aos seus contratos."
    >
      <div className={cn(/* design-system-escape: gap-4 → migrar para <Inline gap="default"> */ "flex flex-col gap-4")}>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Buscar por nome..."
          className="w-full max-w-md"
        />

        <GlassPanel>
          <CardHeader>
            <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "flex items-center gap-2")}>
              <span
                aria-hidden="true"
                className="inline-flex size-7 items-center justify-center rounded-lg bg-warning/15 ring-1 ring-warning/30"
              >
                <AlertTriangle className="size-3.5 text-warning" strokeWidth={2.5} />
              </span>
              <Heading level="section">
                {loading
                  ? 'Carregando…'
                  : total === 0
                    ? 'Nenhum cadastro pendente'
                    : total === 1
                      ? '1 cadastro pendente'
                      : `${total} cadastros pendentes`}
              </Heading>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className={cn(/* design-system-escape: space-y-2 → migrar para <Stack gap="tight"> */ "space-y-2")}>
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-14 rounded-xl" />
                ))}
              </div>
            ) : rows.length === 0 ? (
              <div className={cn(/* design-system-escape: py-10 padding direcional sem Inset equiv. */ "flex flex-col items-center justify-center py-10 text-center")}>
                <AlertTriangle
                  aria-hidden="true"
                  className="size-10 text-muted-foreground/65 mb-3"
                />
                <Text variant="caption" className="text-muted-foreground">
                  {search
                    ? 'Nenhum resultado para essa busca.'
                    : 'Tudo em dia — nenhuma parte contrária pendente.'}
                </Text>
              </div>
            ) : (
              <ul className={cn(/* design-system-escape: space-y-1.5 sem token DS */ "space-y-1.5")}>
                {rows.map((t) => (
                  <li
                    key={t.id}
                    className={cn(
                      /* design-system-escape: gap-3 gap sem token DS; px-3 padding direcional sem Inset equiv.; py-2.5 padding direcional sem Inset equiv. */ 'flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5',
                      'transition-colors hover:bg-muted/40'
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <Text variant="label" className="truncate text-foreground">
                        {t.nome}
                      </Text>
                      <div className={cn(/* design-system-escape: gap-3 gap sem token DS */ "mt-0.5 flex items-center gap-3")}>
                        {t.criado_em_contrato_id && (
                          <Text variant="micro-caption" className="text-muted-foreground">
                            <Clock className="inline size-3 -mt-0.5" aria-hidden="true" /> Contrato #
                            {t.criado_em_contrato_id}
                          </Text>
                        )}
                        <Text variant="micro-caption" className="text-muted-foreground">
                          Criado {formatRelative(t.created_at)}
                        </Text>
                        <Text variant="micro-caption" className="text-muted-foreground">
                          via {t.criado_via === 'formulario_publico' ? 'formulário público' : 'painel interno'}
                        </Text>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-xl shrink-0"
                      onClick={() => handleCompletar(t.id)}
                    >
                      Completar cadastro
                    </Button>
                  </li>
                ))}
              </ul>
            )}

            {!loading && total > rows.length && (
              <Text variant="caption" className="mt-4 text-center text-muted-foreground">
                Mostrando {rows.length} de {total}. Refine a busca acima para ver mais.
              </Text>
            )}
          </CardContent>
        </GlassPanel>
      </div>

      <PromoverTransitoriaDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        transitoriaId={selectedId}
        onSuccess={handleSuccess}
      />
    </PageShell>
  );
}

function formatRelative(iso: string): string {
  const now = Date.now();
  const past = new Date(iso).getTime();
  if (Number.isNaN(past)) return '';
  const diffMs = now - past;
  const diffH = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffH < 1) return 'agora há pouco';
  if (diffH < 24) return `há ${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD === 1) return 'ontem';
  if (diffD < 30) return `há ${diffD} dias`;
  const diffMo = Math.floor(diffD / 30);
  return `há ${diffMo} ${diffMo === 1 ? 'mês' : 'meses'}`;
}
