'use client';

/**
 * Página de Obrigações Financeiras
 * Visão consolidada de acordos e contas a pagar/receber
 */

import * as React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useDebounce } from '@/app/_lib/hooks/use-debounce';
import { DataTable } from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { TableToolbar, type ComboboxOption, type FilterGroup } from '@/components/ui/table-toolbar';
import { AlertasObrigacoes } from './components/alertas-obrigacoes';
import { ResumoCards } from './components/resumo-cards';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  MoreHorizontal,
  RefreshCw,
  Eye,
  Link as LinkIcon,
  AlertCircle,
  CheckCircle,
  Clock,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  useObrigacoes,
  useResumoObrigacoes,
  sincronizarAcordo,
} from '@/app/_lib/hooks/use-obrigacoes';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { ColumnDef } from '@tanstack/react-table';
import type {
  ObrigacaoComDetalhes,
  TipoObrigacao,
  StatusObrigacao,
  StatusSincronizacao,
} from '@/backend/types/financeiro/obrigacoes.types';

// ============================================================================
// Constantes e Helpers
// ============================================================================

type BadgeTone = 'primary' | 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'muted';

const TIPO_CONFIG: Record<TipoObrigacao, { label: string; tone: BadgeTone }> = {
  acordo_recebimento: { label: 'Acordo - Recebimento', tone: 'success' },
  acordo_pagamento: { label: 'Acordo - Pagamento', tone: 'danger' },
  conta_receber: { label: 'Conta a Receber', tone: 'info' },
  conta_pagar: { label: 'Conta a Pagar', tone: 'warning' },
};

const STATUS_CONFIG: Record<StatusObrigacao, { label: string; tone: BadgeTone }> = {
  pendente: { label: 'Pendente', tone: 'warning' },
  vencida: { label: 'Vencida', tone: 'danger' },
  efetivada: { label: 'Efetivada', tone: 'success' },
  cancelada: { label: 'Cancelada', tone: 'neutral' },
  estornada: { label: 'Estornada', tone: 'muted' },
};

const SINCRONIZACAO_CONFIG: Record<StatusSincronizacao, { label: string; icon: React.ReactNode; className: string }> = {
  sincronizado: { label: 'Sincronizado', icon: <CheckCircle className="h-3 w-3" />, className: 'text-green-600' },
  pendente: { label: 'Pendente', icon: <Clock className="h-3 w-3" />, className: 'text-amber-600' },
  inconsistente: { label: 'Inconsistente', icon: <AlertCircle className="h-3 w-3" />, className: 'text-red-600' },
  nao_aplicavel: { label: 'N/A', icon: null, className: 'text-muted-foreground' },
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

// ============================================================================
// Filtros
// ============================================================================

const buildFilterOptions = (): ComboboxOption[] => [
  // Tipos
  { value: 'tipo_acordo_recebimento', label: 'Acordo - Recebimento' },
  { value: 'tipo_acordo_pagamento', label: 'Acordo - Pagamento' },
  { value: 'tipo_conta_receber', label: 'Conta a Receber' },
  { value: 'tipo_conta_pagar', label: 'Conta a Pagar' },
  // Status
  { value: 'status_pendente', label: 'Pendente' },
  { value: 'status_vencida', label: 'Vencida' },
  { value: 'status_efetivada', label: 'Efetivada' },
  { value: 'status_cancelada', label: 'Cancelada' },
  // Especiais
  { value: 'especial_vencidas', label: 'Apenas Vencidas' },
  { value: 'especial_inconsistentes', label: 'Apenas Inconsistentes' },
];

const buildFilterGroups = (): FilterGroup[] => [
  {
    label: 'Tipo',
    options: [
      { value: 'tipo_acordo_recebimento', label: 'Acordo - Recebimento' },
      { value: 'tipo_acordo_pagamento', label: 'Acordo - Pagamento' },
      { value: 'tipo_conta_receber', label: 'Conta a Receber' },
      { value: 'tipo_conta_pagar', label: 'Conta a Pagar' },
    ],
  },
  {
    label: 'Status',
    options: [
      { value: 'status_pendente', label: 'Pendente' },
      { value: 'status_vencida', label: 'Vencida' },
      { value: 'status_efetivada', label: 'Efetivada' },
      { value: 'status_cancelada', label: 'Cancelada' },
    ],
  },
  {
    label: 'Especial',
    options: [
      { value: 'especial_vencidas', label: 'Apenas Vencidas' },
      { value: 'especial_inconsistentes', label: 'Apenas Inconsistentes' },
    ],
  },
];

const parseFilters = (selectedIds: string[]): {
  tipos?: TipoObrigacao[];
  status?: StatusObrigacao[];
  apenasVencidas?: boolean;
  apenasInconsistentes?: boolean;
} => {
  const tipos: TipoObrigacao[] = [];
  const status: StatusObrigacao[] = [];
  let apenasVencidas = false;
  let apenasInconsistentes = false;

  for (const id of selectedIds) {
    if (id.startsWith('tipo_')) {
      const tipo = id.replace('tipo_', '') as TipoObrigacao;
      tipos.push(tipo);
    } else if (id.startsWith('status_')) {
      const st = id.replace('status_', '') as StatusObrigacao;
      status.push(st);
    } else if (id === 'especial_vencidas') {
      apenasVencidas = true;
    } else if (id === 'especial_inconsistentes') {
      apenasInconsistentes = true;
    }
  }

  return {
    tipos: tipos.length > 0 ? tipos : undefined,
    status: status.length > 0 ? status : undefined,
    apenasVencidas: apenasVencidas || undefined,
    apenasInconsistentes: apenasInconsistentes || undefined,
  };
};

// ============================================================================
// Componente de Ações
// ============================================================================

function ObrigacoesActions({
  obrigacao,
  onVerDetalhes,
  onSincronizar,
  onVerLancamento,
}: {
  obrigacao: ObrigacaoComDetalhes;
  onVerDetalhes: (obrigacao: ObrigacaoComDetalhes) => void;
  onSincronizar: (obrigacao: ObrigacaoComDetalhes) => void;
  onVerLancamento: (obrigacao: ObrigacaoComDetalhes) => void;
}) {
  const podeVerLancamento = obrigacao.lancamentoId !== null;
  const podeSincronizar = obrigacao.tipoEntidade === 'parcela' &&
    (obrigacao.statusSincronizacao === 'pendente' || obrigacao.statusSincronizacao === 'inconsistente');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Ações</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onVerDetalhes(obrigacao)}>
          <Eye className="mr-2 h-4 w-4" />
          Ver Detalhes
        </DropdownMenuItem>
        {podeVerLancamento && (
          <DropdownMenuItem onClick={() => onVerLancamento(obrigacao)}>
            <LinkIcon className="mr-2 h-4 w-4" />
            Ver Lançamento Financeiro
          </DropdownMenuItem>
        )}
        {podeSincronizar && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onSincronizar(obrigacao)}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Sincronizar
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
  onVerDetalhes: (obrigacao: ObrigacaoComDetalhes) => void,
  onSincronizar: (obrigacao: ObrigacaoComDetalhes) => void,
  onVerLancamento: (obrigacao: ObrigacaoComDetalhes) => void
): ColumnDef<ObrigacaoComDetalhes>[] {
  return [
    {
      accessorKey: 'tipo',
      header: ({ column }) => (
        <div className="flex items-center justify-center">
          <DataTableColumnHeader column={column} title="Tipo" />
        </div>
      ),
      enableSorting: true,
      size: 160,
      cell: ({ row }) => {
        const tipo = row.getValue('tipo') as TipoObrigacao;
        const config = TIPO_CONFIG[tipo];
        return (
          <div className="min-h-10 flex items-center justify-center">
            <Badge tone={config.tone} variant="soft" className="text-xs">
              {config.label}
            </Badge>
          </div>
        );
      },
    },
    {
      accessorKey: 'descricao',
      header: ({ column }) => (
        <div className="flex items-center justify-start">
          <DataTableColumnHeader column={column} title="Descrição" />
        </div>
      ),
      enableSorting: true,
      size: 280,
      meta: { align: 'left' },
      cell: ({ row }) => {
        const obrigacao = row.original;
        return (
          <div className="min-h-10 flex flex-col justify-center">
            <span className="text-sm font-medium">{obrigacao.descricao}</span>
            {obrigacao.cliente && (
              <span className="text-xs text-muted-foreground">
                {obrigacao.cliente.nome}
              </span>
            )}
            {obrigacao.processo && (
              <span className="text-xs text-muted-foreground">
                Proc. {obrigacao.processo.numeroProcesso}
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'valor',
      header: ({ column }) => (
        <div className="flex items-center justify-end">
          <DataTableColumnHeader column={column} title="Valor" />
        </div>
      ),
      enableSorting: true,
      size: 130,
      cell: ({ row }) => {
        const valor = row.getValue('valor') as number;
        return (
          <div className="min-h-10 flex items-center justify-end font-mono text-sm font-medium">
            {formatarValor(valor)}
          </div>
        );
      },
    },
    {
      accessorKey: 'dataVencimento',
      header: ({ column }) => (
        <div className="flex items-center justify-center">
          <DataTableColumnHeader column={column} title="Vencimento" />
        </div>
      ),
      enableSorting: true,
      size: 120,
      cell: ({ row }) => {
        const obrigacao = row.original;
        const isVencida = obrigacao.status === 'vencida';
        return (
          <div
            className={cn(
              'min-h-10 flex items-center justify-center text-sm',
              isVencida && 'text-destructive font-medium'
            )}
          >
            {formatarData(obrigacao.dataVencimento)}
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
      size: 100,
      cell: ({ row }) => {
        const status = row.getValue('status') as StatusObrigacao;
        const config = STATUS_CONFIG[status];
        return (
          <div className="min-h-10 flex items-center justify-center">
            <Badge tone={config.tone} variant="soft">
              {config.label}
            </Badge>
          </div>
        );
      },
    },
    {
      accessorKey: 'statusSincronizacao',
      header: ({ column }) => (
        <div className="flex items-center justify-center">
          <DataTableColumnHeader column={column} title="Sinc." />
        </div>
      ),
      enableSorting: false,
      size: 80,
      cell: ({ row }) => {
        const status = row.getValue('statusSincronizacao') as StatusSincronizacao;
        const config = SINCRONIZACAO_CONFIG[status];
        return (
          <div className={cn('min-h-10 flex items-center justify-center gap-1', config.className)}>
            {config.icon}
            <span className="text-xs">{config.label}</span>
          </div>
        );
      },
    },
    {
      id: 'acoes',
      header: () => (
        <div className="flex items-center justify-center">
          <span className="text-sm font-medium">Ações</span>
        </div>
      ),
      enableSorting: false,
      size: 80,
      cell: ({ row }) => {
        const obrigacao = row.original;
        return (
          <div className="min-h-10 flex items-center justify-center">
            <ObrigacoesActions
              obrigacao={obrigacao}
              onVerDetalhes={onVerDetalhes}
              onSincronizar={onSincronizar}
              onVerLancamento={onVerLancamento}
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

export default function ObrigacoesPage() {
  // Estados de filtros e busca
  const [busca, setBusca] = React.useState('');
  const [pagina, setPagina] = React.useState(0);
  const [limite, setLimite] = React.useState(50);
  const [selectedFilterIds, setSelectedFilterIds] = React.useState<string[]>(['status_pendente']);


  // Preparar opções de filtros
  const filterOptions = React.useMemo(() => buildFilterOptions(), []);
  const filterGroups = React.useMemo(() => buildFilterGroups(), []);

  // Debounce da busca
  const buscaDebounced = useDebounce(busca, 500);

  // Parse dos filtros selecionados
  const parsedFilters = React.useMemo(() => parseFilters(selectedFilterIds), [selectedFilterIds]);

  // Parâmetros de busca
  const params = React.useMemo(() => ({
    pagina: pagina + 1,
    limite,
    busca: buscaDebounced || undefined,
    ...parsedFilters,
  }), [pagina, limite, buscaDebounced, parsedFilters]);

  // Hook de dados
  const { obrigacoes, paginacao, resumo, isLoading, error, refetch } = useObrigacoes(params);

  // Hook de resumo com alertas
  const { alertas, isLoading: isLoadingAlertas } = useResumoObrigacoes({
    incluirAlertas: true,
  });

  // Handlers
  const handleFilterIdsChange = React.useCallback((selectedIds: string[]) => {
    setSelectedFilterIds(selectedIds);
    setPagina(0);
  }, []);

  const handleVerDetalhes = React.useCallback((obrigacao: ObrigacaoComDetalhes) => {
    // Gerar ID da obrigação para a rota
    const obrigacaoId = obrigacao.tipoEntidade === 'parcela' && obrigacao.parcelaId
      ? `${obrigacao.tipoEntidade}_${obrigacao.parcelaId}`
      : obrigacao.id;
    
    // Navegar para a página de detalhes
    window.location.href = `/financeiro/obrigacoes/${obrigacaoId}`;
  }, []);

  const handleSincronizar = React.useCallback(async (obrigacao: ObrigacaoComDetalhes) => {
    if (!obrigacao.acordoId) {
      toast.error('Obrigação não possui acordo vinculado');
      return;
    }

    try {
      const resultado = await sincronizarAcordo(obrigacao.acordoId, false);
      if (!resultado.success) {
        throw new Error(resultado.error);
      }
      toast.success('Sincronização realizada com sucesso');
      refetch();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao sincronizar';
      toast.error(message);
    }
  }, [refetch]);

  const handleVerLancamento = React.useCallback((obrigacao: ObrigacaoComDetalhes) => {
    if (!obrigacao.lancamentoId) {
      toast.error('Lançamento financeiro não encontrado');
      return;
    }
    // Determinar rota baseada no tipo
    const rota = obrigacao.tipo === 'conta_pagar' || obrigacao.tipo === 'acordo_pagamento'
      ? `/financeiro/contas-pagar/${obrigacao.lancamentoId}`
      : `/financeiro/contas-receber/${obrigacao.lancamentoId}`;

    window.location.href = rota;
  }, []);

  // Handlers para alertas
  const handleFiltrarVencidas = React.useCallback(() => {
    setSelectedFilterIds(['especial_vencidas']);
    setPagina(0);
  }, []);

  const handleFiltrarHoje = React.useCallback(() => {
    setSelectedFilterIds(['status_pendente']);
    setPagina(0);
    // Adicionar filtro de data para hoje se necessário
  }, []);

  const handleFiltrarInconsistentes = React.useCallback(() => {
    setSelectedFilterIds(['especial_inconsistentes']);
    setPagina(0);
  }, []);

  // Definir colunas
  const colunas = React.useMemo(
    () => criarColunas(handleVerDetalhes, handleSincronizar, handleVerLancamento),
    [handleVerDetalhes, handleSincronizar, handleVerLancamento]
  );

  const isSearching = busca !== buscaDebounced && busca.length > 0;

  return (
    <div className="space-y-4">
      {/* Cards de Resumo */}
      <ResumoCards resumo={resumo} isLoading={isLoading} />

      {/* Alertas */}
      <AlertasObrigacoes
        alertas={alertas}
        isLoading={isLoadingAlertas}
        onFiltrarVencidas={handleFiltrarVencidas}
        onFiltrarHoje={handleFiltrarHoje}
        onFiltrarInconsistentes={handleFiltrarInconsistentes}
      />

      {/* Toolbar */}
      <TableToolbar
        searchValue={busca}
        onSearchChange={(value) => {
          setBusca(value);
          setPagina(0);
        }}
        isSearching={isSearching}
        searchPlaceholder="Buscar por descrição, cliente ou processo..."
        filterOptions={filterOptions}
        filterGroups={filterGroups}
        selectedFilters={selectedFilterIds}
        onFiltersChange={handleFilterIdsChange}
        filterButtonsMode="buttons"
      />

      {/* Mensagem de erro */}
      {error && (
        <div className="rounded-md bg-destructive/15 p-4 text-sm text-destructive">
          <p className="font-semibold">Erro ao carregar obrigações:</p>
          <p>{error}</p>
        </div>
      )}

      {/* Tabela */}
      <DataTable
        data={obrigacoes}
        columns={colunas}
        pagination={
          paginacao
            ? {
                pageIndex: paginacao.pagina - 1,
                pageSize: paginacao.limite,
                total: paginacao.total,
                totalPages: paginacao.totalPaginas,
                onPageChange: setPagina,
                onPageSizeChange: setLimite,
              }
            : undefined
        }
        sorting={undefined}
        isLoading={isLoading}
        error={error}
        emptyMessage="Nenhuma obrigação encontrada."
      />

    </div>
  );
}
