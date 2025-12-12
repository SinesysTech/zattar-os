'use client';

/**
 * Página de Análise Orçamentária
 * Visualiza análise detalhada do orçamento vs realizado com gráficos
 */

import * as React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  FileDown,
  RefreshCw,
  FileSpreadsheet,
  FileText,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  useOrcamento,
  useAnaliseOrcamentaria,
  useProjecaoOrcamentaria,
} from '@/features/financeiro';
import { toast } from 'sonner';
import type {
  AnaliseOrcamentariaItem,
  AlertaDesvio,
  ProjecaoItem,
  StatusOrcamento,
  ResumoOrcamentario,
  AnaliseOrcamentaria,
  Orcamento,
  EvolucaoMensal,
} from '@/features/financeiro/domain/orcamentos';
import {
  exportarOrcamentoCSV,
  exportarAnaliseCSV,
  exportarEvolucaoCSV,
  exportarRelatorioPDF,
} from '@/features/financeiro/utils/export/orcamentos';

// ============================================================================
// Constantes e Helpers
// ============================================================================

type BadgeTone = 'primary' | 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'muted';

const STATUS_CONFIG: Record<StatusOrcamento, { label: string; tone: BadgeTone }> = {
  rascunho: { label: 'Rascunho', tone: 'neutral' },
  aprovado: { label: 'Aprovado', tone: 'info' },
  em_execucao: { label: 'Em Execução', tone: 'success' },
  encerrado: { label: 'Encerrado', tone: 'muted' },
};

const formatarValor = (valor: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
};

const formatarPercentual = (valor: number): string => {
  return `${valor >= 0 ? '+' : ''}${valor.toFixed(1)}%`;
};

const getVariacaoColor = (variacao: number): string => {
  if (variacao <= -10) return 'text-green-600';
  if (variacao <= 0) return 'text-green-500';
  if (variacao <= 10) return 'text-amber-500';
  if (variacao <= 20) return 'text-amber-600';
  return 'text-red-600';
};

const getStatusBadge = (status: string): { tone: BadgeTone; label: string } => {
  switch (status) {
    case 'dentro_orcamento':
      return { tone: 'success', label: 'Dentro do Orçamento' };
    case 'atencao':
      return { tone: 'warning', label: 'Atenção' };
    case 'estourado':
      return { tone: 'danger', label: 'Estourado' };
    default:
      return { tone: 'neutral', label: status };
  }
};

const getSeveridadeBadge = (severidade: string): BadgeTone => {
  switch (severidade) {
    case 'baixa':
      return 'info';
    case 'media':
      return 'warning';
    case 'alta':
      return 'danger';
    case 'critica':
      return 'danger';
    default:
      return 'neutral';
  }
};

// ============================================================================
// Componentes de Cards de Resumo
// ============================================================================

function ResumoGeralCards({
  resumo,
  itens,
  isLoading,
}: {
  resumo: ResumoOrcamentario | null;
  itens: AnaliseOrcamentariaItem[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!resumo) return null;

  // Calcular contagem de itens por status
  const itensEstourados = itens.filter((item) => item.status === 'estourado').length;
  const itensAtencao = itens.filter((item) => item.status === 'atencao').length;

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Total Orçado</CardDescription>
          <CardTitle className="text-2xl font-mono">
            {formatarValor(resumo.totalOrcado)}
          </CardTitle>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Total Realizado</CardDescription>
          <CardTitle className="text-2xl font-mono">
            {formatarValor(resumo.totalRealizado)}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <Progress value={resumo.percentualRealizacao} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1">
            {resumo.percentualRealizacao.toFixed(1)}% executado
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Variação</CardDescription>
          <CardTitle className={`text-2xl ${getVariacaoColor(resumo.variacaoPercentual)}`}>
            {formatarPercentual(resumo.variacaoPercentual)}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-xs text-muted-foreground">
            {resumo.variacaoPercentual > 0 ? 'Acima do orçado' : 'Abaixo do orçado'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Status dos Itens</CardDescription>
        </CardHeader>
        <CardContent className="pt-0 space-y-2">
          {itensEstourados > 0 && (
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span className="text-sm">{itensEstourados} estourados</span>
            </div>
          )}
          {itensAtencao > 0 && (
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <span className="text-sm">{itensAtencao} em atenção</span>
            </div>
          )}
          {itensEstourados === 0 && itensAtencao === 0 && (
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-sm">Todos dentro do orçamento</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// Componente de Lista de Análise por Item
// ============================================================================

function AnaliseItensTable({ itens }: { itens: AnaliseOrcamentariaItem[] }) {
  if (itens.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8">
        Nenhum item para análise.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left p-3 font-medium">Conta Contábil</th>
            <th className="text-right p-3 font-medium">Orçado</th>
            <th className="text-right p-3 font-medium">Realizado</th>
            <th className="text-right p-3 font-medium">Variação</th>
            <th className="text-center p-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {itens.map((item) => {
            const statusBadge = getStatusBadge(item.status);
            return (
              <tr key={item.id} className="border-b hover:bg-muted/50">
                <td className="p-3">
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {item.contaContabil?.codigo} - {item.contaContabil?.nome}
                    </span>
                    {item.centroCusto && (
                      <span className="text-xs text-muted-foreground">
                        {item.centroCusto.nome}
                      </span>
                    )}
                  </div>
                </td>
                <td className="p-3 text-right font-mono">
                  {formatarValor(item.valorOrcado)}
                </td>
                <td className="p-3 text-right font-mono">
                  {formatarValor(item.valorRealizado)}
                </td>
                <td className={`p-3 text-right font-mono ${getVariacaoColor(item.variacao)}`}>
                  {formatarPercentual(item.variacao)}
                </td>
                <td className="p-3 text-center">
                  <Badge tone={statusBadge.tone} variant="soft">
                    {statusBadge.label}
                  </Badge>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ============================================================================
// Componente de Alertas
// ============================================================================

function AlertasDesvioList({ alertas }: { alertas: AlertaDesvio[] }) {
  if (alertas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
        <p className="text-muted-foreground">
          Nenhum alerta de desvio identificado.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {alertas.map((alerta, index) => (
        <Card key={index}>
          <CardContent className="flex items-start gap-4 p-4">
            <AlertTriangle
              className={`h-5 w-5 mt-0.5 ${alerta.severidade === 'critica' || alerta.severidade === 'alta'
                  ? 'text-red-500'
                  : 'text-amber-500'
                }`}
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium">{alerta.contaContabil}</span>
                <Badge tone={getSeveridadeBadge(alerta.severidade)} variant="soft" className="text-xs">
                  {alerta.severidade}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{alerta.mensagem}</p>
              <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                <span>Orçado: {formatarValor(alerta.valorOrcado)}</span>
                <span>Realizado: {formatarValor(alerta.valorRealizado)}</span>
                <span className={getVariacaoColor(alerta.variacao)}>
                  Variação: {formatarPercentual(alerta.variacao)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ============================================================================
// Componente de Projeção
// ============================================================================

function ProjecaoTable({ itens }: { itens: ProjecaoItem[] }) {
  if (itens.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8">
        Dados insuficientes para projeção.
      </p>
    );
  }

  const getTendenciaIcon = (tendencia: string) => {
    switch (tendencia) {
      case 'alta':
        return <TrendingUp className="h-4 w-4 text-red-500" />;
      case 'baixa':
        return <TrendingDown className="h-4 w-4 text-green-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left p-3 font-medium">Conta Contábil</th>
            <th className="text-right p-3 font-medium">Realizado Atual</th>
            <th className="text-right p-3 font-medium">Projeção Final</th>
            <th className="text-right p-3 font-medium">vs Orçado</th>
            <th className="text-center p-3 font-medium">Tendência</th>
          </tr>
        </thead>
        <tbody>
          {itens.map((item, index) => (
            <tr key={index} className="border-b hover:bg-muted/50">
              <td className="p-3 font-medium">{item.contaContabil}</td>
              <td className="p-3 text-right font-mono">
                {formatarValor(item.realizadoAtual)}
              </td>
              <td className="p-3 text-right font-mono">
                {formatarValor(item.projecaoFinal)}
              </td>
              <td className={`p-3 text-right font-mono ${getVariacaoColor(item.variacaoProjetada)}`}>
                {formatarPercentual(item.variacaoProjetada)}
              </td>
              <td className="p-3">
                <div className="flex items-center justify-center gap-1">
                  {getTendenciaIcon(item.tendencia)}
                  <span className="text-sm capitalize">{item.tendencia}</span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ============================================================================
// Componente Principal
// ============================================================================

export default function AnaliseOrcamentariaPage() {
  const router = useRouter();
  const params = useParams();
  const orcamentoId = parseInt(params.id as string, 10);

  // Dados do orçamento
  const { orcamento, isLoading: loadingOrcamento, error: errorOrcamento } = useOrcamento(orcamentoId);

  // Dados de análise
  const {
    itens: itensAnalise,
    resumo,
    alertas,
    evolucao,
    isLoading: loadingAnalise,
    error: errorAnalise,
    refetch: refetchAnalise,
  } = useAnaliseOrcamentaria(orcamentoId, {
    incluirResumo: true,
    incluirAlertas: true,
    incluirEvolucao: true,
  });

  // Dados de projeção
  const {
    projecao,
    isLoading: loadingProjecao,
    error: errorProjecao,
    refetch: refetchProjecao,
  } = useProjecaoOrcamentaria(orcamentoId);

  const isLoading = loadingOrcamento || loadingAnalise;
  const error = errorOrcamento || errorAnalise;

  const handleVoltar = () => {
    router.push(`/financeiro/orcamentos/${orcamentoId}`);
  };

  const handleRefresh = () => {
    refetchAnalise();
    refetchProjecao();
    toast.success('Dados atualizados');
  };

  const [isExporting, setIsExporting] = React.useState(false);

  const handleExportarCSV = async () => {
    if (!orcamento) return;

    try {
      setIsExporting(true);
      if (itensAnalise.length > 0 && resumo) {
        // Exportar análise completa - criar estrutura AnaliseOrcamentaria completa
        const analiseData: AnaliseOrcamentaria = {
          orcamento: orcamento as Orcamento,
          periodo: {
            dataInicio: orcamento.dataInicio || '',
            dataFim: orcamento.dataFim || '',
            mesesTotal: 12,
            mesesDecorridos: 6,
          },
          resumo,
          itensPorConta: itensAnalise.map((item) => ({
            contaContabilId: item.contaContabil?.id || 0,
            contaContabilCodigo: item.contaContabil?.codigo || '',
            contaContabilNome: item.contaContabil?.nome || '',
            tipoConta: 'despesa' as const,
            centroCustoId: item.centroCusto?.id,
            centroCustoCodigo: item.centroCusto?.codigo,
            centroCustoNome: item.centroCusto?.nome || null,
            mes: item.mes || undefined,
            valorOrcado: item.valorOrcado,
            valorRealizado: item.valorRealizado,
            variacao: item.variacao,
            variacaoPercentual: item.variacaoPercentual,
            percentualRealizacao: item.percentualRealizacao,
            status: (item.status === 'dentro_orcamento'
              ? 'dentro'
              : item.status === 'estourado'
                ? 'critico'
                : 'atencao') as 'dentro' | 'atencao' | 'critico',
          })),
          itensPorCentro: [],
          evolucaoMensal: evolucao as EvolucaoMensal[],
          alertas: alertas.map((a) => ({
            severidade: a.severidade as 'baixa' | 'media' | 'alta' | 'critica',
            mensagem: a.mensagem,
            contaContabilId: 0,
            contaContabilNome: a.contaContabil || '',
            centroCustoId: undefined,
            centroCustoNome: a.centroCusto,
            valorOrcado: a.valorOrcado,
            valorRealizado: a.valorRealizado,
            variacao: a.variacao,
          })),
          projecao: undefined,
        };
        exportarAnaliseCSV(orcamento, analiseData);
        toast.success('Análise exportada para CSV');
      } else {
        // Exportar orçamento básico
        exportarOrcamentoCSV(orcamento);
        toast.success('Orçamento exportado para CSV');
      }
    } catch (error) {
      console.error('Erro ao exportar CSV:', error);
      toast.error('Erro ao exportar CSV');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportarEvolucaoCSV = async () => {
    if (!orcamento || evolucao.length === 0) {
      toast.warning('Dados de evolução não disponíveis');
      return;
    }

    try {
      setIsExporting(true);
      exportarEvolucaoCSV(orcamento, evolucao);
      toast.success('Evolução mensal exportada para CSV');
    } catch (error) {
      console.error('Erro ao exportar evolução:', error);
      toast.error('Erro ao exportar evolução');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportarPDF = async () => {
    if (!orcamento) return;

    try {
      setIsExporting(true);
      toast.info('Gerando relatório PDF...');

      // Buscar relatório via API HTTP em vez de chamar serviço diretamente
      const response = await fetch(`/api/financeiro/orcamentos/${orcamentoId}/relatorio?formato=json`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(errorData.error || 'Não foi possível gerar o relatório');
      }

      const data = await response.json();
      if (!data.success || !data.data) {
        toast.error('Não foi possível gerar o relatório');
        return;
      }

      // Converter estrutura da API para formato esperado pelo exportador
      const relatorio = {
        orcamento: data.data.orcamento,
        analise: data.data.analise,
        resumo: data.data.analise?.resumo || null,
        alertas: data.data.analise?.alertas || [],
        evolucao: data.data.analise?.evolucao || [],
        projecao: null, // O exportador PDF não usa projeção individual
        geradoEm: data.data.geradoEm,
      };

      await exportarRelatorioPDF(relatorio);
      toast.success('Relatório PDF exportado com sucesso');
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      toast.error('Erro ao exportar PDF');
    } finally {
      setIsExporting(false);
    }
  };

  // Loading
  if (isLoading && !orcamento) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Erro
  if (error || !orcamento) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={handleVoltar}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <div className="rounded-md bg-destructive/15 p-4 text-sm text-destructive">
          <p className="font-semibold">Erro ao carregar análise</p>
          <p>{error || 'Orçamento não encontrado'}</p>
        </div>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[orcamento.status];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleVoltar}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">Análise Orçamentária</h1>
              <Badge tone={statusConfig.tone} variant="soft">
                {statusConfig.label}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              {orcamento.nome} - {orcamento.ano}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Atualizar
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" disabled={isExporting}>
                <FileDown className="mr-2 h-4 w-4" />
                {isExporting ? 'Exportando...' : 'Exportar'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportarCSV}>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Exportar Análise (CSV)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportarEvolucaoCSV}>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Exportar Evolução Mensal (CSV)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportarPDF}>
                <FileText className="mr-2 h-4 w-4" />
                Relatório Completo (PDF)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Cards de Resumo */}
      <ResumoGeralCards resumo={resumo} itens={itensAnalise} isLoading={loadingAnalise} />

      {/* Tabs de Conteúdo */}
      <Tabs defaultValue="analise" className="space-y-4">
        <TabsList>
          <TabsTrigger value="analise">Análise por Item</TabsTrigger>
          <TabsTrigger value="alertas">
            Alertas
            {alertas.length > 0 && (
              <Badge tone="danger" variant="soft" className="ml-2 text-xs">
                {alertas.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="projecao">Projeção</TabsTrigger>
        </TabsList>

        <TabsContent value="analise">
          <Card>
            <CardHeader>
              <CardTitle>Análise Orçado vs Realizado</CardTitle>
              <CardDescription>
                Comparativo detalhado por conta contábil
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AnaliseItensTable itens={itensAnalise} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alertas">
          <Card>
            <CardHeader>
              <CardTitle>Alertas de Desvio</CardTitle>
              <CardDescription>
                Itens que necessitam de atenção
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AlertasDesvioList alertas={alertas} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projecao">
          <Card>
            <CardHeader>
              <CardTitle>Projeção de Execução</CardTitle>
              <CardDescription>
                Estimativa de fechamento baseada na tendência atual
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingProjecao ? (
                <Skeleton className="h-64" />
              ) : errorProjecao ? (
                <p className="text-center text-destructive py-8">{errorProjecao}</p>
              ) : (
                <ProjecaoTable itens={projecao} />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
