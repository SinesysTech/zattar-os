'use client';

/**
 * Página de DRE (Demonstração de Resultado do Exercício)
 * Visualiza receitas, despesas e resultado por período
 */

import * as React from 'react';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, startOfQuarter, endOfQuarter, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  FileDown,
  RefreshCw,
  FileSpreadsheet,
  FileText,
  Calendar,
  BarChart3,
  PieChart as PieChartIcon,
  List,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useDRE, useEvolucaoDRE, useExportarDRE, gerarPeriodoAtual } from '@/app/_lib/hooks/use-dre';
import { toast } from 'sonner';
import type {
  ResumoDRE,
  CategoriaDRE,
  EvolucaoDRE,
  PeriodoDRE,
  VariacoesDRE,
} from '@/backend/types/financeiro/dre.types';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';

// ============================================================================
// Constantes e Helpers
// ============================================================================

type BadgeTone = 'primary' | 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'muted';

const CORES_CATEGORIAS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8',
  '#82CA9D', '#FFC658', '#FF7C43', '#A4DE6C', '#D0ED57',
];

const formatarValor = (valor: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
};

const formatarValorCompacto = (valor: number): string => {
  if (Math.abs(valor) >= 1000000) {
    return `R$ ${(valor / 1000000).toFixed(1)}M`;
  }
  if (Math.abs(valor) >= 1000) {
    return `R$ ${(valor / 1000).toFixed(1)}K`;
  }
  return formatarValor(valor);
};

const formatarPercentual = (valor: number): string => {
  return `${valor >= 0 ? '' : ''}${valor.toFixed(2)}%`;
};

const getVariacaoColor = (variacao: number): string => {
  if (variacao > 10) return 'text-green-600';
  if (variacao > 0) return 'text-green-500';
  if (variacao > -10) return 'text-amber-500';
  return 'text-red-600';
};

const getLucroColor = (valor: number): string => {
  if (valor > 0) return 'text-green-600';
  if (valor < 0) return 'text-red-600';
  return 'text-muted-foreground';
};

const getLucroBadgeTone = (valor: number): BadgeTone => {
  if (valor > 0) return 'success';
  if (valor < 0) return 'danger';
  return 'neutral';
};

// ============================================================================
// Componente de Seleção de Período
// ============================================================================

function PeriodoSelector({
  dataInicio,
  dataFim,
  tipo,
  onChange,
}: {
  dataInicio: string;
  dataFim: string;
  tipo: PeriodoDRE;
  onChange: (dataInicio: string, dataFim: string, tipo: PeriodoDRE) => void;
}) {
  const hoje = new Date();

  const handlePeriodoRapido = (periodoTipo: 'mes_atual' | 'mes_anterior' | 'trimestre_atual' | 'ano_atual') => {
    let novoInicio: Date;
    let novoFim: Date;
    let novoTipo: PeriodoDRE;

    switch (periodoTipo) {
      case 'mes_atual':
        novoInicio = startOfMonth(hoje);
        novoFim = endOfMonth(hoje);
        novoTipo = 'mensal';
        break;
      case 'mes_anterior':
        const mesAnterior = subMonths(hoje, 1);
        novoInicio = startOfMonth(mesAnterior);
        novoFim = endOfMonth(mesAnterior);
        novoTipo = 'mensal';
        break;
      case 'trimestre_atual':
        novoInicio = startOfQuarter(hoje);
        novoFim = endOfQuarter(hoje);
        novoTipo = 'trimestral';
        break;
      case 'ano_atual':
        novoInicio = startOfYear(hoje);
        novoFim = endOfYear(hoje);
        novoTipo = 'anual';
        break;
    }

    onChange(
      format(novoInicio, 'yyyy-MM-dd'),
      format(novoFim, 'yyyy-MM-dd'),
      novoTipo
    );
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePeriodoRapido('mes_atual')}
        >
          Mês Atual
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePeriodoRapido('mes_anterior')}
        >
          Mês Anterior
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePeriodoRapido('trimestre_atual')}
        >
          Trimestre
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePeriodoRapido('ano_atual')}
        >
          Ano
        </Button>
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Calendar className="h-4 w-4" />
        <span>
          {format(new Date(dataInicio), "dd 'de' MMMM", { locale: ptBR })} a{' '}
          {format(new Date(dataFim), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </span>
      </div>
    </div>
  );
}

// ============================================================================
// Componente de Cards de Resumo
// ============================================================================

function ResumoCards({
  resumo,
  variacoes,
  variacoesOrcado,
  orcado,
  isLoading,
}: {
  resumo: ResumoDRE | null;
  variacoes: VariacoesDRE | null;
  variacoesOrcado: VariacoesDRE | null;
  orcado: ResumoDRE | null;
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

  if (!resumo) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Selecione um período para visualizar o DRE.
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Receita Líquida</CardDescription>
          <CardTitle className="text-2xl font-mono">
            {formatarValor(resumo.receitaLiquida)}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-1">
          {variacoes && (
            <div className={`flex items-center gap-1 text-sm ${getVariacaoColor(variacoes.receitaLiquida.percentual)}`}>
              {variacoes.receitaLiquida.percentual > 0 ? (
                <ArrowUpRight className="h-4 w-4" />
              ) : variacoes.receitaLiquida.percentual < 0 ? (
                <ArrowDownRight className="h-4 w-4" />
              ) : (
                <Minus className="h-4 w-4" />
              )}
              <span>{formatarPercentual(variacoes.receitaLiquida.percentual)} vs anterior</span>
            </div>
          )}
          {variacoesOrcado && (
            <div className={`flex items-center gap-1 text-sm ${getVariacaoColor(variacoesOrcado.receitaLiquida.percentual)}`}>
              {variacoesOrcado.receitaLiquida.percentual > 0 ? (
                <ArrowUpRight className="h-4 w-4" />
              ) : variacoesOrcado.receitaLiquida.percentual < 0 ? (
                <ArrowDownRight className="h-4 w-4" />
              ) : (
                <Minus className="h-4 w-4" />
              )}
              <span>{formatarPercentual(variacoesOrcado.receitaLiquida.percentual)} vs orçado</span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Lucro Operacional</CardDescription>
          <CardTitle className={`text-2xl font-mono ${getLucroColor(resumo.lucroOperacional)}`}>
            {formatarValor(resumo.lucroOperacional)}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-1">
          <p className="text-xs text-muted-foreground">
            Margem: {formatarPercentual(resumo.margemOperacional)}
          </p>
          {variacoesOrcado && (
            <div className={`flex items-center gap-1 text-xs ${getVariacaoColor(variacoesOrcado.lucroOperacional.percentual)}`}>
              {variacoesOrcado.lucroOperacional.percentual > 0 ? (
                <ArrowUpRight className="h-3 w-3" />
              ) : variacoesOrcado.lucroOperacional.percentual < 0 ? (
                <ArrowDownRight className="h-3 w-3" />
              ) : (
                <Minus className="h-3 w-3" />
              )}
              <span>{formatarPercentual(variacoesOrcado.lucroOperacional.percentual)} vs orçado</span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardDescription>EBITDA</CardDescription>
          <CardTitle className={`text-2xl font-mono ${getLucroColor(resumo.ebitda)}`}>
            {formatarValor(resumo.ebitda)}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-1">
          <p className="text-xs text-muted-foreground">
            Margem EBITDA: {formatarPercentual(resumo.margemEBITDA)}
          </p>
          {variacoesOrcado && (
            <div className={`flex items-center gap-1 text-xs ${getVariacaoColor(variacoesOrcado.ebitda.percentual)}`}>
              {variacoesOrcado.ebitda.percentual > 0 ? (
                <ArrowUpRight className="h-3 w-3" />
              ) : variacoesOrcado.ebitda.percentual < 0 ? (
                <ArrowDownRight className="h-3 w-3" />
              ) : (
                <Minus className="h-3 w-3" />
              )}
              <span>{formatarPercentual(variacoesOrcado.ebitda.percentual)} vs orçado</span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Lucro Líquido</CardDescription>
          <CardTitle className={`text-2xl font-mono ${getLucroColor(resumo.lucroLiquido)}`}>
            {formatarValor(resumo.lucroLiquido)}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-1">
          <div className="flex items-center gap-2">
            <Badge tone={getLucroBadgeTone(resumo.lucroLiquido)} variant="soft">
              {resumo.lucroLiquido > 0 ? 'Lucro' : resumo.lucroLiquido < 0 ? 'Prejuízo' : 'Neutro'}
            </Badge>
            <span className="text-xs text-muted-foreground">
              Margem: {formatarPercentual(resumo.margemLiquida)}
            </span>
          </div>
          {variacoesOrcado && (
            <div className={`flex items-center gap-1 text-xs ${getVariacaoColor(variacoesOrcado.lucroLiquido.percentual)}`}>
              {variacoesOrcado.lucroLiquido.percentual > 0 ? (
                <ArrowUpRight className="h-3 w-3" />
              ) : variacoesOrcado.lucroLiquido.percentual < 0 ? (
                <ArrowDownRight className="h-3 w-3" />
              ) : (
                <Minus className="h-3 w-3" />
              )}
              <span>{formatarPercentual(variacoesOrcado.lucroLiquido.percentual)} vs orçado</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// Componente de Tabela DRE Estruturada
// ============================================================================

function DRETable({ resumo }: { resumo: ResumoDRE }) {
  const calcularPercent = (valor: number): number => {
    if (resumo.receitaLiquida === 0) return 0;
    return (valor / resumo.receitaLiquida) * 100;
  };

  const linhas = [
    { descricao: 'RECEITAS', valor: null, percentual: null, bold: true, indent: 0 },
    { descricao: 'Receita Bruta', valor: resumo.receitaBruta, percentual: 100 + calcularPercent(resumo.deducoes), indent: 1 },
    { descricao: '(-) Deduções', valor: -resumo.deducoes, percentual: -calcularPercent(resumo.deducoes), indent: 1, negativo: true },
    { descricao: '= Receita Líquida', valor: resumo.receitaLiquida, percentual: 100, bold: true, indent: 0, destaque: true },
    { descricao: '', valor: null, percentual: null, espacador: true },
    { descricao: 'CUSTOS E DESPESAS', valor: null, percentual: null, bold: true, indent: 0 },
    { descricao: '(-) Custos Diretos', valor: -resumo.custosDiretos, percentual: -calcularPercent(resumo.custosDiretos), indent: 1, negativo: true },
    { descricao: '= Lucro Bruto', valor: resumo.lucroBruto, percentual: resumo.margemBruta, bold: true, indent: 0, destaque: true },
    { descricao: '', valor: null, percentual: null, espacador: true },
    { descricao: '(-) Despesas Operacionais', valor: -resumo.despesasOperacionais, percentual: -calcularPercent(resumo.despesasOperacionais), indent: 1, negativo: true },
    { descricao: '= Lucro Operacional', valor: resumo.lucroOperacional, percentual: resumo.margemOperacional, bold: true, indent: 0, destaque: true },
    { descricao: '', valor: null, percentual: null, espacador: true },
    { descricao: '(+) Depreciação/Amortização', valor: resumo.depreciacaoAmortizacao, percentual: calcularPercent(resumo.depreciacaoAmortizacao), indent: 1 },
    { descricao: '= EBITDA', valor: resumo.ebitda, percentual: resumo.margemEBITDA, bold: true, indent: 0, destaque: true },
    { descricao: '', valor: null, percentual: null, espacador: true },
    { descricao: 'RESULTADO FINANCEIRO', valor: null, percentual: null, bold: true, indent: 0 },
    { descricao: '(+) Receitas Financeiras', valor: resumo.receitasFinanceiras, percentual: calcularPercent(resumo.receitasFinanceiras), indent: 1 },
    { descricao: '(-) Despesas Financeiras', valor: -resumo.despesasFinanceiras, percentual: -calcularPercent(resumo.despesasFinanceiras), indent: 1, negativo: true },
    { descricao: '', valor: null, percentual: null, espacador: true },
    { descricao: '= Resultado Antes Impostos', valor: resumo.resultadoAntesImposto, percentual: calcularPercent(resumo.resultadoAntesImposto), bold: true, indent: 0 },
    { descricao: '(-) Impostos', valor: -resumo.impostos, percentual: -calcularPercent(resumo.impostos), indent: 1, negativo: true },
    { descricao: '', valor: null, percentual: null, espacador: true },
    { descricao: '= LUCRO LÍQUIDO', valor: resumo.lucroLiquido, percentual: resumo.margemLiquida, bold: true, indent: 0, destaque: true, final: true },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="text-left p-3 font-medium">Descrição</th>
            <th className="text-right p-3 font-medium">Valor (R$)</th>
            <th className="text-right p-3 font-medium">% Receita</th>
          </tr>
        </thead>
        <tbody>
          {linhas.map((linha, index) => {
            if (linha.espacador) {
              return <tr key={index} className="h-2" />;
            }

            const valorColor = linha.valor !== null
              ? linha.valor < 0 ? 'text-red-600' : linha.valor > 0 && linha.final ? getLucroColor(linha.valor) : ''
              : '';

            return (
              <tr
                key={index}
                className={`border-b ${linha.destaque ? 'bg-muted/30' : ''} ${linha.final ? (resumo.lucroLiquido >= 0 ? 'bg-green-50' : 'bg-red-50') : ''}`}
              >
                <td
                  className={`p-3 ${linha.bold ? 'font-semibold' : ''}`}
                  style={{ paddingLeft: `${(linha.indent || 0) * 20 + 12}px` }}
                >
                  {linha.descricao}
                </td>
                <td className={`p-3 text-right font-mono ${linha.bold ? 'font-semibold' : ''} ${valorColor}`}>
                  {linha.valor !== null ? formatarValor(linha.valor) : ''}
                </td>
                <td className={`p-3 text-right font-mono ${linha.bold ? 'font-semibold' : ''} text-muted-foreground`}>
                  {linha.percentual !== null ? formatarPercentual(linha.percentual) : ''}
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
// Componente de Gráfico de Pizza
// ============================================================================

function CategoriaPieChart({
  categorias,
  titulo,
}: {
  categorias: CategoriaDRE[];
  titulo: string;
}) {
  if (categorias.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Sem dados para exibir
      </div>
    );
  }

  const data = categorias.slice(0, 10).map((cat) => ({
    name: cat.categoria,
    value: cat.valor,
    percentual: cat.percentualReceita,
  }));

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percentual }) => `${name.slice(0, 15)}${name.length > 15 ? '...' : ''} (${percentual.toFixed(1)}%)`}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={CORES_CATEGORIAS[index % CORES_CATEGORIAS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => formatarValor(value)}
            labelFormatter={(name) => name}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

// ============================================================================
// Componente de Gráfico de Evolução
// ============================================================================

function EvolucaoChart({ evolucao }: { evolucao: EvolucaoDRE[] }) {
  if (evolucao.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Sem dados de evolução
      </div>
    );
  }

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={evolucao}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="mesNome"
            tick={{ fontSize: 12 }}
          />
          <YAxis
            tickFormatter={(value) => formatarValorCompacto(value)}
            tick={{ fontSize: 12 }}
          />
          <Tooltip
            formatter={(value: number, name: string) => [
              formatarValor(value),
              name === 'receitaLiquida' ? 'Receita Líquida' :
                name === 'lucroOperacional' ? 'Lucro Operacional' :
                  name === 'lucroLiquido' ? 'Lucro Líquido' : name
            ]}
          />
          <Legend
            formatter={(value) =>
              value === 'receitaLiquida' ? 'Receita Líquida' :
                value === 'lucroOperacional' ? 'Lucro Operacional' :
                  value === 'lucroLiquido' ? 'Lucro Líquido' : value
            }
          />
          <Line
            type="monotone"
            dataKey="receitaLiquida"
            stroke="#0088FE"
            strokeWidth={2}
            dot={{ r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="lucroOperacional"
            stroke="#00C49F"
            strokeWidth={2}
            dot={{ r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="lucroLiquido"
            stroke="#FF8042"
            strokeWidth={2}
            dot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ============================================================================
// Componente Principal
// ============================================================================

export default function DREPage() {
  // Estado de período
  const [periodo, setPeriodo] = React.useState(() => {
    const { dataInicio, dataFim } = gerarPeriodoAtual('mensal');
    return { dataInicio, dataFim, tipo: 'mensal' as PeriodoDRE };
  });

  // Estado de opções
  const [incluirComparativo, setIncluirComparativo] = React.useState(false);
  const [incluirOrcado, setIncluirOrcado] = React.useState(false);

  // Dados do DRE
  const { dre, comparativo, isLoading, error, refetch } = useDRE({
    dataInicio: periodo.dataInicio,
    dataFim: periodo.dataFim,
    tipo: periodo.tipo,
    incluirComparativo,
    incluirOrcado,
  });

  // Dados de evolução
  const anoAtual = new Date().getFullYear();
  const { evolucao, isLoading: loadingEvolucao } = useEvolucaoDRE({ ano: anoAtual });

  // Exportação
  const { isExporting, exportarPDF, exportarCSV } = useExportarDRE();

  const handlePeriodoChange = (dataInicio: string, dataFim: string, tipo: PeriodoDRE) => {
    setPeriodo({ dataInicio, dataFim, tipo });
  };

  const handleRefresh = () => {
    refetch();
    toast.success('Dados atualizados');
  };

  const handleExportarPDF = async () => {
    await exportarPDF(periodo.dataInicio, periodo.dataFim, periodo.tipo);
    toast.success('DRE exportado em PDF');
  };

  const handleExportarCSV = async () => {
    await exportarCSV(periodo.dataInicio, periodo.dataFim, periodo.tipo);
    toast.success('DRE exportado em CSV');
  };

  // Erro
  if (error && !isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Demonstração de Resultado (DRE)</h1>
        </div>
        <div className="rounded-md bg-destructive/15 p-4 text-sm text-destructive">
          <p className="font-semibold">Erro ao carregar DRE</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Demonstração de Resultado (DRE)</h1>
          <p className="text-muted-foreground">
            Análise de receitas, despesas e resultado
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" disabled={isExporting || !dre}>
                <FileDown className="mr-2 h-4 w-4" />
                {isExporting ? 'Exportando...' : 'Exportar'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportarPDF}>
                <FileText className="mr-2 h-4 w-4" />
                Exportar PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportarCSV}>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Exportar CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Seletor de Período e Opções */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <PeriodoSelector
              dataInicio={periodo.dataInicio}
              dataFim={periodo.dataFim}
              tipo={periodo.tipo}
              onChange={handlePeriodoChange}
            />

            <div className="flex items-center gap-6">
              <div className="flex items-center space-x-2">
                <Switch
                  id="comparativo"
                  checked={incluirComparativo}
                  onCheckedChange={setIncluirComparativo}
                />
                <Label htmlFor="comparativo" className="text-sm">
                  Comparar com período anterior
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="orcado"
                  checked={incluirOrcado}
                  onCheckedChange={setIncluirOrcado}
                />
                <Label htmlFor="orcado" className="text-sm">
                  Comparar com orçamento
                </Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards de Resumo */}
      <ResumoCards
        resumo={dre?.resumo || null}
        variacoes={comparativo?.variacoes || null}
        variacoesOrcado={comparativo?.variacoesOrcado || null}
        orcado={comparativo?.orcado || null}
        isLoading={isLoading}
      />

      {/* Tabs de Conteúdo */}
      <Tabs defaultValue="estrutura" className="space-y-4">
        <TabsList>
          <TabsTrigger value="estrutura">
            <List className="mr-2 h-4 w-4" />
            Estrutura DRE
          </TabsTrigger>
          <TabsTrigger value="receitas">
            <PieChartIcon className="mr-2 h-4 w-4" />
            Receitas
          </TabsTrigger>
          <TabsTrigger value="despesas">
            <PieChartIcon className="mr-2 h-4 w-4" />
            Despesas
          </TabsTrigger>
          <TabsTrigger value="evolucao">
            <BarChart3 className="mr-2 h-4 w-4" />
            Evolução
          </TabsTrigger>
        </TabsList>

        <TabsContent value="estrutura">
          <Card>
            <CardHeader>
              <CardTitle>Estrutura do DRE</CardTitle>
              <CardDescription>
                {dre?.periodo.descricao || 'Selecione um período'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  {[...Array(15)].map((_, i) => (
                    <Skeleton key={i} className="h-8" />
                  ))}
                </div>
              ) : dre?.resumo ? (
                <DRETable resumo={dre.resumo} />
              ) : (
                <p className="text-center py-8 text-muted-foreground">
                  Selecione um período para visualizar o DRE
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="receitas">
          <Card>
            <CardHeader>
              <CardTitle>Receitas por Categoria</CardTitle>
              <CardDescription>
                Distribuição das receitas por categoria
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-80" />
              ) : dre?.receitasPorCategoria ? (
                <div className="grid gap-6 lg:grid-cols-2">
                  <CategoriaPieChart
                    categorias={dre.receitasPorCategoria}
                    titulo="Receitas"
                  />
                  <div className="space-y-2">
                    <h4 className="font-medium mb-4">Detalhamento</h4>
                    {dre.receitasPorCategoria.map((cat, i) => (
                      <div key={cat.categoria} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: CORES_CATEGORIAS[i % CORES_CATEGORIAS.length] }}
                          />
                          <span className="text-sm">{cat.categoria}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-mono text-sm">{formatarValor(cat.valor)}</span>
                          <span className="text-xs text-muted-foreground ml-2">
                            ({formatarPercentual(cat.percentualReceita)})
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-center py-8 text-muted-foreground">
                  Sem dados de receitas
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="despesas">
          <Card>
            <CardHeader>
              <CardTitle>Despesas por Categoria</CardTitle>
              <CardDescription>
                Distribuição das despesas por categoria
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-80" />
              ) : dre?.despesasPorCategoria ? (
                <div className="grid gap-6 lg:grid-cols-2">
                  <CategoriaPieChart
                    categorias={dre.despesasPorCategoria}
                    titulo="Despesas"
                  />
                  <div className="space-y-2">
                    <h4 className="font-medium mb-4">Detalhamento</h4>
                    {dre.despesasPorCategoria.map((cat, i) => (
                      <div key={cat.categoria} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: CORES_CATEGORIAS[i % CORES_CATEGORIAS.length] }}
                          />
                          <span className="text-sm">{cat.categoria}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-mono text-sm">{formatarValor(cat.valor)}</span>
                          <span className="text-xs text-muted-foreground ml-2">
                            ({formatarPercentual(cat.percentualReceita)})
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-center py-8 text-muted-foreground">
                  Sem dados de despesas
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="evolucao">
          <Card>
            <CardHeader>
              <CardTitle>Evolução Anual</CardTitle>
              <CardDescription>
                Evolução mensal de receita, lucro operacional e lucro líquido - {anoAtual}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingEvolucao ? (
                <Skeleton className="h-80" />
              ) : (
                <EvolucaoChart evolucao={evolucao} />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
