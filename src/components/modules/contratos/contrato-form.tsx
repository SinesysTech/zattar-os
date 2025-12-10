'use client';

/**
 * ContratoForm - Formulário de Contrato com Server Actions
 *
 * Componente de formulário que utiliza Server Actions para criar/editar contratos.
 * Implementa validação client-side e integração com useActionState (React 19).
 */

import * as React from 'react';
import { useActionState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormDatePicker } from '@/components/ui/form-date-picker';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Loader2, Check, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { actionCriarContrato, actionAtualizarContrato, type ActionResult } from '@/core/app/actions/contratos';
import type { Contrato, TipoContrato, TipoCobranca, StatusContrato, PoloProcessual } from '@/core/contratos/domain';
import { listarSegmentosAction, Segmento } from '@/core/assinatura-digital';
import {
  TIPO_CONTRATO_LABELS,
  TIPO_COBRANCA_LABELS,
  STATUS_CONTRATO_LABELS,
  POLO_PROCESSUAL_LABELS,
} from '@/core/contratos/domain';

// =============================================================================
// TIPOS E CONSTANTES
// =============================================================================

interface ClienteOption {
  id: number;
  nome: string;
}

interface ContratoFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  contrato?: Contrato;
  mode?: 'create' | 'edit';
  clientesOptions: ClienteOption[];
  partesContrariasOptions: ClienteOption[];
  usuariosOptions?: ClienteOption[];
}

const INITIAL_FORM_STATE = {
  segmentoId: '' as string,
  tipoContrato: '' as TipoContrato | '',
  tipoCobranca: '' as TipoCobranca | '',
  clienteId: '' as string,
  poloCliente: '' as PoloProcessual | '',
  parteContrariaId: '' as string,
  status: 'em_contratacao' as StatusContrato,
  dataContratacao: new Date().toISOString().split('T')[0],
  dataAssinatura: '' as string,
  dataDistribuicao: '' as string,
  dataDesistencia: '' as string,
  responsavelId: '' as string,
  observacoes: '' as string,
};

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export function ContratoForm({
  open,
  onOpenChange,
  onSuccess,
  contrato,
  mode = 'create',
  clientesOptions,
  partesContrariasOptions,
  usuariosOptions = [],
}: ContratoFormProps) {
  const isEditMode = mode === 'edit' && contrato;
  const [formData, setFormData] = React.useState(INITIAL_FORM_STATE);
  const [segments, setSegments] = React.useState<Segmento[]>([]);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string[]>>({});
  const formRef = React.useRef<HTMLFormElement>(null);

  // Server Action com useActionState
  const initialState: ActionResult | null = null;

  const boundAction = React.useCallback(
    async (prevState: ActionResult | null, formData: FormData) => {
      // Convert segmentoId back to number if not empty
      const dataToSubmit = {
        ...formData,
        segmentoId: formData.segmentoId ? Number(formData.segmentoId) : undefined,
      };

      if (isEditMode && contrato) {
        return actionAtualizarContrato(contrato.id, prevState, dataToSubmit);
      }
      return actionCriarContrato(prevState, dataToSubmit);
    },
    [isEditMode, contrato]
  );

  const [state, formAction, isPending] = useActionState(boundAction, initialState);

  // Efeito para tratar resultado da action
  React.useEffect(() => {
    if (state) {
      if (state.success) {
        toast.success(state.message);
        onOpenChange(false);
        onSuccess?.();
      } else {
        toast.error(state.message);
        if (state.errors) {
          setFieldErrors(state.errors);
        }
      }
    }
  }, [state, onOpenChange, onSuccess]);

  // Fetch segments
  React.useEffect(() => {
    async function fetchSegments() {
      const response = await listarSegmentosAction({ escopo: 'global' });
      if (response.success) {
        // Filter segments to include only 'global' or 'contratos'
        setSegments(response.data?.filter(s => s.escopo === 'global' || s.escopo === 'contratos') || []);
      } else {
        toast.error('Erro ao carregar segmentos: ' + response.error);
      }
    }
    fetchSegments();
  }, []);

  // Reset ao fechar ou inicializar com dados do contrato
  React.useEffect(() => {
    if (!open) {
      setFormData(INITIAL_FORM_STATE);
      setFieldErrors({});
    } else if (isEditMode && contrato) {
      setFormData({
        segmentoId: contrato.segmentoId ? String(contrato.segmentoId) : '',
        tipoContrato: contrato.tipoContrato,
        tipoCobranca: contrato.tipoCobranca,
        clienteId: String(contrato.clienteId),
        poloCliente: contrato.poloCliente,
        parteContrariaId: contrato.parteContrariaId ? String(contrato.parteContrariaId) : '',
        status: contrato.status,
        dataContratacao: contrato.dataContratacao || '',
        dataAssinatura: contrato.dataAssinatura || '',
        dataDistribuicao: contrato.dataDistribuicao || '',
        dataDesistencia: contrato.dataDesistencia || '',
        responsavelId: contrato.responsavelId ? String(contrato.responsavelId) : '',
        observacoes: contrato.observacoes || '',
      });
    }
  }, [open, isEditMode, contrato]);

  const handleSubmit = () => {
    // Validação básica client-side
    const errors: Record<string, string[]> = {};

    if (!formData.segmentoId) {
      errors.segmentoId = ['Segmento é obrigatório'];
    }
    if (!formData.tipoContrato) {
      errors.tipoContrato = ['Tipo de contrato é obrigatório'];
    }
    if (!formData.tipoCobranca) {
      errors.tipoCobranca = ['Tipo de cobrança é obrigatório'];
    }
    if (!formData.clienteId) {
      errors.clienteId = ['Cliente é obrigatório'];
    }
    if (!formData.poloCliente) {
      errors.poloCliente = ['Polo do cliente é obrigatório'];
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setFieldErrors({});
    formRef.current?.requestSubmit();
  };

  const getFieldError = (field: string) => fieldErrors[field]?.[0];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg p-0 flex flex-col">
        <SheetHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <SheetTitle>
            {isEditMode ? 'Editar Contrato' : 'Novo Contrato'}
          </SheetTitle>
          <SheetDescription>
            {isEditMode
              ? 'Atualize as informações do contrato'
              : 'Preencha os dados para criar um novo contrato'}
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <form ref={formRef} action={formAction} className="px-6 py-4 space-y-4">
            {/* Segmento */}
            <div className="grid gap-2">
              <Label htmlFor="segmentoId">
                Segmento <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.segmentoId}
                onValueChange={(value) => setFormData(prev => ({ ...prev, segmentoId: value }))}
              >
                <SelectTrigger id="segmentoId" className={cn(getFieldError('segmentoId') && 'border-destructive')}>
                  <SelectValue placeholder="Selecione o segmento..." />
                </SelectTrigger>
                <SelectContent>
                  {segments.map((segmento) => (
                    <SelectItem key={segmento.id} value={String(segmento.id)}>
                      {segmento.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input type="hidden" name="segmentoId" value={formData.segmentoId} />
              {getFieldError('segmentoId') && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {getFieldError('segmentoId')}
                </p>
              )}
            </div>

            {/* Tipo de Contrato */}
            <div className="grid gap-2">
              <Label htmlFor="tipoContrato">
                Tipo de Contrato <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.tipoContrato}
                onValueChange={(value) => setFormData(prev => ({ ...prev, tipoContrato: value as TipoContrato }))}
              >
                <SelectTrigger id="tipoContrato" className={cn(getFieldError('tipoContrato') && 'border-destructive')}>
                  <SelectValue placeholder="Selecione o tipo..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TIPO_CONTRATO_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input type="hidden" name="tipoContrato" value={formData.tipoContrato} />
              {getFieldError('tipoContrato') && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {getFieldError('tipoContrato')}
                </p>
              )}
            </div>

            {/* Tipo de Cobrança */}
            <div className="grid gap-2">
              <Label htmlFor="tipoCobranca">
                Tipo de Cobrança <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.tipoCobranca}
                onValueChange={(value) => setFormData(prev => ({ ...prev, tipoCobranca: value as TipoCobranca }))}
              >
                <SelectTrigger id="tipoCobranca" className={cn(getFieldError('tipoCobranca') && 'border-destructive')}>
                  <SelectValue placeholder="Selecione o tipo..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TIPO_COBRANCA_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input type="hidden" name="tipoCobranca" value={formData.tipoCobranca} />
              {getFieldError('tipoCobranca') && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {getFieldError('tipoCobranca')}
                </p>
              )}
            </div>

            {/* Cliente */}
            <div className="grid gap-2">
              <Label htmlFor="clienteId">
                Cliente <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.clienteId}
                onValueChange={(value) => setFormData(prev => ({ ...prev, clienteId: value }))}
              >
                <SelectTrigger id="clienteId" className={cn(getFieldError('clienteId') && 'border-destructive')}>
                  <SelectValue placeholder="Selecione o cliente..." />
                </SelectTrigger>
                <SelectContent>
                  {clientesOptions.map((cliente) => (
                    <SelectItem key={cliente.id} value={String(cliente.id)}>
                      {cliente.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input type="hidden" name="clienteId" value={formData.clienteId} />
              {getFieldError('clienteId') && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {getFieldError('clienteId')}
                </p>
              )}
            </div>

            {/* Polo do Cliente */}
            <div className="grid gap-2">
              <Label htmlFor="poloCliente">
                Polo do Cliente <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.poloCliente}
                onValueChange={(value) => setFormData(prev => ({ ...prev, poloCliente: value as PoloProcessual }))}
              >
                <SelectTrigger id="poloCliente" className={cn(getFieldError('poloCliente') && 'border-destructive')}>
                  <SelectValue placeholder="Selecione o polo..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(POLO_PROCESSUAL_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input type="hidden" name="poloCliente" value={formData.poloCliente} />
              {getFieldError('poloCliente') && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {getFieldError('poloCliente')}
                </p>
              )}
            </div>

            {/* Parte Contrária */}
            <div className="grid gap-2">
              <Label htmlFor="parteContrariaId">Parte Contrária</Label>
              <Select
                value={formData.parteContrariaId}
                onValueChange={(value) => setFormData(prev => ({ ...prev, parteContrariaId: value }))}
              >
                <SelectTrigger id="parteContrariaId">
                  <SelectValue placeholder="Selecione (opcional)..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhuma</SelectItem>
                  {partesContrariasOptions.map((parte) => (
                    <SelectItem key={parte.id} value={String(parte.id)}>
                      {parte.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input type="hidden" name="parteContrariaId" value={formData.parteContrariaId} />
            </div>

            {/* Status */}
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as StatusContrato }))}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_CONTRATO_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input type="hidden" name="status" value={formData.status} />
            </div>

            {/* Datas */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="dataContratacao">Data Contratação</Label>
                <FormDatePicker
                  id="dataContratacao"
                  value={formData.dataContratacao || undefined}
                  onChange={(v) => setFormData(prev => ({ ...prev, dataContratacao: v || '' }))}
                />
                <input type="hidden" name="dataContratacao" value={formData.dataContratacao} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="dataAssinatura">Data Assinatura</Label>
                <FormDatePicker
                  id="dataAssinatura"
                  value={formData.dataAssinatura || undefined}
                  onChange={(v) => setFormData(prev => ({ ...prev, dataAssinatura: v || '' }))}
                />
                <input type="hidden" name="dataAssinatura" value={formData.dataAssinatura} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="dataDistribuicao">Data Distribuição</Label>
                <FormDatePicker
                  id="dataDistribuicao"
                  value={formData.dataDistribuicao || undefined}
                  onChange={(v) => setFormData(prev => ({ ...prev, dataDistribuicao: v || '' }))}
                />
                <input type="hidden" name="dataDistribuicao" value={formData.dataDistribuicao} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="dataDesistencia">Data Desistência</Label>
                <FormDatePicker
                  id="dataDesistencia"
                  value={formData.dataDesistencia || undefined}
                  onChange={(v) => setFormData(prev => ({ ...prev, dataDesistencia: v || '' }))}
                />
                <input type="hidden" name="dataDesistencia" value={formData.dataDesistencia} />
              </div>
            </div>

            {/* Responsável */}
            {usuariosOptions.length > 0 && (
              <div className="grid gap-2">
                <Label htmlFor="responsavelId">Responsável</Label>
                <Select
                  value={formData.responsavelId}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, responsavelId: value }))}
                >
                  <SelectTrigger id="responsavelId">
                    <SelectValue placeholder="Selecione (opcional)..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhum</SelectItem>
                    {usuariosOptions.map((usuario) => (
                      <SelectItem key={usuario.id} value={String(usuario.id)}>
                        {usuario.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <input type="hidden" name="responsavelId" value={formData.responsavelId} />
              </div>
            )}

            {/* Observações */}
            <div className="grid gap-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                name="observacoes"
                value={formData.observacoes}
                onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                placeholder="Observações adicionais sobre o contrato..."
                rows={3}
              />
            </div>
          </form>
        </ScrollArea>

        <SheetFooter className="px-6 py-4 border-t shrink-0">
          <div className="flex justify-end gap-2 w-full">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isEditMode ? 'Salvando...' : 'Criando...'}
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  {isEditMode ? 'Salvar Alterações' : 'Criar Contrato'}
                </>
              )}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
