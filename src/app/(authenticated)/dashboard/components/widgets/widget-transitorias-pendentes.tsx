'use client';

/**
 * Widget do dashboard: contador de partes contrárias transitórias com
 * cadastro pendente, com botão rápido de "Completar" por item.
 *
 * Renderiza nada se não houver pendências (mantém dashboard limpo).
 */

import * as React from 'react';
import Link from 'next/link';
import { AlertTriangle, ArrowRight, Clock } from 'lucide-react';
import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GlassPanel } from '@/components/shared/glass-panel';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/typography';
import { cn } from '@/lib/utils';
import { PromoverTransitoriaDialog } from '@/app/(authenticated)/partes';
import {
  actionListarTransitoriasPendentes,
  type ParteContrariaTransitoria,
} from '@/shared/partes-contrarias-transitorias';

interface WidgetTransitoriasPendentesProps {
  className?: string;
}

export function WidgetTransitoriasPendentes({ className }: WidgetTransitoriasPendentesProps) {
  const [rows, setRows] = React.useState<ParteContrariaTransitoria[]>([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [selectedId, setSelectedId] = React.useState<number | null>(null);
  const [refreshTick, setRefreshTick] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);

    actionListarTransitoriasPendentes({ limit: 5, offset: 0 })
      .then((resp) => {
        if (cancelled) return;
        if (resp.success && resp.data) {
          setRows(resp.data.rows);
          setTotal(resp.data.total);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [refreshTick]);

  const handleCompletar = (id: number) => {
    setSelectedId(id);
    setDialogOpen(true);
  };

  const handleSuccess = () => {
    setRefreshTick((t) => t + 1);
  };

  if (loading) {
    return (
      <GlassPanel className={className}>
        <CardHeader>
          <Skeleton className="h-5 w-56" />
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent className={cn(/* design-system-escape: space-y-2 → migrar para <Stack gap="tight"> */ "space-y-2")}>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-14 rounded-lg" />
          ))}
        </CardContent>
      </GlassPanel>
    );
  }

  // Não renderiza nada se zero pendências — mantém dashboard limpo.
  if (total === 0) return null;

  return (
    <>
      <GlassPanel className={className}>
        <CardHeader>
          <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "flex items-center gap-2")}>
            <span
              aria-hidden="true"
              className="inline-flex size-7 items-center justify-center rounded-lg bg-warning/15 ring-1 ring-warning/30"
            >
              <AlertTriangle className="size-3.5 text-warning" strokeWidth={2.5} />
            </span>
            <CardTitle>Cadastros pendentes</CardTitle>
          </div>
          <CardDescription>
            {total === 1
              ? '1 parte contrária aguardando completar cadastro'
              : `${total} partes contrárias aguardando completar cadastro`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className={cn(/* design-system-escape: space-y-1.5 sem token DS */ "space-y-1.5")}>
            {rows.map((t) => (
              <li
                key={t.id}
                className={cn(
                  /* design-system-escape: gap-3 gap sem token DS; px-3 padding direcional sem Inset equiv.; py-2.5 padding direcional sem Inset equiv. */ 'flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 transition-colors',
                  'hover:bg-muted/40'
                )}
              >
                <div className="min-w-0 flex-1">
                  <Text variant="label" className="truncate text-foreground">
                    {t.nome}
                  </Text>
                  {t.criado_em_contrato_id && (
                    <Text variant="micro-caption" className="mt-0.5 text-muted-foreground">
                      <Clock className="inline size-3 -mt-0.5" aria-hidden="true" /> Contrato #
                      {t.criado_em_contrato_id}
                    </Text>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-xl shrink-0"
                  onClick={() => handleCompletar(t.id)}
                >
                  Completar
                </Button>
              </li>
            ))}
          </ul>

          {total > rows.length && (
            <div className="mt-3 flex justify-end">
              <Button asChild variant="ghost" size="sm" className="rounded-xl">
                <Link href="/partes/transitorias">
                  Ver todas ({total}) <ArrowRight className="ml-1.5 size-3.5" />
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </GlassPanel>

      <PromoverTransitoriaDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        transitoriaId={selectedId}
        onSuccess={handleSuccess}
      />
    </>
  );
}
