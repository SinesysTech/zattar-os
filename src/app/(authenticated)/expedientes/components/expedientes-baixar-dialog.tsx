'use client';

// Componente de diálogo para baixar expediente

import {
  cn } from '@/lib/utils';
import * as React from 'react';
import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { LoadingSpinner } from '@/components/ui/loading-state';
import { Info } from 'lucide-react';
import { toast } from 'sonner';
import { actionBaixarExpediente, type ActionResult } from '../actions';
import { Expediente, ResultadoDecisao, RESULTADO_DECISAO_LABELS } from '../domain';
import { useTiposExpedientes } from '@/app/(authenticated)/tipos-expedientes';

interface ExpedientesBaixarDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expediente: Expediente | null;
  onSuccess: () => void;
}

const initialState: ActionResult = {
  success: false,
  message: '',
  error: '',
};

export function ExpedientesBaixarDialog({
  open,
  onOpenChange,
  expediente,
  onSuccess,
}: ExpedientesBaixarDialogProps) {
  const [modo, setModo] = React.useState<'protocolo' | 'justificativa'>('protocolo');
  const [formState, formAction, isPending] = useActionState(
    actionBaixarExpediente,
    initialState
  );

  const { tiposExpedientes } = useTiposExpedientes({ limite: 1000 }); // Busca os tipos (idealmente já cacheados)

  const currentTipo = React.useMemo(() => {
    return tiposExpedientes.find(t => t.id === expediente?.tipoExpedienteId);
  }, [tiposExpedientes, expediente?.tipoExpedienteId]);

  const requiresDecisao = React.useMemo(() => {
    if (!currentTipo?.tipoExpediente) return false;
    const isTarget = ['recurso ordinário', 'recurso de revista', 'agravo de instrumento em recurso de revista'].includes(
      currentTipo.tipoExpediente.toLowerCase().trim()
    );
    return isTarget;
  }, [currentTipo]);

  React.useEffect(() => {
    if (!open) {
      setModo('protocolo');
    }
  }, [open]);

  React.useEffect(() => {
    if (formState.success) {
      toast.success('Expediente baixado', {
        description: formState.message || 'A baixa foi registrada com sucesso.',
      });
      onSuccess();
      onOpenChange(false);
    }
  }, [formState.success, formState.message, onSuccess, onOpenChange]);

  // Toast para erros do server action (evita duplicar — só anuncia uma vez por mudança)
  const lastErrorRef = React.useRef<string | undefined>(undefined);
  React.useEffect(() => {
    const err = !formState.success ? formState.error : undefined;
    if (err && err !== lastErrorRef.current) {
      lastErrorRef.current = err;
      toast.error('Não foi possível baixar o expediente', { description: err });
    }
    if (formState.success) lastErrorRef.current = undefined;
  }, [formState]);

  if (!expediente) {
    return null;
  }

  // Determine if there's a general error message or a specific field error
  const generalError = !formState.success ? (formState.error || formState.message) : null;
  const protocoloIdError = !formState.success ? formState.errors?.protocoloId?.[0] : undefined;
  const justificativaBaixaError = !formState.success ? formState.errors?.justificativaBaixa?.[0] : undefined;
  const resultadoDecisaoError = !formState.success ? formState.errors?.resultadoDecisao?.[0] : undefined;

  const footerButtons = (
    <Button
      type="submit"
      disabled={isPending}
      form="baixar-expediente-form"
    >
      {isPending && <LoadingSpinner className="mr-2" />}
      Baixar Expediente
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        data-density="comfortable"
        className="sm:max-w-lg  overflow-hidden p-0 gap-0 max-h-[90vh] flex flex-col"
      >
        <DialogHeader className="px-6 py-4 border-b border-border/20 shrink-0">
          <DialogTitle>Baixar Expediente</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-4 [scrollbar-width:thin]">
      <form id="baixar-expediente-form" action={formAction} className={cn(/* design-system-escape: space-y-6 → migrar para <Stack gap="loose"> */ "space-y-6")}>
        {/* Hidden input para o ID do expediente */}
        <input type="hidden" name="expedienteId" value={expediente.id} />

        {/* Informações do expediente */}
        <div className={cn(/* design-system-escape: space-y-2 → migrar para <Stack gap="tight">; p-4 → migrar para <Inset variant="card-compact"> */ "space-y-2 rounded-lg border p-4 bg-muted/50")}>
          <div className={cn(/* design-system-escape: text-sm → migrar para <Text variant="body-sm">; font-medium → className de <Text>/<Heading> */ "text-sm font-medium")}>Expediente</div>
          <div className={cn(/* design-system-escape: text-sm → migrar para <Text variant="body-sm">; space-y-1 sem token DS */ "text-sm space-y-1")}>
            <div>
              <span className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "font-medium")}>Processo:</span> {expediente.numeroProcesso}
            </div>
            <div>
              <span className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "font-medium")}>Parte Autora:</span> {expediente.nomeParteAutora}
            </div>
            <div>
              <span className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "font-medium")}>Parte Ré:</span> {expediente.nomeParteRe}
            </div>
          </div>
        </div>

        {/* Modo de baixa */}
        <div className={cn(/* design-system-escape: space-y-2 → migrar para <Stack gap="tight"> */ "space-y-2")}>
          <Label>Forma de Baixa</Label>
          <div className={cn(/* design-system-escape: gap-4 → migrar para <Inline gap="default"> */ "flex gap-4")}>
            <label className={cn(/* design-system-escape: space-x-2 → migrar para <Inline gap="tight"> */ "flex items-center space-x-2 cursor-pointer")}>
              <input
                type="radio"
                name="modo"
                value="protocolo"
                checked={modo === 'protocolo'}
                onChange={(e) => setModo(e.target.value as 'protocolo')}
                className="h-4 w-4"
              />
              <span className={cn(/* design-system-escape: text-sm → migrar para <Text variant="body-sm"> */ "text-sm")}>Com Protocolo</span>
            </label>
            <label className={cn(/* design-system-escape: space-x-2 → migrar para <Inline gap="tight"> */ "flex items-center space-x-2 cursor-pointer")}>
              <input
                type="radio"
                name="modo"
                value="justificativa"
                checked={modo === 'justificativa'}
                onChange={(e) => setModo(e.target.value as 'justificativa')}
                className="h-4 w-4"
              />
              <span className={cn(/* design-system-escape: text-sm → migrar para <Text variant="body-sm"> */ "text-sm")}>Sem Protocolo</span>
            </label>
          </div>
        </div>

        {/* Campo de protocolo */}
        {modo === 'protocolo' && (
          <div className={cn(/* design-system-escape: space-y-2 → migrar para <Stack gap="tight"> */ "space-y-2")}>
            <Label htmlFor="protocoloId">ID do Protocolo *</Label>
            <Input
              id="protocoloId"
              name="protocoloId"
              type="text"
              placeholder="Ex: ABC12345"
              disabled={isPending}
              required={modo === 'protocolo'}
            />
            {protocoloIdError && (
              <p role="alert" className={cn(/* design-system-escape: text-sm → migrar para <Text variant="body-sm">; font-medium → className de <Text>/<Heading> */ "text-sm font-medium text-destructive")}>{protocoloIdError}</p>
            )}
            <p className={cn(/* design-system-escape: text-xs → migrar para <Text variant="caption"> */ "text-xs text-muted-foreground")}>
              Informe o ID do protocolo da peça protocolada em resposta ao expediente (pode conter números e letras).
            </p>
          </div>
        )}

        {/* Campo de justificativa */}
        {modo === 'justificativa' && (
          <div className={cn(/* design-system-escape: space-y-2 → migrar para <Stack gap="tight"> */ "space-y-2")}>
            <Label htmlFor="justificativaBaixa">Justificativa da Baixa *</Label>
            <textarea
              id="justificativaBaixa"
              name="justificativaBaixa"
              placeholder="Ex: Expediente resolvido extrajudicialmente..."
              disabled={isPending}
              rows={4}
              required={modo === 'justificativa'}
              className={cn(/* design-system-escape: px-3 padding direcional sem Inset equiv.; py-2 padding direcional sem Inset equiv.; text-sm → migrar para <Text variant="body-sm"> */ "flex min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50")}
            />
            {justificativaBaixaError && (
              <p role="alert" className={cn(/* design-system-escape: text-sm → migrar para <Text variant="body-sm">; font-medium → className de <Text>/<Heading> */ "text-sm font-medium text-destructive")}>{justificativaBaixaError}</p>
            )}
            <p className={cn(/* design-system-escape: text-xs → migrar para <Text variant="caption"> */ "text-xs text-muted-foreground")}>
              Informe o motivo pelo qual o expediente está sendo baixado sem protocolo de peça.
            </p>
          </div>
        )}

        {/* Informações da Decisão — obrigatório para tipos recursais */}
        {requiresDecisao && (
          <div className={cn(/* design-system-escape: space-y-3 sem token DS; pt-2 padding direcional sem Inset equiv. */ "space-y-3 pt-2 border-t")}>
            <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight">; pt-3 padding direcional sem Inset equiv.; p-3 → usar <Inset>; text-xs → migrar para <Text variant="caption"> */ "flex items-start gap-2 pt-3 rounded-md bg-muted/40 p-3 text-xs text-muted-foreground")}>
              <Info className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
              <span>
                Este campo é obrigatório porque o tipo atual é{' '}
                <strong className="text-foreground">
                  {currentTipo?.tipoExpediente}
                </strong>{' '}
                — recursos exigem registro do resultado da decisão para auditoria.
              </span>
            </div>
            <Label>Resultado da Decisão *</Label>
            <div className={cn(/* design-system-escape: gap-3 gap sem token DS */ "flex flex-col gap-3")}>
              <label className={cn(/* design-system-escape: space-x-2 → migrar para <Inline gap="tight">; p-3 → usar <Inset> */ "flex items-center space-x-2 cursor-pointer border rounded-md p-3 hover:bg-muted/50 transition-colors")}>
                <input
                  type="radio"
                  name="resultadoDecisao"
                  value={ResultadoDecisao.FAVORAVEL}
                  required
                  className="h-4 w-4"
                />
                <span className={cn(/* design-system-escape: text-sm → migrar para <Text variant="body-sm">; font-medium → className de <Text>/<Heading> */ "text-sm font-medium")}>{RESULTADO_DECISAO_LABELS[ResultadoDecisao.FAVORAVEL]}</span>
              </label>
              <label className={cn(/* design-system-escape: space-x-2 → migrar para <Inline gap="tight">; p-3 → usar <Inset> */ "flex items-center space-x-2 cursor-pointer border rounded-md p-3 hover:bg-muted/50 transition-colors")}>
                <input
                  type="radio"
                  name="resultadoDecisao"
                  value={ResultadoDecisao.PARCIALMENTE_FAVORAVEL}
                  required
                  className="h-4 w-4"
                />
                <span className={cn(/* design-system-escape: text-sm → migrar para <Text variant="body-sm">; font-medium → className de <Text>/<Heading> */ "text-sm font-medium")}>{RESULTADO_DECISAO_LABELS[ResultadoDecisao.PARCIALMENTE_FAVORAVEL]}</span>
              </label>
              <label className={cn(/* design-system-escape: space-x-2 → migrar para <Inline gap="tight">; p-3 → usar <Inset> */ "flex items-center space-x-2 cursor-pointer border rounded-md p-3 hover:bg-muted/50 transition-colors")}>
                <input
                  type="radio"
                  name="resultadoDecisao"
                  value={ResultadoDecisao.DESFAVORAVEL}
                  required
                  className="h-4 w-4"
                />
                <span className={cn(/* design-system-escape: text-sm → migrar para <Text variant="body-sm">; font-medium → className de <Text>/<Heading> */ "text-sm font-medium")}>{RESULTADO_DECISAO_LABELS[ResultadoDecisao.DESFAVORAVEL]}</span>
              </label>
            </div>
            {resultadoDecisaoError && (
              <p role="alert" className={cn(/* design-system-escape: text-sm → migrar para <Text variant="body-sm">; font-medium → className de <Text>/<Heading> */ "text-sm font-medium text-destructive")}>{resultadoDecisaoError}</p>
            )}
          </div>
        )}

        {/* Mensagem de erro */}
        {generalError && (
          <div role="alert" className={cn(/* design-system-escape: p-3 → usar <Inset>; text-sm → migrar para <Text variant="body-sm"> */ "rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive")}>
            {generalError}
          </div>
        )}
      </form>
        </div>
        <div className="px-6 py-4 border-t border-border/20 shrink-0 flex items-center justify-between gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <div className="flex items-center gap-2">
            {footerButtons}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
