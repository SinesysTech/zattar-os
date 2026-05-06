'use client';

/**
 * Prévia da seleção para dialogs de bulk actions (transferir/baixar em massa).
 *
 * Antes, os dialogs mostravam apenas uma contagem ("Baixar 5 expedientes") e o
 * usuário não tinha visibilidade sobre QUAIS expedientes seriam afetados. Se a
 * seleção mudasse entre o clique e o dialog, o usuário aplicava ação em lista
 * errada sem perceber. Este componente exibe número de processo + parte autora
 * em lista scrollável, limitada em altura para não explodir o dialog.
 */

import { cn } from '@/lib/utils';
import type { Expediente } from '../domain';
import { getExpedientePartyNames } from '../domain';
import { Text } from '@/components/ui/typography';

interface BulkSelectionPreviewProps {
  expedientes: Expediente[];
}

export function BulkSelectionPreview({ expedientes }: BulkSelectionPreviewProps) {
  if (expedientes.length === 0) return null;

  return (
    <div className={cn("flex flex-col stack-tight")}>
      <Text variant="caption" className="font-medium uppercase tracking-wide">
        {expedientes.length === 1
          ? 'Expediente afetado'
          : `${expedientes.length} expedientes afetados`}
      </Text>
      <ul
        className="max-h-52 overflow-y-auto rounded-lg border bg-muted/30 divide-y divide-border"
        aria-label="Lista de expedientes selecionados"
      >
        {expedientes.map((expediente) => {
          const partes = getExpedientePartyNames(expediente);
          return (
            <li
              key={expediente.id}
              className={cn("flex items-start justify-between inline-medium px-3 py-2 text-body-sm")}
            >
              <span className={cn( "font-medium text-foreground truncate")}>
                {expediente.numeroProcesso}
              </span>
              <Text variant="caption" className="truncate text-right max-w-[50%]">
                {partes.autora ?? '—'}
              </Text>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
