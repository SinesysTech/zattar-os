'use client';

// Componente de diálogo para criar nova obrigação (acordo/condenação)

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Combobox, type ComboboxOption } from '@/components/ui/combobox';
import { Loader2 } from 'lucide-react';

interface NovaObrigacaoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface Processo {
  id: number;
  numero_processo: string;
  polo_ativo_nome: string;
  polo_passivo_nome: string;
  trt: string;
  grau: string;
}

export function NovaObrigacaoDialog({ open, onOpenChange, onSuccess }: NovaObrigacaoDialogProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Estados de dados
  const [processos, setProcessos] = React.useState<Processo[]>([]);
  const [loadingProcessos, setLoadingProcessos] = React.useState(false);

  // Form state
  const [processoId, setProcessoId] = React.useState<string[]>([]);
  const [tipo, setTipo] = React.useState<string>('');
  const [direcao, setDirecao] = React.useState<string>('');
  const [valorTotal, setValorTotal] = React.useState('');
  const [numeroParcelas, setNumeroParcelas] = React.useState('1');
  const [dataVencimentoPrimeiraParcela, setDataVencimentoPrimeiraParcela] = React.useState('');
  const [formaDistribuicao, setFormaDistribuicao] = React.useState('');
  const [observacoes, setObservacoes] = React.useState('');

  // Buscar processos quando o dialog abrir
  React.useEffect(() => {
    if (open && processos.length === 0) {
      buscarProcessos();
    }
  }, [open]);

  const buscarProcessos = async () => {
    setLoadingProcessos(true);
    try {
      const response = await fetch('/api/acervo?limite=2000&ordenar_por=numero_processo&ordem=asc');
      if (!response.ok) throw new Error('Erro ao buscar processos');

      const data = await response.json();
      if (data.success && data.data?.processos) {
        setProcessos(data.data.processos);
      }
    } catch (err) {
      console.error('Erro ao buscar processos:', err);
      setError('Erro ao carregar processos');
    } finally {
      setLoadingProcessos(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validações
    if (processoId.length === 0) {
      setError('Selecione um processo');
      return;
    }

    if (!tipo) {
      setError('Selecione o tipo');
      return;
    }

    if (!direcao) {
      setError('Selecione a direção');
      return;
    }

    if (!valorTotal || parseFloat(valorTotal) <= 0) {
      setError('Valor total deve ser maior que zero');
      return;
    }

    if (!numeroParcelas || parseInt(numeroParcelas) <= 0) {
      setError('Número de parcelas deve ser maior que zero');
      return;
    }

    if (!dataVencimentoPrimeiraParcela) {
      setError('Data de vencimento da primeira parcela é obrigatória');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/acordos-condenacoes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          processoId: parseInt(processoId[0]),
          tipo,
          direcao,
          valorTotal: parseFloat(valorTotal),
          numeroParcelas: parseInt(numeroParcelas),
          dataVencimentoPrimeiraParcela,
          formaDistribuicao: formaDistribuicao || undefined,
          observacoes: observacoes || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar obrigação');
      }

      // Resetar form
      resetForm();
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      console.error('Erro ao criar obrigação:', err);
      setError(err instanceof Error ? err.message : 'Erro ao criar obrigação');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setProcessoId([]);
    setTipo('');
    setDirecao('');
    setValorTotal('');
    setNumeroParcelas('1');
    setDataVencimentoPrimeiraParcela('');
    setFormaDistribuicao('');
    setObservacoes('');
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  // Opções para o combobox de processos
  const processosOptions: ComboboxOption[] = React.useMemo(() => {
    return processos.map((p) => ({
      value: p.id.toString(),
      label: `${p.numero_processo} - ${p.polo_ativo_nome} vs ${p.polo_passivo_nome}`,
      searchText: `${p.numero_processo} ${p.polo_ativo_nome} ${p.polo_passivo_nome}`,
    }));
  }, [processos]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Obrigação</DialogTitle>
          <DialogDescription>
            Adicione uma nova obrigação (acordo, condenação ou custas) ao sistema.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-800 p-3 rounded-md text-sm">
              {error}
            </div>
          )}

          {/* Processo - Combobox com busca */}
          <div className="space-y-2">
            <Label htmlFor="processo">Processo *</Label>
            {loadingProcessos ? (
              <div className="flex items-center gap-2 p-2 border rounded-md">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Carregando processos...</span>
              </div>
            ) : (
              <Combobox
                options={processosOptions}
                value={processoId}
                onValueChange={setProcessoId}
                placeholder="Buscar por número ou nome das partes..."
                searchPlaceholder="Buscar processo..."
                emptyText="Nenhum processo encontrado."
                multiple={false}
              />
            )}
          </div>

          {/* Tipo e Direção */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo *</Label>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger id="tipo">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="acordo">Acordo</SelectItem>
                  <SelectItem value="condenacao">Condenação</SelectItem>
                  <SelectItem value="custas_processuais">Custas Processuais</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="direcao">Direção *</Label>
              <Select value={direcao} onValueChange={setDirecao}>
                <SelectTrigger id="direcao">
                  <SelectValue placeholder="Selecione a direção" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recebimento">Recebimento</SelectItem>
                  <SelectItem value="pagamento">Pagamento</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Valor Total e Número de Parcelas */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="valorTotal">Valor Total (R$) *</Label>
              <Input
                id="valorTotal"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={valorTotal}
                onChange={(e) => setValorTotal(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="numeroParcelas">Número de Parcelas *</Label>
              <Input
                id="numeroParcelas"
                type="number"
                min="1"
                placeholder="1"
                value={numeroParcelas}
                onChange={(e) => setNumeroParcelas(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Data de Vencimento da Primeira Parcela */}
          <div className="space-y-2">
            <Label htmlFor="dataVencimento">Data de Vencimento da Primeira Parcela *</Label>
            <Input
              id="dataVencimento"
              type="date"
              value={dataVencimentoPrimeiraParcela}
              onChange={(e) => setDataVencimentoPrimeiraParcela(e.target.value)}
              required
            />
          </div>

          {/* Forma de Distribuição */}
          <div className="space-y-2">
            <Label htmlFor="formaDistribuicao">Forma de Distribuição</Label>
            <Input
              id="formaDistribuicao"
              type="text"
              placeholder="Ex: 60% para cliente, 40% honorários"
              value={formaDistribuicao}
              onChange={(e) => setFormaDistribuicao(e.target.value)}
            />
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              placeholder="Anotações adicionais sobre a obrigação..."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
