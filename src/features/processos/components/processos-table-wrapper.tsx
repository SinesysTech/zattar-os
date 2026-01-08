'use client';

/**
 * ProcessosTableWrapper - Componente Client que encapsula a tabela de processos
 *
 * Recebe dados iniciais do Server Component e gerencia:
 * - Estado de busca e filtros
 * - Paginacao client-side com refresh via Server Actions
 * - Sheet de visualizacao de detalhes
 */

import * as React from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useDebounce } from '@/hooks/use-debounce';
import { DataShell, DataPagination, DataTable, DataTableToolbar } from '@/components/shared/data-shell';
import { DataTableColumnHeader } from '@/components/shared/data-shell/data-table-column-header';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Combobox } from '@/components/ui/combobox';
import {
  GrauBadgesSimple,
  ProcessosEmptyState,
  ProcessoStatusBadge,
  ProximaAudienciaPopover,
} from '@/features/processos/components';
import { actionListarProcessos } from '@/features/processos/actions';
import type {
  Processo,
  ProcessoUnificado,
} from '@/features/processos/types';
import {
  buildProcessosFilterOptions,
  buildProcessosFilterGroups,
} from './processos-toolbar-filters';
import { GRAU_LABELS } from '@/lib/design-system';
import { cn } from '@/lib/utils';
import { Eye, Lock, CheckCircle, XCircle, Link2 } from 'lucide-react';
import { CopyButton } from '@/features/partes';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ProcessosAlterarResponsavelDialog } from './processos-alterar-responsavel-dialog';
import { actionListarUsuarios } from '@/features/usuarios';
import { AppBadge } from '@/components/ui/app-badge';
import { SemanticBadge } from '@/components/ui/semantic-badge';
import { ParteBadge } from '@/components/ui/parte-badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { ColumnDef, Row, Table as TanstackTable } from '@tanstack/react-table';

// =============================================================================
// TIPOS
// =============================================================================

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

interface Usuario {
  id: number;
  nomeExibicao: string;
}


interface ProcessosTableWrapperProps {
  initialData: ProcessoUnificado[];
  initialPagination: PaginationInfo | null;
  initialUsers: Record<number, { nome: string }>;
  initialTribunais: Array<{ codigo: string; nome: string }>;
}

// =============================================================================
// HELPERS
// =============================================================================

const isProcessoUnificado = (processo: Processo | ProcessoUnificado): processo is ProcessoUnificado => {
  return 'instances' in processo && 'grauAtual' in processo;
};

const formatarData = (dataISO: string | null): string => {
  if (!dataISO) return '-';
  try {
    const data = new Date(dataISO);
    return data.toLocaleDateString('pt-BR');
  } catch {
    return '-';
  }
};

const formatarGrau = (grau: string): string => {
  return GRAU_LABELS[grau as keyof typeof GRAU_LABELS] || grau;
};

const formatarDataHora = (dataISO: string | null): string => {
  if (!dataISO) return '-';
  try {
    const data = new Date(dataISO);
    return data.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '-';
  }
};

// Labels para origem
const ORIGEM_LABELS: Record<string, string> = {
  acervo_geral: 'Acervo Geral',
  arquivado: 'Arquivado',
};

/**
 * Retorna o órgão julgador do processo de forma segura
 */
function getOrgaoJulgador(processo: ProcessoUnificado): string {
  return processo.descricaoOrgaoJulgador || '-';
}

// =============================================================================
// CELL COMPONENTS
// =============================================================================

function ProcessoNumeroCell({ row }: { row: Row<ProcessoUnificado> }) {
  const processo = row.original;
  const classeJudicial = processo.classeJudicial || '';
  const numeroProcesso = processo.numeroProcesso;
  const orgaoJulgador = getOrgaoJulgador(processo);
  // FONTE DA VERDADE: Usar trtOrigem (1º grau) ao invés de trt (grau atual)
  // Isso garante que processos no TST ou 2º grau mostrem o tribunal de origem
  const trt = processo.trtOrigem || processo.trt;
  const isUnificado = isProcessoUnificado(processo);
  const segredoJustica = processo.segredoJustica;
  const dataProximaAudiencia = processo.dataProximaAudiencia;

  return (
    <div className="min-h-10 flex flex-col items-start justify-center gap-1.5 max-w-[min(92vw,23.75rem)] group">
      <div className="flex items-center gap-1.5 flex-wrap">
        <SemanticBadge category="tribunal" value={trt} className="w-fit text-xs">
          {trt}
        </SemanticBadge>
        {isUnificado ? (
          <GrauBadgesSimple grausAtivos={(processo as ProcessoUnificado).grausAtivos} />
        ) : (
          <SemanticBadge category="grau" value={(processo as Processo).grau} className="w-fit text-xs">
            {formatarGrau((processo as Processo).grau)}
          </SemanticBadge>
        )}
      </div>
      <div className="flex items-center gap-1.5">
        <div className="text-sm font-medium whitespace-nowrap">
          {classeJudicial && `${classeJudicial} `}
          {numeroProcesso}
        </div>
        <CopyButton text={numeroProcesso} label="Copiar número do processo" />
        {segredoJustica && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Lock className="h-3.5 w-3.5 text-destructive" />
              </TooltipTrigger>
              <TooltipContent>Segredo de Justiça</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-muted-foreground max-w-full truncate">{orgaoJulgador}</span>
        <ProximaAudienciaPopover dataAudiencia={dataProximaAudiencia} />
      </div>
    </div>
  );
}

/**
 * Retorna as iniciais do nome para o Avatar
 */
function getInitials(name: string): string {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Célula de Responsável com Avatar e Diálogo para alteração
 */
function ProcessoResponsavelCell({
  processo,
  usuarios = [],
  onSuccess,
}: {
  processo: ProcessoUnificado;
  usuarios?: Usuario[];
  onSuccess?: () => void;
}) {
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [localProcesso, setLocalProcesso] = React.useState(processo);

  // Atualizar processo local quando o processo prop mudar
  React.useEffect(() => {
    setLocalProcesso(processo);
  }, [processo]);

  const responsavel = usuarios.find((u) => u.id === localProcesso.responsavelId);
  const nomeExibicao = responsavel?.nomeExibicao || '-';

  const handleSuccess = React.useCallback((updatedProcesso?: ProcessoUnificado) => {
    console.log('[ProcessoResponsavelCell] onSuccess chamado', { updatedProcesso });
    // Atualizar processo local se fornecido
    if (updatedProcesso && updatedProcesso.id === localProcesso.id) {
      setLocalProcesso(updatedProcesso);
      console.log('[ProcessoResponsavelCell] Processo local atualizado:', updatedProcesso);
    }
    onSuccess?.();
  }, [onSuccess, localProcesso.id]);

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsDialogOpen(true);
        }}
        className="flex items-center justify-center gap-2 text-xs w-full min-w-0 hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 rounded px-1 -mx-1"
        title={nomeExibicao !== '-' ? `Clique para alterar responsável: ${nomeExibicao}` : 'Clique para atribuir responsável'}
      >
        {responsavel ? (
          <>
            <Avatar className="h-6 w-6 shrink-0">
              <AvatarImage src={undefined} alt={responsavel.nomeExibicao} />
              <AvatarFallback className="text-[10px] font-medium">
                {getInitials(responsavel.nomeExibicao)}
              </AvatarFallback>
            </Avatar>
            <span>{responsavel.nomeExibicao}</span>
          </>
        ) : (
          <span className="text-muted-foreground">Não atribuído</span>
        )}
      </button>

      <ProcessosAlterarResponsavelDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        processo={localProcesso}
        usuarios={usuarios}
        onSuccess={handleSuccess}
      />
    </>
  );
}

// =============================================================================
// COLUMNS
// =============================================================================

function criarColunas(
  usuariosMap: Record<number, { nome: string }>,
  usuarios: Usuario[],
  onSuccess: (updatedProcesso?: ProcessoUnificado) => void
): ColumnDef<ProcessoUnificado>[] {
  return [
    // =========================================================================
    // COLUNAS VISÍVEIS POR PADRÃO (6 colunas originais)
    // =========================================================================
    {
      accessorKey: 'dataAutuacao',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Data Autuação" className="justify-center" />,
      cell: ({ row }) => (
        <div className="min-h-10 flex items-center justify-center text-sm">
          {formatarData(row.original.dataAutuacao)}
        </div>
      ),
      enableSorting: true,
      size: 120,
      meta: {
        align: 'center' as const,
        headerLabel: 'Data Autuação',
      },
    },
    {
      accessorKey: 'numeroProcesso',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Processo" />,
      cell: ({ row }) => <ProcessoNumeroCell row={row} />,
      enableSorting: true,
      size: 380,
      meta: {
        align: 'left' as const,
        headerLabel: 'Processo',
      },
    },
    {
      id: 'partes',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Partes" />,
      cell: ({ row }) => {
        // FONTE DA VERDADE: Usar nomes do 1º grau para evitar inversão por recursos
        // Em recursos, quem recorre vira polo ativo, mas não muda quem é autor/réu
        const parteAutora = row.original.nomeParteAutoraOrigem || row.original.nomeParteAutora || '-';
        const parteRe = row.original.nomeParteReOrigem || row.original.nomeParteRe || '-';
        return (
          <div className="min-h-10 flex flex-col items-start justify-center gap-1.5 py-2">
            <ParteBadge
              polo="ATIVO"
              className="block whitespace-normal wrap-break-word text-left font-normal"
            >
              {parteAutora}
            </ParteBadge>
            <ParteBadge
              polo="PASSIVO"
              className="block whitespace-normal wrap-break-word text-left font-normal"
            >
              {parteRe}
            </ParteBadge>
          </div>
        );
      },
      enableSorting: false,
      size: 300,
      meta: {
        align: 'left' as const,
        headerLabel: 'Partes',
      },
    },
    {
      id: 'responsavel',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Responsável" className="justify-center" />,
      cell: ({ row }) => {
        return (
          <div className="min-h-10 flex items-center justify-center text-sm">
            <ProcessoResponsavelCell
              processo={row.original}
              usuarios={usuarios}
              onSuccess={onSuccess}
            />
          </div>
        );
      },
      enableSorting: false,
      size: 200,
      meta: {
        align: 'center' as const,
        headerLabel: 'Responsável',
      },
    },
    {
      id: 'status',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => {
        // Fallback para ATIVO se status for nulo (cenário de migração de dados)
        const status = row.original.status;
        return (
          <div className="min-h-10 flex items-center justify-start">
            <ProcessoStatusBadge status={status} className="text-xs" />
          </div>
        );
      },
      enableSorting: false,
      size: 120,
      meta: {
        align: 'left' as const,
        headerLabel: 'Status',
      },
    },
    {
      id: 'acoes',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Ações" className="justify-center" />,
      cell: ({ row }) => {
        const processo = row.original;
        return (
          <div className="min-h-10 flex items-center justify-center">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href={`/processos/${processo.id}`}
                    className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Eye className="h-4 w-4" />
                    <span className="sr-only">Ver detalhes</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent>Ver timeline</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        );
      },
      enableSorting: false,
      size: 80,
      meta: {
        align: 'center' as const,
        headerLabel: 'Ações',
      },
    },

    // =========================================================================
    // COLUNAS OCULTAS POR PADRÃO (extras do acervo)
    // NOTA: TRT, Grau, Classe Judicial, Órgão Julgador, Segredo de Justiça e
    // Próxima Audiência foram removidas pois já aparecem compostas na coluna "Processo"
    // =========================================================================

    // Prioridade Processual
    {
      id: 'prioridade',
      accessorKey: 'prioridadeProcessual',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Prioridade" className="justify-center" />,
      cell: ({ row }) => {
        const prioridade = row.original.prioridadeProcessual;
        if (!prioridade) return <div className="min-h-10 flex items-center justify-center text-muted-foreground">-</div>;

        const variant = prioridade >= 3 ? 'destructive' : prioridade >= 2 ? 'warning' : 'secondary';
        return (
          <div className="min-h-10 flex items-center justify-center">
            <AppBadge variant={variant as 'destructive' | 'secondary'} className="text-xs">
              {prioridade}
            </AppBadge>
          </div>
        );
      },
      enableSorting: true,
      size: 100,
      meta: {
        align: 'center' as const,
        headerLabel: 'Prioridade',
      },
    },

    // Quantidade de Autores
    {
      id: 'qtde_autores',
      accessorKey: 'qtdeParteAutora',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Qtde Autores" className="justify-center" />,
      cell: ({ row }) => (
        <div className="min-h-10 flex items-center justify-center text-sm">
          {row.original.qtdeParteAutora ?? '-'}
        </div>
      ),
      enableSorting: true,
      size: 110,
      meta: {
        align: 'center' as const,
        headerLabel: 'Qtde Autores',
      },
    },

    // Quantidade de Réus
    {
      id: 'qtde_reus',
      accessorKey: 'qtdeParteRe',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Qtde Réus" className="justify-center" />,
      cell: ({ row }) => (
        <div className="min-h-10 flex items-center justify-center text-sm">
          {row.original.qtdeParteRe ?? '-'}
        </div>
      ),
      enableSorting: true,
      size: 100,
      meta: {
        align: 'center' as const,
        headerLabel: 'Qtde Réus',
      },
    },

    // Juízo Digital
    {
      id: 'juizo_digital',
      accessorKey: 'juizoDigital',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Juízo Digital" className="justify-center" />,
      cell: ({ row }) => {
        const juizoDigital = row.original.juizoDigital;
        return (
          <div className="min-h-10 flex items-center justify-center">
            {juizoDigital === true ? (
              <CheckCircle className="h-4 w-4 text-emerald-600" />
            ) : juizoDigital === false ? (
              <XCircle className="h-4 w-4 text-muted-foreground" />
            ) : (
              <span className="text-muted-foreground">-</span>
            )}
          </div>
        );
      },
      enableSorting: true,
      size: 110,
      meta: {
        align: 'center' as const,
        headerLabel: 'Juízo Digital',
      },
    },

    // Data de Arquivamento
    {
      id: 'data_arquivamento',
      accessorKey: 'dataArquivamento',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Arquivamento" className="justify-center" />,
      cell: ({ row }) => (
        <div className="min-h-10 flex items-center justify-center text-sm">
          {formatarData(row.original.dataArquivamento || null)}
        </div>
      ),
      enableSorting: true,
      size: 120,
      meta: {
        align: 'center' as const,
        headerLabel: 'Arquivamento',
      },
    },

    // NOTA: Próxima Audiência foi removida pois já aparece como popover na coluna "Processo"

    // Tem Associação
    {
      id: 'tem_associacao',
      accessorKey: 'temAssociacao',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Associação" className="justify-center" />,
      cell: ({ row }) => {
        const temAssociacao = row.original.temAssociacao;
        return (
          <div className="min-h-10 flex items-center justify-center">
            {temAssociacao ? (
              <Link2 className="h-4 w-4 text-blue-600" />
            ) : (
              <span className="text-muted-foreground">-</span>
            )}
          </div>
        );
      },
      enableSorting: true,
      size: 100,
      meta: {
        align: 'center' as const,
        headerLabel: 'Associação',
      },
    },

    // Origem (Acervo Geral / Arquivado)
    {
      id: 'origem',
      accessorKey: 'origem',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Origem" className="justify-center" />,
      cell: ({ row }) => {
        const origem = row.original.origem;
        if (!origem) return <div className="min-h-10 flex items-center justify-center text-muted-foreground">-</div>;

        const isArquivado = origem === 'arquivado';
        return (
          <div className="min-h-10 flex items-center justify-center">
            <AppBadge
              variant={isArquivado ? 'secondary' : 'default'}
              className={cn(
                'text-xs',
                !isArquivado && 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/25'
              )}
            >
              {ORIGEM_LABELS[origem] || origem}
            </AppBadge>
          </div>
        );
      },
      enableSorting: true,
      size: 120,
      meta: {
        align: 'center' as const,
        headerLabel: 'Origem',
      },
    },

    // Criado Em
    {
      id: 'created_at',
      accessorKey: 'createdAt',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Criado Em" className="justify-center" />,
      cell: ({ row }) => (
        <div className="min-h-10 flex items-center justify-center text-sm text-muted-foreground">
          {formatarDataHora(row.original.createdAt || null)}
        </div>
      ),
      enableSorting: true,
      size: 150,
      meta: {
        align: 'center' as const,
        headerLabel: 'Criado Em',
      },
    },

    // Atualizado Em
    {
      id: 'updated_at',
      accessorKey: 'updatedAt',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Atualizado Em" className="justify-center" />,
      cell: ({ row }) => (
        <div className="min-h-10 flex items-center justify-center text-sm text-muted-foreground">
          {formatarDataHora(row.original.updatedAt || null)}
        </div>
      ),
      enableSorting: true,
      size: 150,
      meta: {
        align: 'center' as const,
        headerLabel: 'Atualizado Em',
      },
    },
  ];
}

// =============================================================================
// VISIBILIDADE INICIAL DAS COLUNAS
// =============================================================================

/**
 * Configuração de visibilidade inicial das colunas.
 * Colunas não listadas aqui estarão visíveis por padrão.
 * Colunas com valor `false` estarão ocultas por padrão.
 */
const INITIAL_COLUMN_VISIBILITY: Record<string, boolean> = {
  // Colunas originais - status oculta por padrão
  status: false,

  // Colunas extras (ocultas por padrão)
  // NOTA: trt, grau, classe_judicial, orgao_julgador, segredo_justica, proxima_audiencia
  // foram removidas pois já aparecem compostas na coluna "Processo"
  prioridade: false,
  qtde_autores: false,
  qtde_reus: false,
  juizo_digital: false,
  data_arquivamento: false,
  tem_associacao: false,
  origem: false,
  created_at: false,
  updated_at: false,
};

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export function ProcessosTableWrapper({
  initialData,
  initialPagination,
  initialUsers,
  initialTribunais = [],
}: ProcessosTableWrapperProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Estado dos dados
  const [processos, setProcessos] = React.useState<ProcessoUnificado[]>(initialData);
  const [usersMap, setUsersMap] = React.useState(initialUsers);
  const [usuarios, setUsuarios] = React.useState<Usuario[]>([]);
  const [table, setTable] = React.useState<TanstackTable<ProcessoUnificado> | null>(null);
  const [density, setDensity] = React.useState<'compact' | 'standard' | 'relaxed'>('standard');

  // Estado de visibilidade das colunas
  const [columnVisibility, setColumnVisibility] = React.useState<Record<string, boolean>>(INITIAL_COLUMN_VISIBILITY);

  // Estado de paginação
  const [pageIndex, setPageIndex] = React.useState(initialPagination ? initialPagination.page - 1 : 0);
  const [pageSize, setPageSize] = React.useState(initialPagination ? initialPagination.limit : 50);
  const [total, setTotal] = React.useState(initialPagination ? initialPagination.total : 0);
  const [totalPages, setTotalPages] = React.useState(initialPagination ? initialPagination.totalPages : 0);

  // Estado de loading/error
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Estado de busca e filtros (inicializado da URL)
  const [globalFilter, setGlobalFilter] = React.useState(searchParams.get('search') || '');
  const [trtFilter, setTrtFilter] = React.useState<string[]>(() => {
    const trt = searchParams.get('trt');
    if (!trt || trt === 'all') return [];
    return trt.includes(',') ? trt.split(',') : [trt];
  });
  const [origemFilter, setOrigemFilter] = React.useState<string>(searchParams.get('origem') || 'all');

  // Dados auxiliares para mostrar nomes dos responsáveis
  // Removido useUsuarios em favor de initialUsers + updates do server action

  // Carregar lista de usuários para o select do diálogo
  React.useEffect(() => {
    const fetchUsuarios = async () => {
      try {
        const result = await actionListarUsuarios({ ativo: true, limite: 100 });
        if (result.success && result.data?.usuarios) {
          const usuariosList = (result.data.usuarios as Array<{ id: number; nomeExibicao?: string; nome_exibicao?: string; nome?: string }>).map((u) => ({
            id: u.id,
            nomeExibicao: u.nomeExibicao || u.nome_exibicao || u.nome || `Usuário ${u.id}`,
          }));
          setUsuarios(usuariosList);
        }
      } catch (error) {
        console.error('Erro ao carregar usuários:', error);
      }
    };
    fetchUsuarios();
  }, []);

  const buscaDebounced = useDebounce(globalFilter, 500);

  // Filtros
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const filterOptions = React.useMemo(() => buildProcessosFilterOptions(initialTribunais), [initialTribunais]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const filterGroups = React.useMemo(() => buildProcessosFilterGroups(), []);

  // Função para atualizar processo localmente (otimista)
  const updateProcessoLocal = React.useCallback((processoId: number, updates: Partial<ProcessoUnificado>) => {
    setProcessos((prev) =>
      prev.map((p) => (p.id === processoId ? { ...p, ...updates } : p))
    );
    console.log('[ProcessosTableWrapper] Processo atualizado localmente:', { processoId, updates });
  }, []);

  // Função wrapper para refetch que também atualiza localmente se necessário
  // Nota: refetch será definido depois, então precisamos usar uma referência
  const refetchRef = React.useRef<() => Promise<void>>();

  const handleRefetchWithUpdate = React.useCallback((updatedProcesso?: ProcessoUnificado) => {
    console.log('[ProcessosTableWrapper] handleRefetchWithUpdate chamado', { updatedProcesso });
    if (updatedProcesso) {
      updateProcessoLocal(updatedProcesso.id, updatedProcesso);
    }
    if (refetchRef.current) {
      refetchRef.current();
    }
  }, [updateProcessoLocal]);

  // Função para recarregar dados (movido para antes do useMemo de colunas)
  const refetch = React.useCallback(async () => {
    console.log('[ProcessosTableWrapper] Refetch chamado');
    setIsLoading(true);
    setError(null);

    try {
      const result = await actionListarProcessos({
        pagina: pageIndex + 1,
        limite: pageSize,
        busca: buscaDebounced || undefined,
        trt: trtFilter.length === 0 ? undefined : trtFilter,
        origem: origemFilter === 'all' ? undefined : (origemFilter as 'acervo_geral' | 'arquivado'),
      });

      if (result.success) {
        // Correcao de tipagem do payload
        const payload = result.data as {
          data: ProcessoUnificado[];
          pagination: PaginationInfo;
          referencedUsers: Record<number, { nome: string }>;
        };

        console.log('[ProcessosTableWrapper] Dados atualizados:', {
          totalProcessos: payload.data.length,
          processos: payload.data.map(p => ({ id: p.id, responsavelId: p.responsavelId })),
        });

        setProcessos(payload.data);
        setTotal(payload.pagination.total);
        setTotalPages(payload.pagination.totalPages);
        setUsersMap((prev) => ({ ...prev, ...payload.referencedUsers }));

        // Atualizar URL
        const params = new URLSearchParams();
        if (pageIndex > 0) params.set('page', String(pageIndex + 1));
        if (pageSize !== 50) params.set('limit', String(pageSize));
        if (buscaDebounced) params.set('search', buscaDebounced);
        if (trtFilter.length > 0) params.set('trt', trtFilter.join(','));
        if (origemFilter !== 'all') params.set('origem', origemFilter);

        router.replace(`${pathname}?${params.toString()}`, { scroll: false });

      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar processos');
    } finally {
      setIsLoading(false);
    }
  }, [pageIndex, pageSize, buscaDebounced, trtFilter, origemFilter, router, pathname]);

  // Atualizar ref do refetch
  React.useEffect(() => {
    refetchRef.current = refetch;
  }, [refetch]);

  // Colunas memoizadas - agora incluem usuarios e refetch
  const colunas = React.useMemo(
    () => criarColunas(usersMap, usuarios, handleRefetchWithUpdate),
    [usersMap, usuarios, handleRefetchWithUpdate]
  );

  // Ref para controlar primeira renderização
  const isFirstRender = React.useRef(true);

  // Recarregar quando parâmetros mudam (skip primeira render)
  React.useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    refetch();
  }, [pageIndex, pageSize, buscaDebounced, trtFilter, origemFilter, refetch]);

  // Handler para novo processo (placeholder)
  const handleNewProcesso = React.useCallback(() => {
    // TODO: Implementar dialog de criação de processo
    console.log('Novo processo');
  }, []);

  const hasFilters = trtFilter.length > 0 || origemFilter !== 'all' || globalFilter.length > 0;
  const showEmptyState = !isLoading && !error && (processos === null || processos.length === 0);

  return (
    <>
      <DataShell
        header={
          table ? (
            <DataTableToolbar
              table={table}
              density={density}
              onDensityChange={setDensity}
              searchValue={globalFilter}
              onSearchValueChange={(value) => {
                setGlobalFilter(value);
                setPageIndex(0);
              }}
              actionButton={{
                label: 'Novo Processo',
                onClick: handleNewProcesso,
              }}
              filtersSlot={
                <>
                  <Combobox
                    options={initialTribunais.map(t => ({ label: `${t.codigo} - ${t.nome}`, value: t.codigo }))}
                    value={trtFilter}
                    onValueChange={(val) => {
                      setTrtFilter(val);
                      setPageIndex(0);
                    }}
                    placeholder="Tribunais"
                    searchPlaceholder="Buscar tribunal..."
                    emptyText="Nenhum tribunal encontrado"
                    multiple={true}
                    className="w-50"
                  />

                  <Select
                    value={origemFilter}
                    onValueChange={(val) => {
                      setOrigemFilter(val);
                      setPageIndex(0);
                    }}
                  >
                    <SelectTrigger className="h-10 w-37.5">
                      <SelectValue placeholder="Origem" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as Origens</SelectItem>
                      <SelectItem value="acervo_geral">Acervo Geral</SelectItem>
                      <SelectItem value="arquivado">Arquivados</SelectItem>
                    </SelectContent>
                  </Select>
                </>
              }
            />
          ) : (
            <div className="p-6" />
          )
        }
        footer={
          totalPages > 0 ? (
            <DataPagination
              pageIndex={pageIndex}
              pageSize={pageSize}
              total={total}
              totalPages={totalPages}
              onPageChange={setPageIndex}
              onPageSizeChange={setPageSize}
              isLoading={isLoading}
            />
          ) : null
        }
      >
        {showEmptyState ? (
          <ProcessosEmptyState
            onClearFilters={() => {
              setTrtFilter([]);
              setOrigemFilter('all');
              setGlobalFilter('');
              setPageIndex(0);
            }}
            hasFilters={hasFilters}
          />
        ) : (
          <div className="relative border-t">
            <DataTable
              columns={colunas}
              data={processos || []}
              isLoading={isLoading}
              error={error}
              density={density}
              columnVisibility={columnVisibility}
              onColumnVisibilityChange={setColumnVisibility}
              onTableReady={(t) => setTable(t as TanstackTable<ProcessoUnificado>)}
              hideTableBorder={true}
              emptyMessage="Nenhum processo encontrado."
              pagination={{
                pageIndex,
                pageSize,
                total,
                totalPages,
                onPageChange: setPageIndex,
                onPageSizeChange: setPageSize,
              }}
            />
          </div>
        )}
      </DataShell>
    </>
  );
}
