'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, XCircle } from 'lucide-react';

interface AcordoCondenacaoData {
  id: number;
  tipo: 'acordo' | 'condenacao' | 'custas_processuais';
  direcao: 'recebimento' | 'pagamento';
  valorTotal: number;
  dataVencimentoPrimeiraParcela: string;
  numeroParcelas: number;
  formaDistribuicao?: string | null;
  percentualEscritorio?: number;
  honorariosSucumbenciaisTotal?: number;
}

interface AcordoCondenacaoFormProps {
  processoId?: number;
  acordoId?: number; // Para modo de edição
  initialData?: {
    tipo: 'acordo' | 'condenacao' | 'custas_processuais';
    direcao: 'recebimento' | 'pagamento';
    valorTotal: number;
    dataVencimentoPrimeiraParcela: string;
    numeroParcelas: number;
    formaDistribuicao?: string | null;
    percentualEscritorio?: number;
    honorariosSucumbenciaisTotal?: number;
  };
  onSuccess?: (data: AcordoCondenacaoData) => void;
  onCancel?: () => void;
}

export function AcordoCondenacaoForm({
  processoId,
  acordoId,
  initialData,
  onSuccess,
  onCancel,
}: AcordoCondenacaoFormProps) {
  const isEditMode = !!acordoId;

  const [tipo, setTipo] = useState<'acordo' | 'condenacao' | 'custas_processuais' | ''>(
    initialData?.tipo || ''
  );
  const [direcao, setDirecao] = useState<'recebimento' | 'pagamento' | ''>(
    initialData?.direcao || ''
  );
  const [valorTotal, setValorTotal] = useState<string>(
    initialData?.valorTotal?.toString() || ''
  );
  const [dataVencimento, setDataVencimento] = useState<string>(
    initialData?.dataVencimentoPrimeiraParcela?.split('T')[0] || ''
  );
  const [numeroParcelas, setNumeroParcelas] = useState<number>(
    initialData?.numeroParcelas || 1
  );
  const [formaDistribuicao, setFormaDistribuicao] = useState<'integral' | 'dividido' | ''>(
    (initialData?.formaDistribuicao as 'integral' | 'dividido') || ''
  );
  const [percentualEscritorio, setPercentualEscritorio] = useState<number>(
    initialData?.percentualEscritorio || 30
  );
  const [honorariosSucumbenciais, setHonorariosSucumbenciais] = useState<string>(
    initialData?.honorariosSucumbenciaisTotal?.toString() || '0'
  );
  const [formaPagamento, setFormaPagamento] = useState<
    'transferencia_direta' | 'deposito_judicial' | 'deposito_recursal' | ''
  >('');
  const [intervaloEntreParcelas, setIntervaloEntreParcelas] = useState<number>(30);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean | null;
    error?: string;
  }>({ success: null });

  // Reset forma de distribuição quando tipo ou direção mudam
  useEffect(() => {
    if (tipo === 'custas_processuais') {
      setDirecao('pagamento');
      setNumeroParcelas(1);
      setFormaDistribuicao('');
    }
    if (direcao === 'pagamento') {
      setFormaDistribuicao('');
    }
  }, [tipo, direcao]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validações
    if (!tipo) {
      setResult({ success: false, error: 'Selecione o tipo' });
      return;
    }
    if (!direcao) {
      setResult({ success: false, error: 'Selecione a direção' });
      return;
    }
    if (!valorTotal || parseFloat(valorTotal) <= 0) {
      setResult({ success: false, error: 'Valor total deve ser maior que zero' });
      return;
    }
    if (!dataVencimento) {
      setResult({ success: false, error: 'Informe a data de vencimento' });
      return;
    }
    if (!numeroParcelas || numeroParcelas <= 0) {
      setResult({ success: false, error: 'Número de parcelas deve ser maior que zero' });
      return;
    }
    if (!formaPagamento) {
      setResult({ success: false, error: 'Selecione a forma de pagamento' });
      return;
    }

    if (direcao === 'recebimento' && tipo !== 'custas_processuais' && !formaDistribuicao) {
      setResult({ success: false, error: 'Selecione a forma de distribuição' });
      return;
    }

    setIsLoading(true);
    setResult({ success: null });

    try {
      const url = isEditMode
        ? `/api/acordos-condenacoes/${acordoId}`
        : '/api/acordos-condenacoes';
      const method = isEditMode ? 'PUT' : 'POST';

      const payload: Record<string, unknown> = {
        tipo,
        direcao,
        valorTotal: parseFloat(valorTotal),
        dataVencimentoPrimeiraParcela: dataVencimento,
        formaDistribuicao: formaDistribuicao || null,
        percentualEscritorio,
        honorariosSucumbenciaisTotal: parseFloat(honorariosSucumbenciais),
      };

      // Campos apenas para criação
      if (!isEditMode) {
        payload.processoId = processoId || 1; // TODO: Integrar com seletor de processo
        payload.numeroParcelas = numeroParcelas;
        payload.formaPagamentoPadrao = formaPagamento;
        payload.intervaloEntreParcelas = intervaloEntreParcelas;
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setResult({ success: true });
        if (onSuccess) {
          setTimeout(() => onSuccess(data.data), 1500);
        }
      } else {
        const errorMsg = isEditMode
          ? 'Erro ao atualizar acordo/condenação'
          : 'Erro ao criar acordo/condenação';
        setResult({ success: false, error: data.error || errorMsg });
      }
    } catch (_error) {
      setResult({ success: false, error: 'Erro ao comunicar com o servidor' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Resultado */}
      {result.success !== null && (
        <Alert variant={result.success ? 'default' : 'destructive'}>
          {result.success ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
          <AlertDescription>
            {result.success
              ? (isEditMode ? 'Acordo/condenação atualizado com sucesso!' : 'Acordo/condenação criado com sucesso!')
              : result.error}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-2 gap-4">
        {/* Tipo */}
        <div className="space-y-2">
          <Label htmlFor="tipo">Tipo *</Label>
          <Select value={tipo} onValueChange={(v) => setTipo(v as typeof tipo)} disabled={isEditMode}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="acordo">Acordo</SelectItem>
              <SelectItem value="condenacao">Condenação</SelectItem>
              <SelectItem value="custas_processuais">Custas Processuais</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Direção */}
        <div className="space-y-2">
          <Label htmlFor="direcao">Direção *</Label>
          <Select
            value={direcao}
            onValueChange={(v) => setDirecao(v as typeof direcao)}
            disabled={isEditMode || tipo === 'custas_processuais'}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione a direção" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recebimento">Recebimento</SelectItem>
              <SelectItem value="pagamento">Pagamento</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Valor Total */}
        <div className="space-y-2">
          <Label htmlFor="valorTotal">Valor Total (R$) *</Label>
          <Input
            id="valorTotal"
            type="number"
            step="0.01"
            value={valorTotal}
            onChange={(e) => setValorTotal(e.target.value)}
            placeholder="0.00"
          />
        </div>

        {/* Data de Vencimento */}
        <div className="space-y-2">
          <Label htmlFor="dataVencimento">Data de Vencimento (1ª Parcela) *</Label>
          <Input
            id="dataVencimento"
            type="date"
            value={dataVencimento}
            onChange={(e) => setDataVencimento(e.target.value)}
          />
        </div>
      </div>

      {/* Campos de parcelas - apenas para criação */}
      {!isEditMode && (
        <div className="grid grid-cols-3 gap-4">
          {/* Número de Parcelas */}
          <div className="space-y-2">
            <Label htmlFor="numeroParcelas">Número de Parcelas *</Label>
            <Input
              id="numeroParcelas"
              type="number"
              min="1"
              value={numeroParcelas}
              onChange={(e) => setNumeroParcelas(parseInt(e.target.value) || 1)}
              disabled={tipo === 'custas_processuais'}
            />
          </div>

          {/* Intervalo entre Parcelas */}
          <div className="space-y-2">
            <Label htmlFor="intervalo">Intervalo (dias)</Label>
            <Input
              id="intervalo"
              type="number"
              min="1"
              value={intervaloEntreParcelas}
              onChange={(e) => setIntervaloEntreParcelas(parseInt(e.target.value) || 30)}
              disabled={numeroParcelas === 1}
            />
          </div>

          {/* Forma de Pagamento */}
          <div className="space-y-2">
            <Label htmlFor="formaPagamento">Forma de Pagamento *</Label>
            <Select value={formaPagamento} onValueChange={(v) => setFormaPagamento(v as typeof formaPagamento)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="transferencia_direta">Transferência Direta</SelectItem>
                <SelectItem value="deposito_judicial">Depósito Judicial</SelectItem>
                <SelectItem value="deposito_recursal">Depósito Recursal</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Forma de Distribuição (só para recebimentos) */}
      {direcao === 'recebimento' && tipo !== 'custas_processuais' && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="formaDistribuicao">Forma de Distribuição *</Label>
            <Select value={formaDistribuicao} onValueChange={(v) => setFormaDistribuicao(v as typeof formaDistribuicao)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="integral">Integral (Escritório recebe tudo)</SelectItem>
                <SelectItem value="dividido">Dividido (Cada parte recebe direto)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="percentualEscritorio">Percentual do Escritório (%)</Label>
            <Input
              id="percentualEscritorio"
              type="number"
              min="0"
              max="100"
              value={percentualEscritorio}
              onChange={(e) => setPercentualEscritorio(parseFloat(e.target.value) || 30)}
            />
          </div>
        </div>
      )}

      {/* Honorários Sucumbenciais */}
      {tipo !== 'custas_processuais' && (
        <div className="space-y-2">
          <Label htmlFor="honorariosSucumbenciais">Honorários Sucumbenciais (R$)</Label>
          <Input
            id="honorariosSucumbenciais"
            type="number"
            step="0.01"
            value={honorariosSucumbenciais}
            onChange={(e) => setHonorariosSucumbenciais(e.target.value)}
            placeholder="0.00"
          />
          <p className="text-sm text-muted-foreground">
            100% do escritório, não repassados ao cliente
          </p>
        </div>
      )}

      {/* Botões */}
      <div className="flex gap-2 justify-end">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={isLoading}>
          {isLoading
            ? (isEditMode ? 'Salvando...' : 'Criando...')
            : (isEditMode ? 'Salvar Alterações' : 'Criar Acordo/Condenação')}
        </Button>
      </div>
    </form>
  );
}
