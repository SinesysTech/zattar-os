'use client';

/**
 * Página de Orçamentos
 * Lista e gerencia orçamentos empresariais
 */

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useDebounce } from '@/hooks/use-debounce';
import { DataPagination, DataShell, DataTable } from '@/components/shared/data-shell';
import { DataTableColumnHeader } from '@/components/shared/data-shell/data-table-column-header';
import { TableToolbar } from '@/components/ui/table-toolbar';
import {
  buildOrcamentosFilterOptions,
  buildOrcamentosFilterGroups,
  parseOrcamentosFilters,
  OrcamentoFormDialog,
  ResumoCards,
} from '@/features/financeiro';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  MoreHorizontal,
  Eye,
  Pencil,
  CheckCircle2,
  PlayCircle,
  Archive,
  Trash2,
  BarChart3,
  FileDown,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  useOrcamentos,
  aprovarOrcamento,
  iniciarExecucaoOrcamento,
  encerrarOrcamento,
  excluirOrcamento,
} from '@/features/financeiro';
import { toast } from 'sonner';
import type { ColumnDef } from '@tanstack/react-table';
import type {
  OrcamentoComItens,
  StatusOrcamento,
} from '@/features/financeiro';
import {
  exportarOrcamentoCSV,
  exportarRelatorioPDF,
} from '@/features/financeiro';

// ============================================================================
// Constantes e Helpers
// ============================================================================

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning';

const STATUS_CONFIG: Record<StatusOrcamento, { label: string; tone: BadgeVariant }> = {
  rascunho: { label: 'Rascunho', tone: 'secondary' },
  aprovado: { label: 'Aprovado', tone: 'default' }, // 'info' mapped to 'default' or similar
  em_execucao: { label: 'Em Execução', tone: 'success' },
  encerrado: { label: 'Encerrado', tone: 'outline' }, // 'muted' mapped to 'outline'
  cancelado: { label: 'Cancelado', tone: 'destructive' },
};

const PERIODO_LABELS: Record<string, string> = {
  mensal: 'Mensal',
  trimestral: 'Trimestral',
  semestral: 'Semestral',
  anual: 'Anual',
};

const formatarValor = (valor: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
};

const formatarData = (data: string | null): string => {
  if (!data) return '-';
  return format(new Date(data), 'dd/MM/yyyy', { locale: ptBR });
};

const calcularTotalOrcado = (orcamento: OrcamentoComItens): number => {
  return orcamento.itens?.reduce((sum, item) => sum + item.valorPrevisto, 0) || 0;
};

// ============================================================================
// Componente de Ações
// ============================================================================

function OrcamentosActions({
  orcamento,
  onVerDetalhes,
  onEditar,
  onAprovar,
  onIniciarExecucao,
  onEncerrar,
  onExcluir,
  onVerAnalise,
  onExportar,
}: {
  orcamento: OrcamentoComItens;
  onVerDetalhes: (orc: OrcamentoComItens) => void;
  onEditar: (orc: OrcamentoComItens) => void;
  onAprovar: (orc: OrcamentoComItens) => void;
  onIniciarExecucao: (orc: OrcamentoComItens) => void;
  onEncerrar: (orc: OrcamentoComItens) => void;
  onExcluir: (orc: OrcamentoComItens) => void;
  onVerAnalise: (orc: OrcamentoComItens) => void;
  onExportar: (orc: OrcamentoComItens) => void;
}) {
  const isRascunho = orcamento.status === 'rascunho';
  const isAprovado = orcamento.status === 'aprovado';
  const isEmExecucao = orcamento.status === 'em_execucao';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Ações do orçamento</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onVerDetalhes(orcamento)}>
          <Eye className="mr-2 h-4 w-4" />
          Ver Detalhes
        </DropdownMenuItem>
        {(isEmExecucao || orcamento.status === 'encerrado') && (
          <DropdownMenuItem onClick={() => onVerAnalise(orcamento)}>
            <BarChart3 className="mr-2 h-4 w-4" />
            Ver Análise
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={() => onExportar(orcamento)}>
          <FileDown className="mr-2 h-4 w-4" />
          Exportar
        </DropdownMenuItem>
        {isRascunho && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onEditar(orcamento)}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAprovar(orcamento)}>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Aprovar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onExcluir(orcamento)} className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </DropdownMenuItem>
          </>
        )}
        {isAprovado && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onIniciarExecucao(orcamento)}>
              <PlayCircle className="mr-2 h-4 w-4" />
              Iniciar Execução
            </DropdownMenuItem>
          </>
        )}
        {isEmExecucao && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onEncerrar(orcamento)}>
              <Archive className="mr-2 h-4 w-4" />
              Encerrar
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ============================================================================
// Definição das Colunas
// ============================================================================

function criarColunas(
  onVerDetalhes: (orc: OrcamentoComItens) => void,
  onEditar: (orc: OrcamentoComItens) => void,
  onAprovar: (orc: OrcamentoComItens) => void,
  onIniciarExecucao: (orc: OrcamentoComItens) => void,
  onEncerrar: (orc: OrcamentoComItens) => void,
  onExcluir: (orc: OrcamentoComItens) => void,
  onVerAnalise: (orc: OrcamentoComItens) => void,
  onExportar: (orc: OrcamentoComItens) => void
): ColumnDef<OrcamentoComItens>[] {
  return [
    {
      accessorKey: 'nome',
      header: ({ column }) => (
        <div className="flex items-center justify-start">
          <DataTableColumnHeader column={column} title="Nome" />
        </div>
      ),
      enableSorting: true,
      size: 280,
      meta: { align: 'left' },
      cell: ({ row }) => {
        const orcamento = row.original;
        return (
          <div className="min-h-10 flex flex-col justify-center">
            <span className="text-sm font-medium">{orcamento.nome}</span>
            {orcamento.descricao && (
              <span className="text-xs text-muted-foreground line-clamp-1">
                {orcamento.descricao}
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'ano',
      header: ({ column }) => (
        <div className="flex items-center justify-center">
          <DataTableColumnHeader column={column} title="Ano" />
        </div>
      ),
      enableSorting: true,
      size: 80,
      cell: ({ row }) => {
        return (
          <div className="min-h-10 flex items-center justify-center font-medium">
            {row.getValue('ano')}
          </div>
        );
      },
    },
    {
      accessorKey: 'periodo',
      header: ({ column }) => (
        <div className="flex items-center justify-center">
          <DataTableColumnHeader column={column} title="Período" />
        </div>
      ),
      enableSorting: true,
      size: 100,
      cell: ({ row }) => {
        const periodo = row.getValue('periodo') as string;
        return (
          <div className="min-h-10 flex items-center justify-center">
            <Badge variant="outline">{PERIODO_LABELS[periodo] || periodo}</Badge>
          </div>
        );
      },
    },
    {
      id: 'dataVigencia',
      header: ({ column }) => (
        <div className="flex items-center justify-center">
          <DataTableColumnHeader column={column} title="Vigência" />
        </div>
      ),
      size: 180,
      cell: ({ row }) => {
        const orcamento = row.original;
        return (
          <div className="min-h-10 flex items-center justify-center text-sm">
            {formatarData(orcamento.dataInicio)} - {formatarData(orcamento.dataFim)}
          </div>
        );
      },
    },
    {
      id: 'valorTotal',
      header: ({ column }) => (
        <div className="flex items-center justify-end">
          <DataTableColumnHeader column={column} title="Valor Total" />
        </div>
      ),
      size: 130,
      cell: ({ row }) => {
        const total = calcularTotalOrcado(row.original);
        return (
          <div className="min-h-10 flex items-center justify-end font-mono text-sm font-medium">
            {formatarValor(total)}
          </div>
        );
      },
    },
    {
      id: 'itens',
      header: () => (
        <div className="flex items-center justify-center text-sm font-medium">Itens</div>
      ),
      size: 70,
      cell: ({ row }) => {
        const qtdItens = row.original.itens?.length || 0;
        return (
          <div className="min-h-10 flex items-center justify-center">
            <Badge variant="outline" className="font-mono">
              {qtdItens}
            </Badge>
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: ({ column }) => (
        <div className="flex items-center justify-center">
          <DataTableColumnHeader column={column} title="Status" />
        </div>
      ),
      enableSorting: true,
      size: 120,
      cell: ({ row }) => {
        const status = row.getValue('status') as StatusOrcamento;
        const config = STATUS_CONFIG[status];
        return (
          <div className="min-h-10 flex items-center justify-center">
            <Badge variant={config.tone}>
              {config.label}
            </Badge>
          </div>
        );
      },
    },
    {
      id: 'acoes',
      header: () => (
        <div className="flex items-center justify-center">
          <div className="text-sm font-medium">Ações</div>
        </div>
      ),
      enableSorting: false,
      size: 80,
      cell: ({ row }) => {
        const orcamento = row.original;
        return (
          <div className="min-h-10 flex items-center justify-center">
            <OrcamentosActions
              orcamento={orcamento}
              onVerDetalhes={onVerDetalhes}
              onEditar={onEditar}
              onAprovar={onAprovar}
              onIniciarExecucao={onIniciarExecucao}
              onEncerrar={onEncerrar}
              onExcluir={onExcluir}
              onVerAnalise={onVerAnalise}
              onExportar={onExportar}
            />
          </div>
        );
      },
    },
  ];
}

// ============================================================================
// Página Principal
// ============================================================================

interface OrcamentosClientPageProps {
  usuarioId: string;
}

export default function OrcamentosClientPage({ usuarioId }: OrcamentosClientPageProps) {
  const router = useRouter();

  // Estados de filtros e busca
  const [busca, setBusca] = React.useState('');
  const [pagina, setPagina] = React.useState(0);
  const [limite, setLimite] = React.useState(50);
  const [selectedFilterIds, setSelectedFilterIds] = React.useState<string[]>([]);

  // Estados de dialogs
  const [formDialogOpen, setFormDialogOpen] = React.useState(false);
  const [selectedOrcamento, setSelectedOrcamento] = React.useState<OrcamentoComItens | null>(null);
  const [aprovarDialogOpen, setAprovarDialogOpen] = React.useState(false);
  const [iniciarDialogOpen, setIniciarDialogOpen] = React.useState(false);
  const [encerrarDialogOpen, setEncerrarDialogOpen] = React.useState(false);
  const [excluirDialogOpen, setExcluirDialogOpen] = React.useState(false);

  // Preparar opções de filtros
  const filterOptions = React.useMemo(() => buildOrcamentosFilterOptions(), []);
  const filterGroups = React.useMemo(() => buildOrcamentosFilterGroups(), []);

  // Debounce da busca
  const buscaDebounced = useDebounce(busca, 500);

  // Parâmetros de busca
  const params = React.useMemo(() => {
    const parsedFilters = parseOrcamentosFilters(selectedFilterIds);
    return {
      pagina: pagina + 1,
      limite,
      busca: buscaDebounced || undefined,
      ...parsedFilters,
    };
  }, [pagina, limite, buscaDebounced, selectedFilterIds]);

  // Hook de dados
  const { orcamentos, total, isLoading, error, refetch } = useOrcamentos({
    autoFetch: true,
    filters: params,
  });

  // Calcular totais por status
  const totais = React.useMemo(() => {
    const totaisPorStatus = {
      rascunho: 0,
      aprovado: 0,
      emExecucao: 0,
      encerrado: 0,
    };

    orcamentos.forEach((orc) => {
      switch (orc.status) {
        case 'rascunho':
          totaisPorStatus.rascunho++;
          break;
        case 'aprovado':
          totaisPorStatus.aprovado++;
          break;
        case 'em_execucao':
          totaisPorStatus.emExecucao++;
          break;
        case 'encerrado':
          totaisPorStatus.encerrado++;
          break;
      }
    });

    return totaisPorStatus;
  }, [orcamentos]);

  // Handlers de navegação por filtro
  const handleFilterIdsChange = React.useCallback((selectedIds: string[]) => {
    setSelectedFilterIds(selectedIds);
    setPagina(0);
  }, []);

  const handleFiltrarRascunho = React.useCallback(() => {
    setSelectedFilterIds(['status_rascunho']);
    setPagina(0);
  }, []);

  const handleFiltrarAprovado = React.useCallback(() => {
    setSelectedFilterIds(['status_aprovado']);
    setPagina(0);
  }, []);

  const handleFiltrarEmExecucao = React.useCallback(() => {
    setSelectedFilterIds(['status_em_execucao']);
    setPagina(0);
  }, []);

  const handleFiltrarEncerrado = React.useCallback(() => {
    setSelectedFilterIds(['status_encerrado']);
    setPagina(0);
  }, []);

  // Handlers de ações
  const handleVerDetalhes = React.useCallback(
    (orcamento: OrcamentoComItens) => {
      router.push(`/financeiro/orcamentos/${orcamento.id}`);
    },
    [router]
  );

  const handleEditar = React.useCallback((orcamento: OrcamentoComItens) => {
    setSelectedOrcamento(orcamento);
    setFormDialogOpen(true);
  }, []);

  const handleAprovar = React.useCallback((orcamento: OrcamentoComItens) => {
    setSelectedOrcamento(orcamento);
    setAprovarDialogOpen(true);
  }, []);

  const handleIniciarExecucao = React.useCallback((orcamento: OrcamentoComItens) => {
    setSelectedOrcamento(orcamento);
    setIniciarDialogOpen(true);
  }, []);

  const handleEncerrar = React.useCallback((orcamento: OrcamentoComItens) => {
    setSelectedOrcamento(orcamento);
    setEncerrarDialogOpen(true);
  }, []);

  const handleExcluir = React.useCallback((orcamento: OrcamentoComItens) => {
    setSelectedOrcamento(orcamento);
    setExcluirDialogOpen(true);
  }, []);

  const handleVerAnalise = React.useCallback(
    (orcamento: OrcamentoComItens) => {
      router.push(`/financeiro/orcamentos/${orcamento.id}/analise`);
    },
    [router]
  );

  const [isExporting, setIsExporting] = React.useState(false);

  const handleExportar = React.useCallback(async (orcamento: OrcamentoComItens) => {
    if (isExporting) return;

    try {
      setIsExporting(true);

      // Se orçamento está em execução ou encerrado, buscar relatório completo para exportar
      if (orcamento.status === 'em_execucao' || orcamento.status === 'encerrado') {
        toast.info('Gerando relatório PDF...');

        const response = await fetch(`/api/financeiro/orcamentos/${orcamento.id}/relatorio?formato=json`);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
          throw new Error(errorData.error || 'Erro ao buscar relatório');
        }

        const data = await response.json();
        if (!data.success || !data.data) {
          throw new Error('Não foi possível gerar o relatório');
        }

        // Converter estrutura da API para formato esperado pelo exportador
        const relatorio = {
          orcamento: data.data.orcamento,
          analise: data.data.analise,
          resumo: data.data.analise?.resumo || null,
          alertas: data.data.analise?.alertas || [],
          evolucao: data.data.analise?.evolucao || [],
          projecao: null,
          geradoEm: data.data.geradoEm,
        };

        await exportarRelatorioPDF(relatorio);
        toast.success('Relatório PDF exportado com sucesso');
      } else {
        // Para orçamentos em rascunho ou aprovados, exportar apenas dados básicos
        exportarOrcamentoCSV(orcamento);
        toast.success('Orçamento exportado para CSV');
      }
    } catch (error) {
      console.error('Erro ao exportar:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao exportar');
    } finally {
      setIsExporting(false);
    }
  }, [isExporting]);

  const handleNovo = React.useCallback(() => {
    setSelectedOrcamento(null);
    setFormDialogOpen(true);
  }, []);

  // Handlers de confirmação
  const handleConfirmAprovar = React.useCallback(async () => {
    if (!selectedOrcamento) return;

    try {
      const resultado = await aprovarOrcamento(selectedOrcamento.id);
      if (!resultado.success) {
        throw new Error(resultado.error);
      }
      toast.success('Orçamento aprovado com sucesso');
      setAprovarDialogOpen(false);
      refetch();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao aprovar orçamento';
      toast.error(message);
    }
  }, [selectedOrcamento, refetch]);

  const handleConfirmIniciar = React.useCallback(async () => {
    if (!selectedOrcamento) return;

    try {
      const resultado = await iniciarExecucaoOrcamento(selectedOrcamento.id);
      if (!resultado.success) {
        throw new Error(resultado.error);
      }
      toast.success('Execução do orçamento iniciada com sucesso');
      setIniciarDialogOpen(false);
      refetch();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao iniciar execução';
      toast.error(message);
    }
  }, [selectedOrcamento, refetch]);

  const handleConfirmEncerrar = React.useCallback(async () => {
    if (!selectedOrcamento) return;

    try {
      const resultado = await encerrarOrcamento(selectedOrcamento.id);
      if (!resultado.success) {
        throw new Error(resultado.error);
      }
      toast.success('Orçamento encerrado com sucesso');
      setEncerrarDialogOpen(false);
      refetch();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao encerrar orçamento';
      toast.error(message);
    }
  }, [selectedOrcamento, refetch]);

  const handleConfirmExcluir = React.useCallback(async () => {
    if (!selectedOrcamento) return;

    try {
      const resultado = await excluirOrcamento(selectedOrcamento.id);
      if (!resultado.success) {
        throw new Error(resultado.error);
      }
      toast.success('Orçamento excluído com sucesso');
      setExcluirDialogOpen(false);
      refetch();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao excluir orçamento';
      toast.error(message);
    }
  }, [selectedOrcamento, refetch]);

  // Definir colunas
  const colunas = React.useMemo(
    () =>
      criarColunas(
        handleVerDetalhes,
        handleEditar,
        handleAprovar,
        handleIniciarExecucao,
        handleEncerrar,
        handleExcluir,
        handleVerAnalise,
        handleExportar
      ),
    [
      handleVerDetalhes,
      handleEditar,
      handleAprovar,
      handleIniciarExecucao,
      handleEncerrar,
      handleExcluir,
      handleVerAnalise,
      handleExportar,
    ]
  );

  const isSearching = busca !== buscaDebounced && busca.length > 0;

  return (
    <div className="space-y-4">
      {/* Cards de Resumo */}
      <ResumoCards
        totais={totais}
        isLoading={isLoading}
        onFiltrarRascunho={handleFiltrarRascunho}
        onFiltrarAprovado={handleFiltrarAprovado}
        onFiltrarEmExecucao={handleFiltrarEmExecucao}
        onFiltrarEncerrado={handleFiltrarEncerrado}
      />

      <DataShell
        header={
          <TableToolbar
            variant="integrated"
            searchValue={busca}
            onSearchChange={(value) => {
              setBusca(value);
              setPagina(0);
            }}
            isSearching={isSearching}
            searchPlaceholder="Buscar por nome ou descrição..."
            filterOptions={filterOptions}
            filterGroups={filterGroups}
            selectedFilters={selectedFilterIds}
            onFiltersChange={handleFilterIdsChange}
            filterButtonsMode="buttons"
            onNewClick={handleNovo}
            newButtonTooltip="Novo Orçamento"
          />
        }
        footer={
          total > 0 ? (
            <DataPagination
              pageIndex={pagina}
              pageSize={limite}
              total={total}
              totalPages={Math.ceil(total / limite)}
              onPageChange={setPagina}
              onPageSizeChange={setLimite}
              isLoading={isLoading}
            />
          ) : null
        }
      >
        <div className="relative border-t">
          <DataTable
            data={orcamentos}
            columns={colunas}
            pagination={{
              pageIndex: pagina,
              pageSize: limite,
              total,
              totalPages: Math.ceil(total / limite),
              onPageChange: setPagina,
              onPageSizeChange: setLimite,
            }}
            sorting={undefined}
            isLoading={isLoading}
            error={error}
            emptyMessage="Nenhum orçamento encontrado."
            hideTableBorder={true}
            hidePagination={true}
          />
        </div>
      </DataShell>

      {/* Dialog de Formulário */}
      <OrcamentoFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        orcamento={selectedOrcamento}
        usuarioId={usuarioId}
        onSuccess={refetch}
      />

      {/* Dialog de Aprovação */}
      <AlertDialog open={aprovarDialogOpen} onOpenChange={setAprovarDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Aprovar Orçamento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja aprovar este orçamento?
              {selectedOrcamento && (
                <span className="block mt-2 font-medium text-foreground">
                  {selectedOrcamento.nome} - {selectedOrcamento.ano}
                </span>
              )}
              <span className="block mt-2 text-muted-foreground">
                Após aprovado, o orçamento poderá ser iniciado para execução.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmAprovar}>Aprovar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de Iniciar Execução */}
      <AlertDialog open={iniciarDialogOpen} onOpenChange={setIniciarDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Iniciar Execução</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja iniciar a execução deste orçamento?
              {selectedOrcamento && (
                <span className="block mt-2 font-medium text-foreground">
                  {selectedOrcamento.nome} - {selectedOrcamento.ano}
                </span>
              )}
              <span className="block mt-2 text-muted-foreground">
                Os lançamentos financeiros passarão a ser comparados com este orçamento.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmIniciar}>Iniciar Execução</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de Encerramento */}
      <AlertDialog open={encerrarDialogOpen} onOpenChange={setEncerrarDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Encerrar Orçamento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja encerrar este orçamento?
              {selectedOrcamento && (
                <span className="block mt-2 font-medium text-foreground">
                  {selectedOrcamento.nome} - {selectedOrcamento.ano}
                </span>
              )}
              <span className="block mt-2 text-amber-600">
                Após encerrado, o orçamento ficará disponível apenas para consulta.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmEncerrar}>Encerrar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de Exclusão */}
      <AlertDialog open={excluirDialogOpen} onOpenChange={setExcluirDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Orçamento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este orçamento?
              {selectedOrcamento && (
                <span className="block mt-2 font-medium text-foreground">
                  {selectedOrcamento.nome} - {selectedOrcamento.ano}
                </span>
              )}
              <span className="block mt-2 text-destructive font-medium">
                Esta ação não pode ser desfeita!
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmExcluir}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
