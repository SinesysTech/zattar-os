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

interface CapturaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CapturaDialog({ open, onOpenChange }: CapturaDialogProps) {
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
        return <AcervoGeralForm />;
      case 'arquivados':
        return <ArquivadosForm />;
      case 'audiencias':
        return <AudienciasForm />;
      case 'pendentes':
        return <PendentesForm />;
      case 'timeline':
        return <TimelineForm />;
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
