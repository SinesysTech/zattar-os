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

interface AcordoCondenacaoFormProps {
  processoId?: number;
  onSuccess?: (data: any) => void;
  onCancel?: () => void;
}

export function AcordoCondenacaoForm({
  processoId,
  onSuccess,
  onCancel,
}: AcordoCondenacaoFormProps) {
  const [tipo, setTipo] = useState<'acordo' | 'condenacao' | 'custas_processuais' | ''>('');
  const [direcao, setDirecao] = useState<'recebimento' | 'pagamento' | ''>('');
  const [valorTotal, setValorTotal] = useState<string>('');
  const [dataVencimento, setDataVencimento] = useState<string>('');
  const [numeroParcelas, setNumeroParcelas] = useState<number>(1);
  const [formaDistribuicao, setFormaDistribuicao] = useState<'integral' | 'dividido' | ''>('');
  const [percentualEscritorio, setPercentualEscritorio] = useState<number>(30);
  const [honorariosSucumbenciais, setHonorariosSucumbenciais] = useState<string>('0');
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
      const response = await fetch('/api/acordos-condenacoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          processoId: processoId || 1, // TODO: Integrar com seletor de processo
          tipo,
          direcao,
          valorTotal: parseFloat(valorTotal),
          dataVencimentoPrimeiraParcela: dataVencimento,
          numeroParcelas,
          formaDistribuicao: formaDistribuicao || null,
          percentualEscritorio,
          honorariosSucumbenciaisTotal: parseFloat(honorariosSucumbenciais),
          formaPagamentoPadrao: formaPagamento,
          intervaloEntreParcelas,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setResult({ success: true });
        if (onSuccess) {
          setTimeout(() => onSuccess(data.data), 1500);
        }
      } else {
        setResult({ success: false, error: data.error || 'Erro ao criar acordo/condenação' });
      }
    } catch (error) {
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
            {result.success ? 'Acordo/condenação criado com sucesso!' : result.error}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-2 gap-4">
        {/* Tipo */}
        <div className="space-y-2">
          <Label htmlFor="tipo">Tipo *</Label>
          <Select value={tipo} onValueChange={(v: any) => setTipo(v)}>
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
            onValueChange={(v: any) => setDirecao(v)}
            disabled={tipo === 'custas_processuais'}
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
          <Select value={formaPagamento} onValueChange={(v: any) => setFormaPagamento(v)}>
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

      {/* Forma de Distribuição (só para recebimentos) */}
      {direcao === 'recebimento' && tipo !== 'custas_processuais' && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="formaDistribuicao">Forma de Distribuição *</Label>
            <Select value={formaDistribuicao} onValueChange={(v: any) => setFormaDistribuicao(v)}>
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
          {isLoading ? 'Criando...' : 'Criar Acordo/Condenação'}
        </Button>
      </div>
    </form>
  );
}
