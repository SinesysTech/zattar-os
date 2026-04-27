'use client';

// Componente de diálogo para reverter baixa de expediente

import { cn } from '@/lib/utils';
import * as React from 'react';
import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle} from 'lucide-react';
import { toast } from 'sonner';
import { actionReverterBaixa, type ActionResult } from '../actions';
import { Expediente } from '../domain';
import { DialogFormShell } from '@/components/shared/dialog-shell';


import { LoadingSpinner } from "@/components/ui/loading-state"

const PALAVRA_CONFIRMACAO = 'REVERTER';
interface ExpedientesReverterBaixaDialogProps {
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

export function ExpedientesReverterBaixaDialog({
  open,
  onOpenChange,
  expediente,
  onSuccess,
}: ExpedientesReverterBaixaDialogProps) {
  // Usar key para resetar o formulário quando o diálogo fechar
  const [formKey, setFormKey] = React.useState(0);
  const [textoConfirmacao, setTextoConfirmacao] = React.useState('');

  const [formState, formAction, isPending] = useActionState(
    actionReverterBaixa.bind(null, expediente?.id || 0),
    initialState
  );

  // Resetar estado quando fechar
  React.useEffect(() => {
    if (!open) {
      setFormKey((prev) => prev + 1);
      setTextoConfirmacao('');
    }
  }, [open]);

  const confirmacaoValida =
    textoConfirmacao.trim().toUpperCase() === PALAVRA_CONFIRMACAO;

  // Chamar onSuccess quando a ação for bem-sucedida
  React.useEffect(() => {
    if (formState.success) {
      toast.success('Baixa revertida', {
        description: formState.message || 'O expediente voltou para a lista de pendentes.',
      });
      onSuccess();
      onOpenChange(false);
    }
  }, [formState.success, formState.message, onSuccess, onOpenChange]);

  // Toast para erros
  const lastErrorRef = React.useRef<string | undefined>(undefined);
  React.useEffect(() => {
    const err = !formState.success ? formState.error : undefined;
    if (err && err !== lastErrorRef.current) {
      lastErrorRef.current = err;
      toast.error('Não foi possível reverter a baixa', { description: err });
    }
    if (formState.success) lastErrorRef.current = undefined;
  }, [formState]);

  if (!expediente) {
    return null;
  }

  const generalError = !formState.success ? (formState.error || formState.message) : null;

  const footerButtons = (
    <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "flex w-full items-center justify-end gap-2")}>
      <Button
        type="button"
        variant="outline"
        onClick={() => onOpenChange(false)}
        disabled={isPending}
      >
        Cancelar
      </Button>
      <Button
        type="submit"
        variant="destructive"
        disabled={isPending || !confirmacaoValida}
        form="reverter-baixa-form"
        title={!confirmacaoValida ? `Digite ${PALAVRA_CONFIRMACAO} para habilitar` : undefined}
      >
        {isPending && <LoadingSpinner className="mr-2" />}
        Reverter Baixa
      </Button>
    </div>
  );

  return (
    <DialogFormShell
      open={open}
      onOpenChange={onOpenChange}
      title="Reverter Baixa de Expediente"
      maxWidth="lg"
      footer={footerButtons}
    >
      <form id="reverter-baixa-form" key={formKey} action={formAction} className={cn(/* design-system-escape: space-y-6 → migrar para <Stack gap="loose"> */ "space-y-6")}>
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
            {expediente.baixadoEm && (
              <div>
                <span className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "font-medium")}>Baixado em:</span>{' '}
                {new Date(expediente.baixadoEm).toLocaleString('pt-BR')}
              </div>
            )}
            {expediente.protocoloId && (
              <div>
                <span className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "font-medium")}>Protocolo:</span> {expediente.protocoloId}
              </div>
            )}
            {expediente.justificativaBaixa && (
              <div>
                <span className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "font-medium")}>Justificativa:</span>{' '}
                {expediente.justificativaBaixa}
              </div>
            )}
          </div>
        </div>

        {/* Aviso */}
        <div className={cn(/* design-system-escape: gap-3 gap sem token DS; p-4 → migrar para <Inset variant="card-compact"> */ "flex items-start gap-3 rounded-lg border border-warning bg-warning/10 p-4")}>
          <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
          <div className={cn(/* design-system-escape: text-sm → migrar para <Text variant="body-sm"> */ "text-sm")}>
            <div className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "font-medium text-warning mb-1")}>Atenção</div>
            <div className="text-muted-foreground">
              Ao reverter a baixa, o expediente voltará a aparecer na lista de pendentes.
              Os dados de protocolo e justificativa serão removidos, mas a ação será registrada
              nos logs do sistema.
            </div>
          </div>
        </div>

        {/* Confirmação textual — previne reversão acidental */}
        <div className={cn(/* design-system-escape: space-y-2 → migrar para <Stack gap="tight"> */ "space-y-2")}>
          <Label htmlFor="reverter-confirmacao" className={cn(/* design-system-escape: text-sm → migrar para <Text variant="body-sm"> */ "text-sm")}>
            Para confirmar, digite{' '}
            <span className={cn(/* design-system-escape: font-semibold → className de <Text>/<Heading> */ "font-semibold text-foreground")}>{PALAVRA_CONFIRMACAO}</span> abaixo
          </Label>
          <Input
            id="reverter-confirmacao"
            type="text"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            value={textoConfirmacao}
            onChange={(event) => setTextoConfirmacao(event.target.value)}
            disabled={isPending}
            aria-invalid={textoConfirmacao.length > 0 && !confirmacaoValida}
            aria-describedby="reverter-confirmacao-hint"
            placeholder={PALAVRA_CONFIRMACAO}
          />
          <p id="reverter-confirmacao-hint" className={cn(/* design-system-escape: text-xs → migrar para <Text variant="caption"> */ "text-xs text-muted-foreground")}>
            Case-insensitive. A ação só será habilitada após a confirmação exata.
          </p>
        </div>

        {/* Mensagem de erro */}
        {generalError && (
          <div role="alert" className={cn(/* design-system-escape: p-3 → usar <Inset>; text-sm → migrar para <Text variant="body-sm"> */ "rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive")}>
            {generalError}
          </div>
        )}
      </form>
    </DialogFormShell>
  );
}
