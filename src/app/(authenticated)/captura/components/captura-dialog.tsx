'use client';

import { cn } from '@/lib/utils';
import { useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { TipoCapturaSelect } from './tipo-captura-select';
import { AcervoGeralForm } from './acervo-geral-form';
import { ArquivadosForm } from './arquivados-form';
import { AudienciasForm } from './audiencias-form';
import { PendentesForm } from './pendentes-form';
import { TimelineForm } from './timeline-form';
import { PartesForm } from './partes-form';
import { CombinadaForm } from './combinada-form';
import { PericiasForm } from './pericias-form';
import type { CapturaFormHandle } from '@/app/(authenticated)/captura/types';

import { LoadingSpinner } from "@/components/ui/loading-state"
interface CapturaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

/** Tipos de captura selecionáveis no dialog */
type TipoCapturaDialog =
  | 'acervo_geral'
  | 'arquivados'
  | 'audiencias'
  | 'pendentes'
  | 'pericias'
  | 'timeline'
  | 'partes'
  | 'combinada';

/** Mapa de labels para o botão de submit baseado no tipo de captura */
const SUBMIT_LABELS: Record<TipoCapturaDialog, string> = {
  acervo_geral: 'Iniciar Captura de Acervo Geral',
  arquivados: 'Iniciar Captura de Arquivados',
  audiencias: 'Iniciar Captura de Audiências',
  pendentes: 'Iniciar Captura de Expedientes',
  pericias: 'Iniciar Captura de Perícias',
  timeline: 'Iniciar Captura de Timeline',
  partes: 'Iniciar Captura de Partes',
  combinada: 'Iniciar Captura Unificada',
};

export function CapturaDialog({ open, onOpenChange, onSuccess }: CapturaDialogProps) {
  const [tipoCaptura, setTipoCaptura] = useState<TipoCapturaDialog>('acervo_geral');
  const [isLoading, setIsLoading] = useState(false);
  const formRef = useRef<CapturaFormHandle>(null);

  // Resetar para tipo padrão quando o dialog é aberto
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setTipoCaptura('acervo_geral');
      setIsLoading(false);
    }
    onOpenChange(newOpen);
  };

  // Handler para atualizar estado de loading do form
  const handleLoadingChange = (loading: boolean) => {
    setIsLoading(loading);
  };

  // Handler para submit via footer button
  const handleSubmit = () => {
    formRef.current?.submit();
  };

  const renderForm = () => {
    const commonProps = {
      ref: formRef,
      onSuccess,
      onLoadingChange: handleLoadingChange,
    };

    switch (tipoCaptura) {
      case 'acervo_geral':
        return <AcervoGeralForm {...commonProps} />;
      case 'arquivados':
        return <ArquivadosForm {...commonProps} />;
      case 'audiencias':
        return <AudienciasForm {...commonProps} />;
      case 'pendentes':
        return <PendentesForm {...commonProps} />;
      case 'pericias':
        return <PericiasForm {...commonProps} />;
      case 'timeline':
        return <TimelineForm {...commonProps} />;
      case 'partes':
        return <PartesForm {...commonProps} />;
      case 'combinada':
        return <CombinadaForm {...commonProps} />;
      default:
        return null;
    }
  };

  // Obter label dinâmico do tipo selecionado
  const submitLabel = SUBMIT_LABELS[tipoCaptura];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-3xl glass-dialog overflow-hidden p-0 gap-0 max-h-[90vh] flex flex-col"
      >
        <DialogHeader className="px-6 py-4 border-b border-border/20 shrink-0">
          <DialogTitle>Nova Captura</DialogTitle>
        </DialogHeader>
        <DialogBody>
      <div className={cn(/* design-system-escape: space-y-6 → migrar para <Stack gap="loose"> */ "space-y-6")}>
        <TipoCapturaSelect
          value={tipoCaptura}
          onValueChange={(value) => setTipoCaptura(value as TipoCapturaDialog)}
          disabled={isLoading}
        />

        {renderForm()}
      </div>
        </DialogBody>
        <div className="px-6 py-4 border-t border-border/20 shrink-0 flex items-center justify-between gap-2">
          <Button variant="outline" onClick={() => handleOpenChange(false)}>Cancelar</Button>
          <div className="flex items-center gap-2">
            <Button onClick={handleSubmit} disabled={isLoading}>
              {isLoading && <LoadingSpinner className="mr-2" />}
              {submitLabel}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
