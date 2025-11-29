'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { TipoCapturaSelect, TipoCaptura } from './tipo-captura-select';
import { AcervoGeralForm } from './acervo-geral-form';
import { ArquivadosForm } from './arquivados-form';
import { AudienciasForm } from './audiencias-form';
import { PendentesForm } from './pendentes-form';
import { TimelineForm } from './timeline-form';
import { PartesForm } from './partes-form';

interface CapturaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CapturaDialog({ open, onOpenChange, onSuccess }: CapturaDialogProps) {
  const [tipoCaptura, setTipoCaptura] = useState<TipoCaptura>('acervo-geral');

  // Resetar para tipo padrão quando o dialog é aberto
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setTipoCaptura('acervo-geral');
    }
    onOpenChange(newOpen);
  };

  const renderForm = () => {
    switch (tipoCaptura) {
      case 'acervo-geral':
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
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-5xl lg:max-w-6xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Captura</DialogTitle>
          <DialogDescription>
            Selecione o tipo de captura e preencha os dados necessários para iniciar
            a captura de dados do PJE-TRT.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          <div className="space-y-2">
            <Label htmlFor="tipo-captura">Tipo de Captura</Label>
            <TipoCapturaSelect
              value={tipoCaptura}
              onValueChange={setTipoCaptura}
            />
          </div>

          <div className="border-t pt-6">{renderForm()}</div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
