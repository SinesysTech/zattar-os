'use client';

import { useState } from 'react';
import { DialogFormShell } from '@/components/shared/dialog-shell';
import { TipoCapturaSelect } from './tipo-captura-select';
import { AcervoGeralForm } from './acervo-geral-form';
import { ArquivadosForm } from './arquivados-form';
import { AudienciasForm } from './audiencias-form';
import { PendentesForm } from './pendentes-form';
import { TimelineForm } from './timeline-form';
import { PartesForm } from './partes-form';
import { CombinadaForm } from './combinada-form';
import { PericiasForm } from './pericias-form';
import type { TipoCaptura } from '@/features/captura/types';

interface CapturaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CapturaDialog({ open, onOpenChange, onSuccess }: CapturaDialogProps) {
  const [tipoCaptura, setTipoCaptura] = useState<TipoCaptura>('acervo_geral');

  // Resetar para tipo padrão quando o dialog é aberto
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setTipoCaptura('acervo_geral');
    }
    onOpenChange(newOpen);
  };

  const renderForm = () => {
    switch (tipoCaptura) {
      case 'acervo_geral':
        return <AcervoGeralForm onSuccess={onSuccess} />;
      case 'arquivados':
        return <ArquivadosForm onSuccess={onSuccess} />;
      case 'audiencias':
        return <AudienciasForm onSuccess={onSuccess} />;
      case 'pendentes':
        return <PendentesForm onSuccess={onSuccess} />;
      case 'pericias':
        return <PericiasForm onSuccess={onSuccess} />;
      case 'timeline':
        return <TimelineForm onSuccess={onSuccess} />;
      case 'partes':
        return <PartesForm onSuccess={onSuccess} />;
      case 'combinada':
        return <CombinadaForm onSuccess={onSuccess} />;
      default:
        return null;
    }
  };

  return (
    <DialogFormShell
      open={open}
      onOpenChange={handleOpenChange}
      title="Nova Captura"
      description="Configure os parâmetros para iniciar uma nova captura no tribunal"
      maxWidth="3xl"
    >
      <div className="space-y-6">
        <div className="border-b pb-4">
          <TipoCapturaSelect value={tipoCaptura} onValueChange={setTipoCaptura} />
        </div>

        {renderForm()}
      </div>
    </DialogFormShell>
  );
}
