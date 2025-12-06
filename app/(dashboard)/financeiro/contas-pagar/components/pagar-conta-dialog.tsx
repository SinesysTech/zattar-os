'use client';

/**
 * Dialog para Pagamento de Conta a Pagar
 */

import * as React from 'react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, CreditCard, Building2, AlertCircle } from 'lucide-react';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { pagarConta } from '@/app/_lib/hooks/use-contas-pagar';
import type {
  ContaPagarComDetalhes,
  FormaPagamentoContaPagar,
} from '@/backend/types/financeiro/contas-pagar.types';

interface PagarContaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conta: ContaPagarComDetalhes | null;
  contasBancarias: Array<{ id: number; nome: string; banco?: string | null }>;
  onSuccess: () => void;
}

const FORMAS_PAGAMENTO: Array<{ value: FormaPagamentoContaPagar; label: string }> = [
  { value: 'pix', label: 'PIX' },
  { value: 'transferencia_bancaria', label: 'Transferência Bancária' },
  { value: 'ted', label: 'TED' },
  { value: 'boleto', label: 'Boleto' },
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'cartao_debito', label: 'Cartão de Débito' },
  { value: 'cartao_credito', label: 'Cartão de Crédito' },
  { value: 'deposito_judicial', label: 'Depósito Judicial' },
];

/**
 * Formata valor em reais
 */
const formatarValor = (valor: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
};

export function PagarContaDialog({
  open,
  onOpenChange,
  conta,
  contasBancarias,
  onSuccess,
}: PagarContaDialogProps) {
  const [formaPagamento, setFormaPagamento] = React.useState<FormaPagamentoContaPagar | ''>('');
  const [contaBancariaId, setContaBancariaId] = React.useState<string>('');
  const [dataEfetivacao, setDataEfetivacao] = React.useState<Date | undefined>(new Date());
  const [observacoes, setObservacoes] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Reset form quando dialog abre
  React.useEffect(() => {
    if (open) {
      setFormaPagamento('');
      setContaBancariaId('');
      setDataEfetivacao(new Date());
      setObservacoes('');
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!conta || !formaPagamento || !contaBancariaId) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setIsSubmitting(true);

    try {
      const resultado = await pagarConta(conta.id, {
        formaPagamento,
        contaBancariaId: parseInt(contaBancariaId, 10),
        dataEfetivacao: dataEfetivacao?.toISOString(),
        observacoes: observacoes.trim() || undefined,
      });

      if (!resultado.success) {
        throw new Error(resultado.error || 'Erro ao efetuar pagamento');
      }

      toast.success('Pagamento efetuado com sucesso!');
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao efetuar pagamento';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!conta) {
    return null;
  }

  const isVencida = conta.dataVencimento && new Date(conta.dataVencimento) < new Date();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Efetuar Pagamento
            </DialogTitle>
            <DialogDescription>
              Confirme os dados do pagamento para esta conta a pagar.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Resumo da conta */}
            <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-sm">{conta.descricao}</p>
                  {conta.fornecedor && (
                    <p className="text-xs text-muted-foreground">
                      {conta.fornecedor.nomeFantasia || conta.fornecedor.razaoSocial}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">{formatarValor(conta.valor)}</p>
                  {conta.dataVencimento && (
                    <p className={cn('text-xs', isVencida ? 'text-destructive' : 'text-muted-foreground')}>
                      Venc: {format(new Date(conta.dataVencimento), 'dd/MM/yyyy')}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {isVencida && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Esta conta está vencida. O pagamento será registrado com a data selecionada abaixo.
                </AlertDescription>
              </Alert>
            )}

            <Separator />

            {/* Forma de Pagamento */}
            <div className="space-y-2">
              <Label htmlFor="formaPagamento">
                Forma de Pagamento <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formaPagamento}
                onValueChange={(value) => setFormaPagamento(value as FormaPagamentoContaPagar)}
              >
                <SelectTrigger id="formaPagamento">
                  <SelectValue placeholder="Selecione a forma de pagamento" />
                </SelectTrigger>
                <SelectContent>
                  {FORMAS_PAGAMENTO.map((forma) => (
                    <SelectItem key={forma.value} value={forma.value}>
                      {forma.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Conta Bancária */}
            <div className="space-y-2">
              <Label htmlFor="contaBancaria">
                Conta Bancária <span className="text-destructive">*</span>
              </Label>
              <Select value={contaBancariaId} onValueChange={setContaBancariaId}>
                <SelectTrigger id="contaBancaria">
                  <SelectValue placeholder="Selecione a conta bancária" />
                </SelectTrigger>
                <SelectContent>
                  {contasBancarias.map((cb) => (
                    <SelectItem key={cb.id} value={cb.id.toString()}>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        {cb.nome}
                        {cb.banco && (
                          <span className="text-xs text-muted-foreground">({cb.banco})</span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Data de Efetivação */}
            <div className="space-y-2">
              <Label>Data de Efetivação</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !dataEfetivacao && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dataEfetivacao
                      ? format(dataEfetivacao, 'dd/MM/yyyy', { locale: ptBR })
                      : 'Selecione a data'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dataEfetivacao}
                    onSelect={setDataEfetivacao}
                    disabled={(date) => date > new Date()}
                    initialFocus
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Observações */}
            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                placeholder="Observações sobre o pagamento..."
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                rows={2}
              />
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
            <Button
              type="submit"
              disabled={isSubmitting || !formaPagamento || !contaBancariaId}
            >
              {isSubmitting ? 'Processando...' : 'Confirmar Pagamento'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
