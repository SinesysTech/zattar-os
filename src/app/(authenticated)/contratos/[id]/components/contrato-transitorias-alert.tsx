'use client';

/**
 * Banner de alerta quando o contrato tem partes contrárias transitórias
 * (cadastro pendente). Renderiza nada se não houver transitórias.
 *
 * Ao clicar no CTA, abre o PromoverTransitoriaDialog para o usuário
 * completar os dados e vincular a uma parte_contraria definitiva
 * (criar ou merge com existente).
 */

import * as React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Heading, Text } from '@/components/ui/typography';
import { cn } from '@/lib/utils';
import { PromoverTransitoriaDialog } from '@/app/(authenticated)/partes';
import {
  actionListarTransitoriasPorContrato,
  type ParteContrariaTransitoria,
} from '@/shared/partes-contrarias-transitorias';

interface ContratoTransitoriasAlertProps {
  contratoId: number;
  /** Chamado após promoção bem-sucedida para o parent dar refresh. */
  onTransitoriaPromoted?: () => void;
  className?: string;
}

export function ContratoTransitoriasAlert({
  contratoId,
  onTransitoriaPromoted,
  className,
}: ContratoTransitoriasAlertProps) {
  const [transitorias, setTransitorias] = React.useState<ParteContrariaTransitoria[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [transitoriaSelecionadaId, setTransitoriaSelecionadaId] = React.useState<number | null>(null);
  const [refreshTick, setRefreshTick] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    actionListarTransitoriasPorContrato({ contratoId })
      .then((resp) => {
        if (cancelled) return;
        if (resp.success && resp.data) {
          setTransitorias(resp.data);
        } else {
          setTransitorias([]);
        }
      })
      .catch(() => {
        if (!cancelled) setTransitorias([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [contratoId, refreshTick]);

  const handleCompletar = (id: number) => {
    setTransitoriaSelecionadaId(id);
    setDialogOpen(true);
  };

  const handleSuccess = () => {
    setRefreshTick((t) => t + 1);
    onTransitoriaPromoted?.();
  };

  if (isLoading || transitorias.length === 0) return null;

  const isPlural = transitorias.length > 1;

  return (
    <>
      <div
        role="alert"
        aria-live="polite"
        className={cn(
          /* design-system-escape: gap-3 gap sem token DS */ 'flex flex-col gap-3 rounded-2xl bg-warning/8 inset-card-compact ring-1 ring-warning/25',
          /* design-system-escape: sm:gap-4 sem equivalente DS */ 'sm:flex-row sm:items-start sm:gap-4',
          className
        )}
      >
        <span
          aria-hidden="true"
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-warning/15 ring-1 ring-warning/30"
        >
          <AlertTriangle className="size-4 text-warning" strokeWidth={2.5} />
        </span>

        <div className={cn(/* design-system-escape: space-y-1.5 sem token DS */ "min-w-0 flex-1 space-y-1.5")}>
          <Heading level="card" className="text-warning">
            {isPlural
              ? `${transitorias.length} partes contrárias com cadastro pendente`
              : 'Parte contrária com cadastro pendente'}
          </Heading>
          <Text variant="caption" className="text-muted-foreground">
            {isPlural
              ? 'Essas partes foram criadas no formulário público com apenas o nome. Complete o cadastro para continuar o fluxo do contrato.'
              : 'Essa parte foi criada no formulário público com apenas o nome. Complete o cadastro para continuar o fluxo do contrato.'}
          </Text>

          <ul className={cn(/* design-system-escape: space-y-1 sem token DS */ "mt-2 space-y-1")}>
            {transitorias.map((t) => (
              <li
                key={t.id}
                className={cn(/* design-system-escape: gap-3 gap sem token DS; px-3 padding direcional sem Inset equiv.; py-2 padding direcional sem Inset equiv. */ "flex items-center justify-between gap-3 rounded-xl bg-surface-container-low/60 px-3 py-2 ring-1 ring-outline-variant/20")}
              >
                <Text variant="label" className="truncate text-foreground">
                  {t.nome}
                </Text>
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
        </div>
      </div>

      <PromoverTransitoriaDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        transitoriaId={transitoriaSelecionadaId}
        onSuccess={handleSuccess}
      />
    </>
  );
}
