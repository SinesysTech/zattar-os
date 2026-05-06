'use client';

import { cn } from '@/lib/utils';
import * as React from 'react';
import { Users, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppBadge } from '@/components/ui/app-badge';
import { ExpedientesBulkTransferirDialog } from './expedientes-bulk-transferir-dialog';
import { ExpedientesBulkBaixarDialog } from './expedientes-bulk-baixar-dialog';
import type { Expediente } from '../domain';

interface ExpedientesBulkActionsProps {
  selectedRows: Expediente[];
  usuarios: Array<{ id: number; nomeExibicao: string }>;
  onSuccess: () => void;
}

export function ExpedientesBulkActions({
  selectedRows,
  usuarios,
  onSuccess,
}: ExpedientesBulkActionsProps) {
  const [isTransferirOpen, setIsTransferirOpen] = React.useState(false);
  const [isBaixarOpen, setIsBaixarOpen] = React.useState(false);

  const selectedCount = selectedRows.length;

  if (selectedCount === 0) {
    return null;
  }

  return (
    <>
      <div className={cn("flex items-center inline-tight")}>
        <AppBadge variant="secondary" className={cn( "font-medium")}>
          {selectedCount} {selectedCount === 1 ? 'expediente selecionado' : 'expedientes selecionados'}
        </AppBadge>
        <div className={cn("flex items-center inline-tight ml-auto")}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsTransferirOpen(true)}
            className={cn("inline-tight")}
          >
            <Users className="h-4 w-4" />
            Transferir Responsável
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsBaixarOpen(true)}
            className={cn("inline-tight")}
          >
            <CheckCircle2 className="h-4 w-4" />
            Baixar em Massa
          </Button>
        </div>
      </div>

      <ExpedientesBulkTransferirDialog
        open={isTransferirOpen}
        onOpenChange={setIsTransferirOpen}
        selectedExpedientes={selectedRows}
        usuarios={usuarios}
        onSuccess={() => {
          onSuccess();
          setIsTransferirOpen(false);
        }}
      />

      <ExpedientesBulkBaixarDialog
        open={isBaixarOpen}
        onOpenChange={setIsBaixarOpen}
        selectedExpedientes={selectedRows}
        onSuccess={() => {
          onSuccess();
          setIsBaixarOpen(false);
        }}
      />
    </>
  );
}

