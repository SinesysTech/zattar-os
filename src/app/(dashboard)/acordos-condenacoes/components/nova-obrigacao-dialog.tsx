'use client';

// Componente de diálogo para criar nova obrigação (acordo/condenação)

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormDatePicker } from '@/components/ui/form-date-picker';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
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
import { Loader2, Scale } from 'lucide-react';
import { useAcervo } from '@/app/_lib/hooks/use-acervo';

interface DadosIniciais {
  processo_id: number;
  trt: string;
  grau: string;
  numero_processo: string;
  polo_ativo_nome?: string;
  polo_passivo_nome?: string;
}

interface NovaObrigacaoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  /** Dados iniciais pré-preenchidos (ex: ao criar obrigação a partir de audiência) */
  dadosIniciais?: DadosIniciais;
}

// Opções de TRT (TRT1 a TRT24)
const TRTS = Array.from({ length: 24 }, (_, i) => {
  const num = i + 1;
  return {
    value: `TRT${num}`,
    label: `TRT${num}`,
  };
});

// Opções de Grau
const GRAUS = [
  { value: 'primeiro_grau', label: '1º Grau' },
  { value: 'segundo_grau', label: '2º Grau' },
];

const formatarGrau = (grau: string): string => {
  return grau === 'primeiro_grau' ? '1º Grau' : '2º Grau';
};

export function NovaObrigacaoDialog({ open, onOpenChange, onSuccess, dadosIniciais }: NovaObrigacaoDialogProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Form state
  const [trt, setTrt] = React.useState<string>('');
  const [grau, setGrau] = React.useState<string>('');
  const [processoId, setProcessoId] = React.useState<string[]>([]);
  const [tipo, setTipo] = React.useState<string>('');
  const [direcao, setDirecao] = React.useState<string>('');
  const [valorTotal, setValorTotal] = React.useState('');
  const [numeroParcelas, setNumeroParcelas] = React.useState('1');
  const [dataVencimentoPrimeiraParcela, setDataVencimentoPrimeiraParcela] = React.useState('');
  const [formaPagamentoPadrao, setFormaPagamentoPadrao] = React.useState<string>('');
  const [formaDistribuicao, setFormaDistribuicao] = React.useState<'' | 'integral' | 'dividido'>('');
  const [observacoes, setObservacoes] = React.useState('');

  // Determinar se está no modo com dados iniciais (processo já definido)
  const modoProcessoDefinido = !!dadosIniciais;

  // Estado para busca de processos
  const [buscaProcesso, setBuscaProcesso] = React.useState('');
  const [debouncedBusca, setDebouncedBusca] = React.useState('');

  // Debounce da busca para evitar muitas requisições
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedBusca(buscaProcesso);
    }, 400);
    return () => clearTimeout(timer);
  }, [buscaProcesso]);

  // Buscar processos com hook quando TRT e Grau forem selecionados (apenas no modo manual)
  // Agora só busca se houver termo de busca com pelo menos 3 caracteres
  const shouldFetchProcessos = open && !modoProcessoDefinido && !!trt && !!grau && debouncedBusca.length >= 3;

  // Hook com params fixos para evitar re-renders
  const acervoParams = React.useMemo(() => {
    if (!shouldFetchProcessos) {
      // Retorna params que não fazem requisição real
      return { limite: 1, pagina: 1 };
    }
    return {
      trt,
      grau: grau as 'primeiro_grau' | 'segundo_grau',
      busca: debouncedBusca,
      limite: 50,
      ordenar_por: 'numero_processo' as const,
      ordem: 'asc' as const,
    };
  }, [shouldFetchProcessos, trt, grau, debouncedBusca]);

  const { processos: processosRaw, isLoading: loadingProcessos, error: processoError } = useAcervo(acervoParams);

  // Atualizar erro se houver problema ao buscar processos
  React.useEffect(() => {
    if (processoError && !error) {
      setError(`Erro ao carregar processos: ${processoError}`);
    }
  }, [processoError, error]);

  // Resetar processo e busca quando TRT ou Grau mudarem (apenas no modo manual)
  React.useEffect(() => {
    if (!modoProcessoDefinido) {
      setProcessoId([]);
      setBuscaProcesso('');
      setDebouncedBusca('');
    }
  }, [trt, grau, modoProcessoDefinido]);

  // Resetar form quando fechar
  React.useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validações
    const processoIdFinal = modoProcessoDefinido ? dadosIniciais?.processo_id : (processoId.length > 0 ? parseInt(processoId[0]) : null);

    if (!processoIdFinal) {
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

    if (!formaPagamentoPadrao) {
      setError('Forma de pagamento é obrigatória');
      return;
    }

    if (direcao === 'recebimento' && tipo !== 'custas_processuais' && !formaDistribuicao) {
      setError('Selecione a forma de distribuição');
      return;
    }

    if (tipo === 'custas_processuais' && direcao !== 'pagamento') {
      setError('Custas processuais devem ter direção Pagamento');
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
          processoId: processoIdFinal,
          tipo,
          direcao,
          valorTotal: parseFloat(valorTotal),
          numeroParcelas: parseInt(numeroParcelas),
          dataVencimentoPrimeiraParcela,
          formaPagamentoPadrao,
          formaDistribuicao:
            direcao === 'recebimento' && tipo !== 'custas_processuais' && formaDistribuicao
              ? formaDistribuicao
              : undefined,
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
    setTrt('');
    setGrau('');
    setProcessoId([]);
    setBuscaProcesso('');
    setDebouncedBusca('');
    setTipo('');
    setDirecao('');
    setValorTotal('');
    setNumeroParcelas('1');
    setDataVencimentoPrimeiraParcela('');
    setFormaPagamentoPadrao('');
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
    const processos = shouldFetchProcessos ? processosRaw : [];
    return processos.map((p) => ({
      value: p.id.toString(),
      label: `${p.numero_processo} - ${p.nome_parte_autora || 'Sem nome'} vs ${p.nome_parte_re || 'Sem nome'}`,
      searchText: `${p.numero_processo} ${p.nome_parte_autora || ''} ${p.nome_parte_re || ''}`,
    }));
  }, [processosRaw, shouldFetchProcessos]);

  // Layout quando há dados iniciais (processo já definido)
  if (modoProcessoDefinido && dadosIniciais) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Scale className="h-5 w-5" />
              Nova Obrigação
            </DialogTitle>
            <DialogDescription>
              Adicionar acordo, condenação ou custas ao processo
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 text-red-800 p-3 rounded-md text-sm mb-4">
                {error}
              </div>
            )}

            {/* Header com informações do processo */}
            <div className="bg-muted/50 rounded-lg p-4 mb-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                      {dadosIniciais.trt}
                    </Badge>
                    <Badge variant="outline" className="bg-emerald-100 text-emerald-800 border-emerald-200">
                      {formatarGrau(dadosIniciais.grau)}
                    </Badge>
                  </div>
                  <div className="text-lg font-semibold">{dadosIniciais.numero_processo}</div>
                </div>
                <div className="text-right text-sm">
                  <div className="text-muted-foreground">Parte Autora</div>
                  <div className="font-medium">{dadosIniciais.polo_ativo_nome || '-'}</div>
                  <div className="text-muted-foreground mt-2">Parte Ré</div>
                  <div className="font-medium">{dadosIniciais.polo_passivo_nome || '-'}</div>
                </div>
              </div>
            </div>

            {/* Campos em duas colunas */}
            <div className="grid grid-cols-2 gap-6">
              {/* Coluna esquerda */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="tipo">Tipo *</Label>
                    <Select value={tipo} onValueChange={setTipo}>
                      <SelectTrigger id="tipo">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="acordo">Acordo</SelectItem>
                        <SelectItem value="condenacao">Condenação</SelectItem>
                        <SelectItem value="custas_processuais">Custas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="direcao">Direção *</Label>
                    <Select value={direcao} onValueChange={setDirecao}>
                      <SelectTrigger id="direcao">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="recebimento">Recebimento</SelectItem>
                        <SelectItem value="pagamento">Pagamento</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
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
                    <Label htmlFor="numeroParcelas">Parcelas *</Label>
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

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="dataVencimento">1ª Parcela *</Label>
                    <FormDatePicker id="dataVencimento" value={dataVencimentoPrimeiraParcela || undefined} onChange={(v) => setDataVencimentoPrimeiraParcela(v || '')} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="formaPagamento">Pagamento *</Label>
                    <Select value={formaPagamentoPadrao} onValueChange={setFormaPagamentoPadrao}>
                      <SelectTrigger id="formaPagamento">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="transferencia_direta">Transferência</SelectItem>
                        <SelectItem value="deposito_judicial">Dep. Judicial</SelectItem>
                        <SelectItem value="deposito_recursal">Dep. Recursal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {direcao === 'recebimento' && tipo !== 'custas_processuais' && (
                  <div className="space-y-2">
                    <Label htmlFor="formaDistribuicao">Forma de Distribuição</Label>
                    <Select value={formaDistribuicao} onValueChange={(v) => setFormaDistribuicao(v as typeof formaDistribuicao)}>
                      <SelectTrigger id="formaDistribuicao">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="integral">Integral</SelectItem>
                        <SelectItem value="dividido">Dividido</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {/* Coluna direita */}
              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  placeholder="Anotações adicionais sobre a obrigação..."
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  className="h-[240px] resize-none"
                />
              </div>
            </div>

            <DialogFooter className="mt-6">
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

  // Layout padrão quando não há dados iniciais (seleção manual de processo)
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

          {/* TRT e Grau */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="trt">Tribunal (TRT) *</Label>
              <Select value={trt} onValueChange={setTrt}>
                <SelectTrigger id="trt">
                  <SelectValue placeholder="Selecione o TRT" />
                </SelectTrigger>
                <SelectContent>
                  {TRTS.map((tribunal) => (
                    <SelectItem key={tribunal.value} value={tribunal.value}>
                      {tribunal.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="grau">Grau *</Label>
              <Select value={grau} onValueChange={setGrau}>
                <SelectTrigger id="grau">
                  <SelectValue placeholder="Selecione o grau" />
                </SelectTrigger>
                <SelectContent>
                  {GRAUS.map((g) => (
                    <SelectItem key={g.value} value={g.value}>
                      {g.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Processo - Busca assíncrona + Combobox */}
          <div className="space-y-2">
            <Label htmlFor="processo">Processo *</Label>
            {!trt || !grau ? (
              <div className="flex items-center gap-2 p-2 border rounded-md bg-muted">
                <span className="text-sm text-muted-foreground">Selecione o TRT e Grau primeiro</span>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Campo de busca */}
                <Input
                  placeholder="Digite o número do processo ou nome da parte (mín. 3 caracteres)..."
                  value={buscaProcesso}
                  onChange={(e) => setBuscaProcesso(e.target.value)}
                />

                {/* Feedback de busca */}
                {buscaProcesso.length > 0 && buscaProcesso.length < 3 && (
                  <p className="text-xs text-muted-foreground">Digite pelo menos 3 caracteres para buscar</p>
                )}

                {/* Loading */}
                {loadingProcessos && (
                  <div className="flex items-center gap-2 p-2 border rounded-md">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Buscando processos...</span>
                  </div>
                )}

                {/* Combobox com resultados */}
                {!loadingProcessos && debouncedBusca.length >= 3 && (
                  <Combobox
                    options={processosOptions}
                    value={processoId}
                    onValueChange={setProcessoId}
                    placeholder={processosOptions.length === 0 ? "Nenhum processo encontrado" : "Selecione o processo..."}
                    searchPlaceholder="Filtrar resultados..."
                    emptyText="Nenhum processo encontrado"
                    multiple={false}
                  />
                )}

                {/* Mensagem quando não há busca */}
                {!loadingProcessos && debouncedBusca.length < 3 && processoId.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    Use a busca acima para encontrar o processo pelo número ou nome das partes
                  </p>
                )}

                {/* Processo selecionado */}
                {processoId.length > 0 && (
                  <div className="p-2 border rounded-md bg-green-50 dark:bg-green-950">
                    <span className="text-sm text-green-800 dark:text-green-200">
                      ✓ Processo selecionado: {processosOptions.find(p => p.value === processoId[0])?.label || processoId[0]}
                    </span>
                  </div>
                )}
              </div>
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

          {/* Data de Vencimento e Forma de Pagamento */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dataVencimento">Data Venc. 1ª Parcela *</Label>
              <FormDatePicker id="dataVencimento" value={dataVencimentoPrimeiraParcela || undefined} onChange={(v) => setDataVencimentoPrimeiraParcela(v || '')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="formaPagamento">Forma de Pagamento *</Label>
              <Select value={formaPagamentoPadrao} onValueChange={setFormaPagamentoPadrao}>
                <SelectTrigger id="formaPagamento">
                  <SelectValue placeholder="Selecione a forma" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="transferencia_direta">Transferência Direta</SelectItem>
                  <SelectItem value="deposito_judicial">Depósito Judicial</SelectItem>
                  <SelectItem value="deposito_recursal">Depósito Recursal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {direcao === 'recebimento' && tipo !== 'custas_processuais' && (
            <div className="space-y-2">
              <Label htmlFor="formaDistribuicao">Forma de Distribuição</Label>
              <Select value={formaDistribuicao} onValueChange={(v) => setFormaDistribuicao(v as typeof formaDistribuicao)}>
                <SelectTrigger id="formaDistribuicao">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="integral">Integral</SelectItem>
                  <SelectItem value="dividido">Dividido</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

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
