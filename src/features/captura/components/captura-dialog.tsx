'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TipoCapturaSelect } from './tipo-captura-select';
import { AcervoGeralForm } from './acervo-geral-form';
import { ArquivadosForm } from './arquivados-form';
import { AudienciasForm } from './audiencias-form';
import { PendentesForm } from './pendentes-form';
import { TimelineForm } from './timeline-form';
import { PartesForm } from './partes-form';
import { CombinadaForm } from './combinada-form';
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
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>Nova Captura</DialogTitle>
          <DialogDescription>
            Configure os parâmetros para iniciar uma nova captura no tribunal
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 flex flex-col">
          <div className="px-6 py-2 border-b">
            <TipoCapturaSelect value={tipoCaptura} onValueChange={setTipoCaptura} />
          </div>

          <ScrollArea className="flex-1 p-6">
            <div className="pb-6">
              {renderForm()}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
