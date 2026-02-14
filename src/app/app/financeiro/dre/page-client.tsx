'use client';

/**
 * Página de DRE (Demonstração de Resultado do Exercício)
 * Visualiza receitas, despesas e resultado por período
 *
 * Segue padrões: PageShell, semantic Badge variants, theme-aware chart colors
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
import { PageShell } from '@/components/shared/page-shell';
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
import { useDRE, useEvolucaoDRE, useExportarDRE, gerarPeriodoAtual } from '@/features/financeiro';
import { toast } from 'sonner';
import type {
  ResumoDRE,
  CategoriaDRE,
  EvolucaoDRE,
  PeriodoDRE,
  VariacoesDRE,
} from '@/features/financeiro';
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
import { ClientOnly } from '@/components/shared/client-only';

// ============================================================================
// Constantes e Helpers
// ============================================================================

/**
 * Theme-aware chart colors using CSS variables.
 * --chart-1 through --chart-5 are defined in globals.css with light/dark variants.
 * We extend to 10 colors using opacity variations for pie charts.
 */
const CHART_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-4)',
  'var(--chart-3)',
  'var(--chart-5)',
  'color-mix(in oklch, var(--chart-1), white 30%)',
  'color-mix(in oklch, var(--chart-2), white 30%)',
  'color-mix(in oklch, var(--chart-4), white 30%)',
  'color-mix(in oklch, var(--chart-3), white 30%)',
  'color-mix(in oklch, var(--chart-5), white 30%)',
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
  return `${valor.toFixed(2)}%`;
};

const getVariacaoColor = (variacao: number): string => {
  if (variacao > 10) return 'text-success';
  if (variacao > 0) return 'text-success/80';
  if (variacao > -10) return 'text-warning';
  return 'text-destructive';
};

const getLucroColor = (valor: number): string => {
  if (valor > 0) return 'text-success';
  if (valor < 0) return 'text-destructive';
  return 'text-muted-foreground';
};

// ============================================================================
// Componente de Seleção de Período
// ============================================================================

function PeriodoSelector({
  dataInicio,
  dataFim,
  onChange,
}: {
  dataInicio: string;
  dataFim: string;
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
      case 'mes_anterior': {
        const mesAnterior = subMonths(hoje, 1);
        novoInicio = startOfMonth(mesAnterior);
        novoFim = endOfMonth(mesAnterior);
        novoTipo = 'mensal';
        break;
      }
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
// Componente de Variação (reutilizável)
// ============================================================================

function VariacaoIndicator({
  valor,
  label,
  size = 'sm',
}: {
  valor: number;
  label: string;
  size?: 'sm' | 'xs';
}) {
  const iconSize = size === 'sm' ? 'h-4 w-4' : 'h-3 w-3';
  const textSize = size === 'sm' ? 'text-sm' : 'text-xs';

  return (
    <div className={`flex items-center gap-1 ${textSize} ${getVariacaoColor(valor)}`}>
      {valor > 0 ? (
        <ArrowUpRight className={iconSize} />
      ) : valor < 0 ? (
        <ArrowDownRight className={iconSize} />
      ) : (
        <Minus className={iconSize} />
      )}
      <span>{formatarPercentual(valor)} {label}</span>
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
  isLoading,
}: {
  resumo: ResumoDRE | null;
  variacoes: VariacoesDRE | null;
  variacoesOrcado: VariacoesDRE | null;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
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
            <VariacaoIndicator
              valor={variacoes.receitaLiquida.variacaoPercentual}
              label="vs anterior"
            />
          )}
          {variacoesOrcado && (
            <VariacaoIndicator
              valor={variacoesOrcado.receitaLiquida.variacaoPercentual}
              label="vs orçado"
            />
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
            <VariacaoIndicator
              valor={variacoesOrcado.lucroOperacional.variacaoPercentual}
              label="vs orçado"
              size="xs"
            />
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
            <VariacaoIndicator
              valor={variacoesOrcado.ebitda.variacaoPercentual}
              label="vs orçado"
              size="xs"
            />
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
            <Badge variant={resumo.lucroLiquido > 0 ? 'success' : resumo.lucroLiquido < 0 ? 'destructive' : 'secondary'}>
              {resumo.lucroLiquido > 0 ? 'Lucro' : resumo.lucroLiquido < 0 ? 'Prejuízo' : 'Neutro'}
            </Badge>
            <span className="text-xs text-muted-foreground">
              Margem: {formatarPercentual(resumo.margemLiquida)}
            </span>
          </div>
          {variacoesOrcado && (
            <VariacaoIndicator
              valor={variacoesOrcado.lucroLiquido.variacaoPercentual}
              label="vs orçado"
              size="xs"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// Componente de Tabela DRE Estruturada
// ============================================================================

interface LinhaDRE {
  descricao: string;
  valor: number | null;
  percentual: number | null;
  bold?: boolean;
  indent?: number;
  negativo?: boolean;
  destaque?: boolean;
  espacador?: boolean;
  final?: boolean;
}

function DRETable({ resumo }: { resumo: ResumoDRE }) {
  const calcularPercent = (valor: number): number => {
    if (resumo.receitaLiquida === 0) return 0;
    return (valor / resumo.receitaLiquida) * 100;
  };

  const linhas: LinhaDRE[] = [
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
    <div className="rounded-md border bg-card overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="text-left p-3 text-sm font-medium">Descrição</th>
            <th className="text-right p-3 text-sm font-medium">Valor (R$)</th>
            <th className="text-right p-3 text-sm font-medium">% Receita</th>
          </tr>
        </thead>
        <tbody>
          {linhas.map((linha, index) => {
            if (linha.espacador) {
              return <tr key={index} className="h-2" />;
            }

            const valorColor = linha.valor !== null
              ? linha.valor < 0 ? 'text-destructive' : linha.valor > 0 && linha.final ? getLucroColor(linha.valor) : ''
              : '';

            return (
              <tr
                key={index}
                className={`border-b transition-colors hover:bg-muted/50 ${
                  linha.destaque ? 'bg-muted/30' : ''
                } ${
                  linha.final
                    ? resumo.lucroLiquido >= 0
                      ? 'bg-success/10'
                      : 'bg-destructive/10'
                    : ''
                }`}
              >
                <td
                  className={`p-3 text-sm ${
                    linha.bold ? 'font-semibold' : ''
                  } ${
                    (linha.indent || 0) === 1 ? 'pl-8' : 'pl-3'
                  }`}
                >
                  {linha.descricao}
                </td>
                <td className={`p-3 text-right text-sm font-mono ${linha.bold ? 'font-semibold' : ''} ${valorColor}`}>
                  {linha.valor !== null ? formatarValor(linha.valor) : ''}
                </td>
                <td className={`p-3 text-right text-sm font-mono ${linha.bold ? 'font-semibold' : ''} text-muted-foreground`}>
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
}: {
  categorias: CategoriaDRE[];
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
      <ClientOnly>
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={200}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={(props) => {
                const name = typeof props.name === 'string' ? props.name : String(props.name ?? '');
                const percent = typeof props.percent === 'number' ? props.percent : 0;
                const percentual = (percent * 100).toFixed(1);
                const nameTruncado = name.slice(0, 15) + (name.length > 15 ? '...' : '');
                return `${nameTruncado} (${percentual}%)`;
              }}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number | undefined) => value !== undefined ? formatarValor(value) : ''}
              labelFormatter={(name) => name}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </ClientOnly>
    </div>
  );
}

// ============================================================================
// Componente de Tab de Categoria (reutilizável para Receitas e Despesas)
// ============================================================================

function CategoriaTab({
  title,
  description,
  categorias,
  isLoading,
  emptyMessage,
}: {
  title: string;
  description: string;
  categorias: CategoriaDRE[] | undefined;
  isLoading: boolean;
  emptyMessage: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-80" />
        ) : categorias && categorias.length > 0 ? (
          <div className="grid gap-6 lg:grid-cols-2">
            <CategoriaPieChart categorias={categorias} />
            <div className="space-y-2">
              <h4 className="font-medium mb-4">Detalhamento</h4>
              {categorias.map((cat: CategoriaDRE, i: number) => (
                <div key={cat.categoria} className="flex items-center justify-between p-2 rounded-md border transition-colors hover:bg-muted/50">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] } as React.CSSProperties}
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
            {emptyMessage}
          </p>
        )}
      </CardContent>
    </Card>
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
      <ClientOnly>
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={200}>
          <LineChart data={evolucao}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis
              dataKey="mesNome"
              tick={{ fontSize: 12 }}
              className="fill-muted-foreground"
            />
            <YAxis
              tickFormatter={(value) => formatarValorCompacto(value)}
              tick={{ fontSize: 12 }}
              className="fill-muted-foreground"
            />
            <Tooltip
              formatter={(value: number | undefined, name: string | undefined) => [
                value !== undefined ? formatarValor(value) : '',
                name === 'receitaLiquida' ? 'Receita Líquida' :
                  name === 'lucroOperacional' ? 'Lucro Operacional' :
                    name === 'lucroLiquido' ? 'Lucro Líquido' : (name || '')
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
              stroke="var(--chart-1)"
              strokeWidth={2}
              dot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="lucroOperacional"
              stroke="var(--chart-4)"
              strokeWidth={2}
              dot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="lucroLiquido"
              stroke="var(--chart-2)"
              strokeWidth={2}
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </ClientOnly>
    </div>
  );
}

// ============================================================================
// Componente Principal
// ============================================================================

export default function DREClient() {
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
      <PageShell
        title="DRE"
        description="Demonstração de Resultado do Exercício"
      >
        <div className="rounded-md bg-destructive/15 p-4 text-sm text-destructive">
          <p className="font-semibold">Erro ao carregar DRE</p>
          <p>{error}</p>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="DRE"
      description="Demonstração de Resultado do Exercício"
      actions={
        <>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={isExporting || !dre}>
                <FileDown className="h-4 w-4" />
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
        </>
      }
    >
      {/* Seletor de Período e Opções */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <PeriodoSelector
              dataInicio={periodo.dataInicio}
              dataFim={periodo.dataFim}
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
        isLoading={isLoading}
      />

      {/* Tabs de Conteúdo */}
      <Tabs defaultValue="estrutura" className="space-y-4">
        <TabsList>
          <TabsTrigger value="estrutura" className="gap-2">
            <List className="h-4 w-4" />
            Estrutura DRE
          </TabsTrigger>
          <TabsTrigger value="receitas" className="gap-2">
            <PieChartIcon className="h-4 w-4" />
            Receitas
          </TabsTrigger>
          <TabsTrigger value="despesas" className="gap-2">
            <PieChartIcon className="h-4 w-4" />
            Despesas
          </TabsTrigger>
          <TabsTrigger value="evolucao" className="gap-2">
            <BarChart3 className="h-4 w-4" />
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
                  {Array.from({ length: 15 }).map((_, i) => (
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
          <CategoriaTab
            title="Receitas por Categoria"
            description="Distribuição das receitas por categoria"
            categorias={dre?.receitasPorCategoria}
            isLoading={isLoading}
            emptyMessage="Sem dados de receitas"
          />
        </TabsContent>

        <TabsContent value="despesas">
          <CategoriaTab
            title="Despesas por Categoria"
            description="Distribuição das despesas por categoria"
            categorias={dre?.despesasPorCategoria}
            isLoading={isLoading}
            emptyMessage="Sem dados de despesas"
          />
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
    </PageShell>
  );
}
