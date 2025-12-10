'use client';

/**
 * Dialog de criação/edição de Conta a Pagar
 */

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import {
  actionCriarLancamento,
  actionAtualizarLancamento,
} from '../../actions/lancamentos';
import type {
  FormaPagamentoContaPagar,
  FrequenciaRecorrencia,
  ContaPagarComDetalhes,
} from '../../types/lancamentos';

// ============================================================================
// Constants
// ============================================================================

const FORMA_PAGAMENTO_LABELS: Record<string, string> = {
  dinheiro: 'Dinheiro',
  transferencia_bancaria: 'Transferência Bancária',
  ted: 'TED',
  pix: 'PIX',
  boleto: 'Boleto',
  cartao_credito: 'Cartão de Crédito',
  cartao_debito: 'Cartão de Débito',
  cheque: 'Cheque',
  deposito_judicial: 'Depósito Judicial',
};

const FREQUENCIA_LABELS: Record<string, string> = {
  semanal: 'Semanal',
  quinzenal: 'Quinzenal',
  mensal: 'Mensal',
  bimestral: 'Bimestral',
  trimestral: 'Trimestral',
  semestral: 'Semestral',
  anual: 'Anual',
};

const CATEGORIAS_PADRAO = [
  { value: 'aluguel', label: 'Aluguel' },
  { value: 'salarios', label: 'Salários' },
  { value: 'impostos', label: 'Impostos' },
  { value: 'custas_processuais', label: 'Custas Processuais' },
  { value: 'servicos', label: 'Serviços' },
  { value: 'outros', label: 'Outros' },
];

// ============================================================================
// Schema de Validação
// ============================================================================

/**
 * Cria schema de validação dinâmico baseado na disponibilidade de planos de contas
 */
const createContaPagarFormSchema = (hasContasContabeis: boolean) => {
  const baseSchema = z.object({
    descricao: z
      .string()
      .min(1, 'Descrição é obrigatória')
      .max(500, 'Descrição deve ter no máximo 500 caracteres'),
    valor: z
      .number({ invalid_type_error: 'Valor inválido' })
      .positive('Valor deve ser positivo'),
    dataVencimento: z.date({
      required_error: 'Data de vencimento é obrigatória',
    }),
    contaBancariaId: z.number().nullable().optional(),
    contaContabilId: hasContasContabeis
      ? z.number({ required_error: 'Conta contábil é obrigatória' }).min(1, 'Conta contábil é obrigatória')
      : z.number().nullable().optional(),
    centroCustoId: z.number().nullable().optional(),
    clienteId: z.number().nullable().optional(), // Fornecedor
    categoria: z.string().max(100).optional(),
    formaPagamento: z.enum([
      'dinheiro',
      'transferencia_bancaria',
      'ted',
      'pix',
      'boleto',
      'cartao_credito',
      'cartao_debito',
      'cheque',
      'deposito_judicial',
    ]).nullable().optional(),
    recorrente: z.boolean().default(false),
    frequenciaRecorrencia: z.enum([
      'semanal',
      'quinzenal',
      'mensal',
      'bimestral',
      'trimestral',
      'semestral',
      'anual',
    ]).nullable().optional(),
    documento: z.string().max(50).optional(),
    observacoes: z.string().max(2000).optional(),
  });

  return baseSchema;
};

// Schema padrão para tipagem
type ContaPagarFormData = z.infer<ReturnType<typeof createContaPagarFormSchema>>;

// ============================================================================
// Props e Tipos Auxiliares
// ============================================================================

interface ContaBancaria {
  id: number;
  nome: string;
  banco?: string;
}

interface PlanoConta {
  id: number;
  codigo: string;
  nome: string;
}

interface CentroCusto {
  id: number;
  codigo: string;
  nome: string;
}

interface Fornecedor {
  id: number;
  razaoSocial: string;
  nomeFantasia?: string;
}

interface ContaPagarFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conta?: ContaPagarComDetalhes | null;
  contasBancarias: ContaBancaria[];
  planosContas?: PlanoConta[];
  centrosCusto?: CentroCusto[];
  fornecedores?: Fornecedor[];
  onSuccess: () => void;
}

// ============================================================================
// Componente Principal
// ============================================================================

export function ContaPagarFormDialog({
  open,
  onOpenChange,
  conta,
  contasBancarias,
  planosContas = [],
  centrosCusto = [],
  fornecedores = [],
  onSuccess,
}: ContaPagarFormDialogProps) {
  const isEditMode = !!conta;
  const hasContasContabeis = planosContas.length > 0;

  // Criar schema dinâmico baseado na disponibilidade de contas contábeis
  const dynamicSchema = React.useMemo(
    () => createContaPagarFormSchema(hasContasContabeis),
    [hasContasContabeis]
  );

  const form = useForm<ContaPagarFormData>({
    resolver: zodResolver(dynamicSchema),
    defaultValues: {
      descricao: '',
      valor: 0,
      dataVencimento: new Date(),
      contaBancariaId: null,
      contaContabilId: null,
      centroCustoId: null,
      clienteId: null,
      categoria: '',
      formaPagamento: null,
      recorrente: false,
      frequenciaRecorrencia: null,
      documento: '',
      observacoes: '',
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
    reset,
  } = form;

  const recorrente = watch('recorrente');

  // Reset form quando conta ou dialog mudar
  React.useEffect(() => {
    if (open) {
      if (conta) {
        reset({
          descricao: conta.descricao,
          valor: conta.valor,
          dataVencimento: conta.dataVencimento ? new Date(conta.dataVencimento) : new Date(),
          contaBancariaId: conta.contaBancariaId || null,
          contaContabilId: conta.contaContabilId || null,
          centroCustoId: conta.centroCustoId || null,
          clienteId: conta.clienteId || null,
          categoria: conta.categoria || '',
          formaPagamento: conta.formaPagamento || null,
          recorrente: conta.recorrente || false,
          frequenciaRecorrencia: conta.frequenciaRecorrencia || null,
          documento: conta.documento || '',
          observacoes: conta.observacoes || '',
        });
      } else {
        reset({
          descricao: '',
          valor: 0,
          dataVencimento: new Date(),
          contaBancariaId: null,
          contaContabilId: null,
          centroCustoId: null,
          clienteId: null,
          categoria: '',
          formaPagamento: null,
          recorrente: false,
          frequenciaRecorrencia: null,
          documento: '',
          observacoes: '',
        });
      }
    }
  }, [open, conta, reset]);

  const onSubmit = async (data: ContaPagarFormData) => {
    try {
      const payload = {
        ...data,
        tipo: 'despesa' as const,
        dataVencimento: format(data.dataVencimento, 'yyyy-MM-dd'),
        frequenciaRecorrencia: data.recorrente ? data.frequenciaRecorrencia : null,
      };

      let result;

      if (isEditMode && conta) {
        result = await actionAtualizarLancamento(conta.id, payload);
      } else {
        result = await actionCriarLancamento(payload);
      }

      if (!result.sucesso) {
        throw new Error(result.erro);
      }

      toast.success(isEditMode ? 'Conta atualizada com sucesso!' : 'Conta criada com sucesso!');
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao salvar conta';
      toast.error(message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? 'Editar Conta a Pagar' : 'Nova Conta a Pagar'}
            </DialogTitle>
            <DialogDescription>
              {isEditMode
                ? 'Atualize os dados da conta a pagar.'
                : 'Preencha os dados para criar uma nova conta a pagar.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {Object.keys(errors).length > 0 && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                Corrija os erros no formulário antes de continuar.
              </div>
            )}

            {/* Descrição */}
            <div className="space-y-2">
              <Label htmlFor="descricao">
                Descrição <span className="text-destructive">*</span>
              </Label>
              <Input
                id="descricao"
                {...register('descricao')}
                placeholder="Descrição da conta a pagar"
                disabled={isSubmitting}
              />
              {errors.descricao && (
                <p className="text-sm text-destructive">{errors.descricao.message}</p>
              )}
            </div>

            {/* Grid: Valor e Data de Vencimento */}
            <div className="grid grid-cols-2 gap-4">
              {/* Valor */}
              <div className="space-y-2">
                <Label htmlFor="valor">
                  Valor <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="valor"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('valor', {
                    setValueAs: (v) => (v === '' ? 0 : parseFloat(v)),
                  })}
                  placeholder="0,00"
                  disabled={isSubmitting}
                />
                {errors.valor && (
                  <p className="text-sm text-destructive">{errors.valor.message}</p>
                )}
              </div>

              {/* Data de Vencimento */}
              <div className="space-y-2">
                <Label>
                  Data de Vencimento <span className="text-destructive">*</span>
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !watch('dataVencimento') && 'text-muted-foreground'
                      )}
                      disabled={isSubmitting}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {watch('dataVencimento') ? (
                        format(watch('dataVencimento'), 'dd/MM/yyyy', { locale: ptBR })
                      ) : (
                        <span>Selecione...</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={watch('dataVencimento')}
                      onSelect={(date) => date && setValue('dataVencimento', date)}
                      disabled={isSubmitting}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {errors.dataVencimento && (
                  <p className="text-sm text-destructive">{errors.dataVencimento.message}</p>
                )}
              </div>
            </div>

            {/* Grid: Categoria e Forma de Pagamento */}
            <div className="grid grid-cols-2 gap-4">
              {/* Categoria */}
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select
                  value={watch('categoria') || ''}
                  onValueChange={(value) => setValue('categoria', value)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIAS_PADRAO.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Forma de Pagamento */}
              <div className="space-y-2">
                <Label>Forma de Pagamento</Label>
                <Select
                  value={watch('formaPagamento') || ''}
                  onValueChange={(value) =>
                    setValue('formaPagamento', value as FormaPagamentoContaPagar)
                  }
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(FORMA_PAGAMENTO_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Grid: Conta Bancária e Fornecedor */}
            <div className="grid grid-cols-2 gap-4">
              {/* Conta Bancária */}
              <div className="space-y-2">
                <Label>Conta Bancária</Label>
                <Select
                  value={watch('contaBancariaId')?.toString() || ''}
                  onValueChange={(value) =>
                    setValue('contaBancariaId', value ? parseInt(value, 10) : null)
                  }
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {contasBancarias.map((conta) => (
                      <SelectItem key={conta.id} value={conta.id.toString()}>
                        {conta.nome} {conta.banco && `(${conta.banco})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Fornecedor */}
              <div className="space-y-2">
                <Label>Fornecedor</Label>
                <Select
                  value={watch('clienteId')?.toString() || ''}
                  onValueChange={(value) =>
                    setValue('clienteId', value ? parseInt(value, 10) : null)
                  }
                  disabled={isSubmitting || fornecedores.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={fornecedores.length === 0 ? 'Nenhum fornecedor' : 'Selecione...'} />
                  </SelectTrigger>
                  <SelectContent>
                    {fornecedores.map((f) => (
                      <SelectItem key={f.id} value={f.id.toString()}>
                        {f.nomeFantasia || f.razaoSocial}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Grid: Plano de Contas e Centro de Custo */}
            <div className="grid grid-cols-2 gap-4">
              {/* Plano de Contas */}
              <div className="space-y-2">
                <Label>
                  Conta Contábil {hasContasContabeis && <span className="text-destructive">*</span>}
                </Label>
                <Select
                  value={watch('contaContabilId')?.toString() || ''}
                  onValueChange={(value) =>
                    setValue('contaContabilId', value ? parseInt(value, 10) : null)
                  }
                  disabled={isSubmitting || planosContas.length === 0}
                >
                  <SelectTrigger className={errors.contaContabilId ? 'border-destructive' : ''}>
                    <SelectValue placeholder={planosContas.length === 0 ? 'Nenhuma conta' : 'Selecione...'} />
                  </SelectTrigger>
                  <SelectContent>
                    {planosContas.map((pc) => (
                      <SelectItem key={pc.id} value={pc.id.toString()}>
                        {pc.codigo} - {pc.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.contaContabilId && (
                  <p className="text-sm text-destructive">{errors.contaContabilId.message}</p>
                )}
              </div>

              {/* Centro de Custo */}
              <div className="space-y-2">
                <Label>Centro de Custo</Label>
                <Select
                  value={watch('centroCustoId')?.toString() || ''}
                  onValueChange={(value) =>
                    setValue('centroCustoId', value ? parseInt(value, 10) : null)
                  }
                  disabled={isSubmitting || centrosCusto.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={centrosCusto.length === 0 ? 'Nenhum centro' : 'Selecione...'} />
                  </SelectTrigger>
                  <SelectContent>
                    {centrosCusto.map((cc) => (
                      <SelectItem key={cc.id} value={cc.id.toString()}>
                        {cc.codigo} - {cc.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Número do Documento */}
            <div className="space-y-2">
              <Label htmlFor="documento">Número do Documento</Label>
              <Input
                id="documento"
                {...register('documento')}
                placeholder="Ex: NF-001234"
                disabled={isSubmitting}
              />
            </div>

            {/* Recorrência */}
            <div className="space-y-4 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="recorrente" className="text-base font-medium">
                    Conta Recorrente
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Gera contas automaticamente em intervalos regulares
                  </p>
                </div>
                <Switch
                  id="recorrente"
                  checked={watch('recorrente')}
                  onCheckedChange={(checked) => {
                    setValue('recorrente', checked);
                    if (!checked) {
                      setValue('frequenciaRecorrencia', null);
                    }
                  }}
                  disabled={isSubmitting}
                />
              </div>

              {recorrente && (
                <div className="space-y-2">
                  <Label>
                    Frequência <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={watch('frequenciaRecorrencia') || ''}
                    onValueChange={(value) =>
                      setValue('frequenciaRecorrencia', value as FrequenciaRecorrencia)
                    }
                    disabled={isSubmitting}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a frequência..." />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(FREQUENCIA_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.frequenciaRecorrencia && (
                    <p className="text-sm text-destructive">{errors.frequenciaRecorrencia.message}</p>
                  )}
                </div>
              )}
            </div>

            {/* Observações */}
            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                {...register('observacoes')}
                placeholder="Observações adicionais (opcional)"
                disabled={isSubmitting}
                rows={3}
              />
              {errors.observacoes && (
                <p className="text-sm text-destructive">{errors.observacoes.message}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditMode ? 'Salvar Alterações' : 'Criar Conta'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
