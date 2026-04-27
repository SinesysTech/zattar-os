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

interface BulkSelectionPreviewProps {
  expedientes: Expediente[];
}

export function BulkSelectionPreview({ expedientes }: BulkSelectionPreviewProps) {
  if (expedientes.length === 0) return null;

  return (
    <div className={cn(/* design-system-escape: space-y-2 → migrar para <Stack gap="tight"> */ "space-y-2")}>
      <p className={cn(/* design-system-escape: text-xs → migrar para <Text variant="caption">; font-medium → className de <Text>/<Heading>; tracking-wide sem token DS */ "text-xs font-medium text-muted-foreground uppercase tracking-wide")}>
        {expedientes.length === 1
          ? 'Expediente afetado'
          : `${expedientes.length} expedientes afetados`}
      </p>
      <ul
        className="max-h-52 overflow-y-auto rounded-lg border bg-muted/30 divide-y divide-border"
        aria-label="Lista de expedientes selecionados"
      >
        {expedientes.map((expediente) => {
          const partes = getExpedientePartyNames(expediente);
          return (
            <li
              key={expediente.id}
              className={cn(/* design-system-escape: gap-3 gap sem token DS; px-3 padding direcional sem Inset equiv.; py-2 padding direcional sem Inset equiv.; text-sm → migrar para <Text variant="body-sm"> */ "flex items-start justify-between gap-3 px-3 py-2 text-sm")}
            >
              <span className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "font-medium text-foreground truncate")}>
                {expediente.numeroProcesso}
              </span>
              <span className={cn(/* design-system-escape: text-xs → migrar para <Text variant="caption"> */ "text-xs text-muted-foreground truncate text-right max-w-[50%]")}>
                {partes.autora ?? '—'}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
