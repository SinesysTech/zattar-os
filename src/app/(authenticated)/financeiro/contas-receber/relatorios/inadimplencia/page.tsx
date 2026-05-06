'use client';

/**
 * Página de Relatório de Inadimplência
 * Exibe análise detalhada de contas vencidas com agrupamentos e gráficos
 */

import * as React from 'react';
import { format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AppBadge as Badge } from '@/components/ui/app-badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ArrowLeft,
  CalendarIcon,
  AlertCircle,
  TrendingDown,
  Users,
  DollarSign,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ContaReceberComDetalhes } from '@/app/(authenticated)/financeiro';
import { Text } from '@/components/ui/typography';

// ============================================================================
// Types
// ============================================================================

interface ClienteInadimplente {
  clienteId: number;
  clienteNome: string;
  quantidadeContas: number;
  valorTotal: number;
  diasMediaAtraso: number;
  maiorAtraso: number;
}

interface FaixaAtraso {
  faixa: string;
  quantidadeContas: number;
  valorTotal: number;
  percentualTotal: number;
}

interface RelatorioInadimplencia {
  resumo: {
    totalContas: number;
    valorTotal: number;
    diasMediaAtraso: number;
    clientesInadimplentes: number;
  };
  clientesRanking: ClienteInadimplente[];
  faixasAtraso: FaixaAtraso[];
  contasVencidas: ContaReceberComDetalhes[];
}

// ============================================================================
// Helpers
// ============================================================================

const formatarValor = (valor: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
};

const formatarData = (data: string | Date): string => {
  const d = typeof data === 'string' ? new Date(data) : data;
  return format(d, 'dd/MM/yyyy', { locale: ptBR });
};

const fetcher = async (url: string) => {
  const res = await fetch(url);
  const body = await res.json();
  if (!res.ok || !body.success) {
    throw new Error(body.error || 'Erro ao carregar relatório');
  }
  return body.data;
};

// ============================================================================
// Componente Principal
// ============================================================================

export default function RelatorioInadimplenciaPage() {
  const router = useRouter();

  // Estados de filtro
  const [dataInicio, setDataInicio] = React.useState<Date>(() => subDays(new Date(), 90));
  const [dataFim, setDataFim] = React.useState<Date>(() => new Date());

  // Construir URL com parâmetros
  const apiUrl = React.useMemo(() => {
    const params = new URLSearchParams();
    params.set('dataInicio', format(dataInicio, 'yyyy-MM-dd'));
    params.set('dataFim', format(dataFim, 'yyyy-MM-dd'));
    return `/api/financeiro/contas-receber/relatorios/inadimplencia?${params.toString()}`;
  }, [dataInicio, dataFim]);

  // Buscar dados
  const { data: relatorio, error, isLoading, mutate } = useSWR<RelatorioInadimplencia>(
    apiUrl,
    fetcher
  );

  const handleVoltar = () => {
    router.push('/financeiro/contas-receber');
  };

  const handleAtualizar = () => {
    mutate();
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={cn(/* design-system-escape: space-y-6 → migrar para <Stack gap="loose"> */ "space-y-6")}>
        <div className={cn(/* design-system-escape: gap-4 → migrar para <Inline gap="default"> */ "flex items-center gap-4")}>
          <Skeleton className="h-10 w-10" />
          <div className={cn(/* design-system-escape: space-y-2 → migrar para <Stack gap="tight"> */ "space-y-2")}>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
        <div className={cn(/* design-system-escape: gap-4 → migrar para <Inline gap="default"> */ "grid gap-4 md:grid-cols-4")}>
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={cn(/* design-system-escape: space-y-4 → migrar para <Stack gap="default"> */ "space-y-4")}>
        <Button variant="ghost" onClick={handleVoltar}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <div className={cn(/* design-system-escape: p-4 → migrar para <Inset variant="card-compact">; text-sm → migrar para <Text variant="body-sm"> */ "rounded-md bg-destructive/15 p-4 text-sm text-destructive")}>
          <p className={cn(/* design-system-escape: font-semibold → className de <Text>/<Heading> */ "font-semibold")}>Erro ao carregar relatório:</p>
          <p>{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(/* design-system-escape: space-y-6 → migrar para <Stack gap="loose"> */ "space-y-6")}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" aria-label="Voltar" onClick={handleVoltar}>
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "flex items-center gap-2")}>
          {/* Filtro de Período */}
          <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "flex items-center gap-2")}>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formatarData(dataInicio)}
                </Button>
              </PopoverTrigger>
              <PopoverContent className={cn(/* design-system-escape: p-0 → usar <Inset> */ "w-auto p-0")} align="start">
                <Calendar
                  mode="single"
                  selected={dataInicio}
                  onSelect={(date) => date && setDataInicio(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <span className={cn(/* design-system-escape: text-sm → migrar para <Text variant="body-sm"> */ "text-sm text-muted-foreground")}>até</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formatarData(dataFim)}
                </Button>
              </PopoverTrigger>
              <PopoverContent className={cn(/* design-system-escape: p-0 → usar <Inset> */ "w-auto p-0")} align="start">
                <Calendar
                  mode="single"
                  selected={dataFim}
                  onSelect={(date) => date && setDataFim(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <Button variant="outline" size="sm" onClick={handleAtualizar}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className={cn(/* design-system-escape: gap-4 → migrar para <Inline gap="default"> */ "grid gap-4 md:grid-cols-4")}>
        <Card>
          <CardHeader className={cn(/* design-system-escape: space-y-0 sem token DS; pb-2 padding direcional sem Inset equiv. */ "flex flex-row items-center justify-between space-y-0 pb-2")}>
            <CardTitle className={cn(/* design-system-escape: text-sm → migrar para <Text variant="body-sm">; font-medium → className de <Text>/<Heading> */ "text-sm font-medium")}>Contas Vencidas</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <Text variant="kpi-value">{relatorio?.resumo.totalContas || 0}</Text>
            <Text variant="caption">
              contas pendentes em atraso
            </Text>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className={cn(/* design-system-escape: space-y-0 sem token DS; pb-2 padding direcional sem Inset equiv. */ "flex flex-row items-center justify-between space-y-0 pb-2")}>
            <CardTitle className={cn(/* design-system-escape: text-sm → migrar para <Text variant="body-sm">; font-medium → className de <Text>/<Heading> */ "text-sm font-medium")}>Valor Total</CardTitle>
            <DollarSign className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <Text variant="kpi-value" className="text-destructive">
              {formatarValor(relatorio?.resumo.valorTotal || 0)}
            </Text>
            <Text variant="caption">
              em valores a receber vencidos
            </Text>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className={cn(/* design-system-escape: space-y-0 sem token DS; pb-2 padding direcional sem Inset equiv. */ "flex flex-row items-center justify-between space-y-0 pb-2")}>
            <CardTitle className={cn(/* design-system-escape: text-sm → migrar para <Text variant="body-sm">; font-medium → className de <Text>/<Heading> */ "text-sm font-medium")}>Dias Médio de Atraso</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <Text variant="kpi-value">
              {Math.round(relatorio?.resumo.diasMediaAtraso || 0)} dias
            </Text>
            <Text variant="caption">
              média de atraso nas contas
            </Text>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className={cn(/* design-system-escape: space-y-0 sem token DS; pb-2 padding direcional sem Inset equiv. */ "flex flex-row items-center justify-between space-y-0 pb-2")}>
            <CardTitle className={cn(/* design-system-escape: text-sm → migrar para <Text variant="body-sm">; font-medium → className de <Text>/<Heading> */ "text-sm font-medium")}>Clientes Inadimplentes</CardTitle>
            <Users className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <Text variant="kpi-value">
              {relatorio?.resumo.clientesInadimplentes || 0}
            </Text>
            <Text variant="caption">
              clientes com contas vencidas
            </Text>
          </CardContent>
        </Card>
      </div>

      {/* Grid: Ranking e Faixas de Atraso */}
      <div className={cn(/* design-system-escape: gap-6 → migrar para <Inline gap="loose"> */ "grid gap-6 lg:grid-cols-2")}>
        {/* Ranking de Clientes Inadimplentes */}
        <Card>
          <CardHeader>
            <CardTitle className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "flex items-center gap-2")}>
              <TrendingDown className="h-5 w-5" />
              Ranking de Inadimplência
            </CardTitle>
            <CardDescription>
              Clientes ordenados por valor total em atraso
            </CardDescription>
          </CardHeader>
          <CardContent>
            {relatorio?.clientesRanking && relatorio.clientesRanking.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="text-center">Qtd</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="text-center">Dias</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {relatorio.clientesRanking.slice(0, 10).map((cliente, index) => (
                    <TableRow key={cliente.clienteId}>
                      <TableCell>
                        <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "flex items-center gap-2")}>
                          <Badge
                            variant="outline"
                            className={cn(
                              /* design-system-escape: text-xs → migrar para <Text variant="caption" as="div"> */ 'w-6 h-6 rounded-full flex items-center justify-center text-xs',
                              index < 3 && 'bg-destructive/10 text-destructive border-destructive'
                            )}
                          >
                            {index + 1}
                          </Badge>
                          <span className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "font-medium truncate max-w-[150px]")}>
                            {cliente.clienteNome || 'Sem cliente'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">{cliente.quantidadeContas}</TableCell>
                      <TableCell className="text-right font-mono text-destructive">
                        {formatarValor(cliente.valorTotal)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">{Math.round(cliente.diasMediaAtraso)}d</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className={cn(/* design-system-escape: py-8 padding direcional sem Inset equiv. */ "py-8 text-center text-muted-foreground")}>
                Nenhum cliente inadimplente no período
              </div>
            )}
          </CardContent>
        </Card>

        {/* Distribuição por Faixa de Atraso */}
        <Card>
          <CardHeader>
            <CardTitle className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "flex items-center gap-2")}>
              <Clock className="h-5 w-5" />
              Distribuição por Faixa de Atraso
            </CardTitle>
            <CardDescription>
              Agrupamento de contas por tempo de atraso
            </CardDescription>
          </CardHeader>
          <CardContent>
            {relatorio?.faixasAtraso && relatorio.faixasAtraso.length > 0 ? (
              <div className={cn(/* design-system-escape: space-y-4 → migrar para <Stack gap="default"> */ "space-y-4")}>
                {relatorio.faixasAtraso.map((faixa) => (
                  <div key={faixa.faixa} className={cn(/* design-system-escape: space-y-2 → migrar para <Stack gap="tight"> */ "space-y-2")}>
                    <div className={cn(/* design-system-escape: text-sm → migrar para <Text variant="body-sm"> */ "flex items-center justify-between text-sm")}>
                      <span className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "font-medium")}>{faixa.faixa}</span>
                      <div className={cn(/* design-system-escape: gap-4 → migrar para <Inline gap="default"> */ "flex items-center gap-4")}>
                        <span className="text-muted-foreground">
                          {faixa.quantidadeContas} contas
                        </span>
                        <span className="font-mono text-destructive">
                          {formatarValor(faixa.valorTotal)}
                        </span>
                      </div>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-destructive transition-all"
                        style={{ width: `${Math.min(faixa.percentualTotal, 100)}%` }}
                      />
                    </div>
                    <Text variant="caption" className="text-right">
                      {faixa.percentualTotal.toFixed(1)}% do total
                    </Text>
                  </div>
                ))}
              </div>
            ) : (
              <div className={cn(/* design-system-escape: py-8 padding direcional sem Inset equiv. */ "py-8 text-center text-muted-foreground")}>
                Nenhuma conta vencida no período
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabela Detalhada de Contas Vencidas */}
      <Card>
        <CardHeader>
          <CardTitle>Contas Vencidas Detalhadas</CardTitle>
          <CardDescription>
            Lista completa de contas a receber vencidas no período selecionado
          </CardDescription>
        </CardHeader>
        <CardContent>
          {relatorio?.contasVencidas && relatorio.contasVencidas.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="text-center">Vencimento</TableHead>
                  <TableHead className="text-center">Dias Atraso</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {relatorio.contasVencidas.map((conta) => {
                  const diasAtraso = conta.dataVencimento
                    ? Math.floor(
                      (new Date().getTime() - new Date(conta.dataVencimento).getTime()) /
                      (1000 * 60 * 60 * 24)
                    )
                    : 0;

                  return (
                    <TableRow key={conta.id}>
                      <TableCell>
                        <span className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "font-medium")}>{conta.descricao}</span>
                        {conta.documento && (
                          <Text variant="caption" className="block">
                            Doc: {conta.documento}
                          </Text>
                        )}
                      </TableCell>
                      <TableCell>
                        {conta.cliente ? (
                          <span>{conta.cliente.nomeFantasia || conta.cliente.razaoSocial}</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center text-destructive">
                        {conta.dataVencimento ? formatarData(conta.dataVencimento) : '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="secondary"
                          className={cn(
                            diasAtraso > 30 && 'bg-destructive/10 text-destructive',
                            diasAtraso > 60 && 'bg-destructive text-destructive-foreground'
                          )}
                        >
                          {diasAtraso} dias
                        </Badge>
                      </TableCell>
                      <TableCell className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "text-right font-mono font-medium text-destructive")}>
                        {formatarValor(conta.valor)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className={cn(/* design-system-escape: py-8 padding direcional sem Inset equiv. */ "py-8 text-center text-muted-foreground")}>
              Nenhuma conta vencida no período selecionado
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
