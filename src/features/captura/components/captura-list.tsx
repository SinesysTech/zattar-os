'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { DataPagination, DataShell, DataTable, DataTableToolbar } from '@/components/shared/data-shell';
import { DataTableColumnHeader } from '@/components/shared/data-shell/data-table-column-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { TIPOS_CAPTURA, STATUS_CAPTURA } from './captura-filters';
import { useCapturasLog } from '../hooks/use-capturas-log';
import { useAdvogados } from '@/features/advogados';
import { useCredenciais } from '@/features/advogados';
import { deletarCapturaLog } from '@/features/captura/services/api-client';
import type { ColumnDef, Table as TanstackTable } from '@tanstack/react-table';
import type { CapturaLog, TipoCaptura, StatusCaptura } from '@/features/captura/types';
import type { CodigoTRT } from '@/features/captura';
import { Eye, Search, Trash2 } from 'lucide-react';
import { getSemanticBadgeVariant, CAPTURA_STATUS_LABELS } from '@/lib/design-system';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

/**
 * Formata data e hora ISO para formato brasileiro (DD/MM/YYYY HH:mm)
 */
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

/**
 * Formata tipo de captura para exibição
 */
const formatarTipoCaptura = (tipo: TipoCaptura): string => {
  const tipos: Record<TipoCaptura, string> = {
    acervo_geral: 'Acervo Geral',
    arquivados: 'Arquivados',
    audiencias: 'Audiências',
    pendentes: 'Pendentes',
    partes: 'Partes',
    combinada: 'Combinada', // Added 'combinada' to handle backend type if present
  };
  return tipos[tipo] || tipo;
};

/**
 * Retorna badge de status com cor apropriada usando o sistema semântico.
 *
 * @ai-context Este componente usa getSemanticBadgeVariant() do design system.
 */
const StatusBadge = ({ status }: { status: StatusCaptura }) => {
  const variant = getSemanticBadgeVariant('captura_status', status);
  const label = CAPTURA_STATUS_LABELS[status] || status;

  return <Badge variant={variant}>{label}</Badge>;
};

/**
 * Formata grau para exibição curta
 */
const formatarGrauCurto = (grau: string): string => {
  if (grau === '1' || grau === 'primeiro_grau') return '1G';
  if (grau === '2' || grau === 'segundo_grau') return '2G';
  return grau;
};

/**
 * Tipo para info de credencial
 */
type CredencialInfo = { tribunal: CodigoTRT; grau: string };

/**
 * Colunas da tabela de histórico
 */
function criarColunas(
  router: ReturnType<typeof useRouter>,
  onDelete: (captura: CapturaLog) => void,
  advogadosMap: Map<number, string>,
  credenciaisMap: Map<number, CredencialInfo>
): ColumnDef<CapturaLog>[] {
  return [
    {
      accessorKey: 'tipo_captura',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Tipo" />
      ),
      enableSorting: true,
      size: 140,
      meta: { align: 'center' },
      cell: ({ row }) => (
        <span className="text-sm">{formatarTipoCaptura(row.getValue('tipo_captura'))}</span>
      ),
    },
    {
      accessorKey: 'advogado_id',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Advogado" />
      ),
      enableSorting: true,
      size: 220,
      minSize: 200,
      meta: { align: 'center' },
      cell: ({ row }) => {
        const advogadoId = row.getValue('advogado_id') as number | null;
        const nomeAdvogado = advogadoId ? advogadosMap.get(advogadoId) : null;
        return (
          <span className="text-sm">
            {nomeAdvogado || '-'}
          </span>
        );
      },
    },
    {
      accessorKey: 'credencial_ids',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Tribunais" />
      ),
      enableSorting: false,
      size: 220,
      meta: { align: 'center' },
      cell: ({ row }) => {
        const credencialIds = row.getValue('credencial_ids') as number[];

        if (!credencialIds || credencialIds.length === 0) {
          return <span className="text-sm text-muted-foreground">-</span>;
        }

        // Mapear credencial_ids para { tribunal, grau }
        const tribunaisInfo = credencialIds
          .map((id) => credenciaisMap.get(id))
          .filter((info): info is CredencialInfo => info !== undefined);

        // Remover duplicatas por tribunal+grau
        const uniqueKey = new Set<string>();
        const tribunaisUnicos = tribunaisInfo.filter((info) => {
          const key = `${info.tribunal}-${info.grau}`;
          if (uniqueKey.has(key)) return false;
          uniqueKey.add(key);
          return true;
        });

        if (tribunaisUnicos.length === 0) {
          return <span className="text-sm text-muted-foreground">-</span>;
        }

        return (
          <div className="flex flex-wrap gap-1 justify-center">
            {tribunaisUnicos.slice(0, 3).map((info, idx) => (
              <Badge
                key={`${info.tribunal}-${info.grau}-${idx}`}
                variant={getSemanticBadgeVariant('tribunal', info.tribunal)}
                className="text-xs"
              >
                {info.tribunal} {formatarGrauCurto(info.grau)}
              </Badge>
            ))}
            {tribunaisUnicos.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{tribunaisUnicos.length - 3}
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      enableSorting: true,
      size: 130,
      meta: { align: 'center' },
      cell: ({ row }) => <StatusBadge status={row.getValue('status')} />,
    },
    {
      accessorKey: 'iniciado_em',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Período" />
      ),
      enableSorting: true,
      size: 200,
      meta: { align: 'center' },
      cell: ({ row }) => {
        const iniciadoEm = row.getValue('iniciado_em') as string | null;
        const concluidoEm = row.original.concluido_em;
        return (
          <div className="flex flex-col items-center text-sm">
            <span className="text-muted-foreground text-xs">Início:</span>
            <span>{formatarDataHora(iniciadoEm)}</span>
            {concluidoEm && (
              <>
                <span className="text-muted-foreground text-xs mt-1">Fim:</span>
                <span>{formatarDataHora(concluidoEm)}</span>
              </>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'erro',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Erros" />
      ),
      enableSorting: false,
      size: 200,
      meta: { align: 'center' },
      cell: ({ row }) => {
        const erro = row.getValue('erro') as string | null;
        const credencialIds = row.original.credencial_ids;

        if (!erro) {
          return <span className="text-sm text-muted-foreground">-</span>;
        }

        // Se há erro, mostrar contagem por tribunal
        const tribunaisInfo = credencialIds
          .map((id) => credenciaisMap.get(id))
          .filter((info): info is CredencialInfo => info !== undefined);

        if (tribunaisInfo.length === 0) {
          // Fallback: mostrar badge de erro genérico
          return (
            <Badge variant="destructive" className="text-xs">
              1 erro
            </Badge>
          );
        }

        // Agrupar por tribunal+grau
        const contagem = new Map<string, { tribunal: CodigoTRT; grau: string; count: number }>();
        tribunaisInfo.forEach((info) => {
          const key = `${info.tribunal}-${info.grau}`;
          const existing = contagem.get(key);
          if (existing) {
            existing.count++;
          } else {
            contagem.set(key, { ...info, count: 1 });
          }
        });

        return (
          <div className="flex flex-wrap gap-1 justify-center">
            {Array.from(contagem.values()).slice(0, 2).map((info, idx) => (
              <Badge
                key={`${info.tribunal}-${info.grau}-${idx}`}
                variant="destructive"
                className="text-xs"
              >
                {info.count} {info.tribunal} {formatarGrauCurto(info.grau)}
              </Badge>
            ))}
            {contagem.size > 2 && (
              <Badge variant="destructive" className="text-xs">
                +{contagem.size - 2}
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      id: 'acoes',
      header: () => <span className="text-center w-full block">Ações</span>,
      size: 100,
      meta: { align: 'center' },
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => {
        const captura = row.original;
        return (
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => router.push(`/captura/historico/${captura.id}`)}
              title="Visualizar detalhes"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" title="Deletar">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja deletar esta captura? Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onDelete(captura)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Deletar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        );
      },
    },
  ];
}

interface CapturaListProps {
  onNewClick?: () => void;
}

export function CapturaList({ onNewClick }: CapturaListProps = {}) {
  const router = useRouter();

  // Estados de busca e paginação
  const [busca, setBusca] = React.useState('');
  const [pagina, setPagina] = React.useState(0);
  const [limite, setLimite] = React.useState(50);

  // Estados de filtros individuais
  const [tipoCaptura, setTipoCaptura] = React.useState<'all' | TipoCaptura>('all');
  const [statusCaptura, setStatusCaptura] = React.useState<'all' | StatusCaptura>('all');
  const [advogadoId, setAdvogadoId] = React.useState<'all' | string>('all');

  // Estados para DataTableToolbar
  const [table, setTable] = React.useState<TanstackTable<CapturaLog> | null>(null);
  const [density, setDensity] = React.useState<'compact' | 'standard' | 'relaxed'>('standard');

  // Buscar advogados para filtro e mapeamento
  const { advogados } = useAdvogados({ limite: 1000 });

  // Buscar credenciais para mapeamento
  const { credenciais } = useCredenciais({});

  // Criar mapa de advogado_id -> nome
  const advogadosMap = React.useMemo(() => {
    const map = new Map<number, string>();
    advogados?.forEach((advogado) => {
      map.set(advogado.id, advogado.nome_completo);
    });
    return map;
  }, [advogados]);

  // Criar mapa de credencial_id -> { tribunal, grau }
  const credenciaisMap = React.useMemo(() => {
    const map = new Map<number, CredencialInfo>();
    credenciais?.forEach((credencial) => {
      map.set(credencial.id, {
        tribunal: credencial.tribunal as CodigoTRT,
        grau: credencial.grau,
      });
    });
    return map;
  }, [credenciais]);

  // Parâmetros para buscar capturas
  const params = React.useMemo(
    () => ({
      pagina: pagina + 1, // API usa 1-indexed
      limite,
      tipo_captura: tipoCaptura !== 'all' ? tipoCaptura : undefined,
      status: statusCaptura !== 'all' ? statusCaptura : undefined,
      advogado_id: advogadoId !== 'all' ? Number(advogadoId) : undefined,
    }),
    [pagina, limite, tipoCaptura, statusCaptura, advogadoId]
  );

  // Buscar histórico de capturas
  const { capturas, paginacao, isLoading, error, refetch } = useCapturasLog(params);

  const handleDelete = React.useCallback(
    async (captura: CapturaLog) => {
      try {
        await deletarCapturaLog(captura.id);
        refetch();
      } catch (error) {
        console.error('Erro ao deletar captura:', error);
      }
    },
    [refetch]
  );

  const colunas = React.useMemo(
    () => criarColunas(router, handleDelete, advogadosMap, credenciaisMap),
    [router, handleDelete, advogadosMap, credenciaisMap]
  );

  // Ocultar coluna advogado por padrão quando table estiver pronta
  React.useEffect(() => {
    if (table) {
      table.setColumnVisibility((prev) => ({
        ...prev,
        advogado_id: false,
      }));
    }
  }, [table]);

  // Largura padronizada para todos os dropdowns de filtro
  const filterWidth = 'w-[200px]';

  return (
    <DataShell
      actionButton={
        onNewClick
          ? {
              label: 'Nova Captura',
              onClick: onNewClick,
            }
          : undefined
      }
      header={
        table ? (
          <DataTableToolbar
            table={table}
            density={density}
            onDensityChange={setDensity}
            searchValue={busca}
            onSearchValueChange={(value) => {
              setBusca(value);
              setPagina(0);
            }}
            searchPlaceholder="Buscar capturas..."
            filtersSlot={
              <>
                <Select
                  value={tipoCaptura}
                  onValueChange={(val) => {
                    setTipoCaptura(val as 'all' | TipoCaptura);
                    setPagina(0);
                  }}
                >
                  <SelectTrigger className={cn('h-10', filterWidth)}>
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os tipos</SelectItem>
                    {TIPOS_CAPTURA.map((tipo) => (
                      <SelectItem key={tipo.value} value={tipo.value}>
                        {tipo.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={statusCaptura}
                  onValueChange={(val) => {
                    setStatusCaptura(val as 'all' | StatusCaptura);
                    setPagina(0);
                  }}
                >
                  <SelectTrigger className={cn('h-10', filterWidth)}>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    {STATUS_CAPTURA.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={advogadoId}
                  onValueChange={(val) => {
                    setAdvogadoId(val);
                    setPagina(0);
                  }}
                >
                  <SelectTrigger className={cn('h-10', filterWidth)}>
                    <SelectValue placeholder="Advogado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os advogados</SelectItem>
                    {advogados?.map((advogado) => (
                      <SelectItem key={advogado.id} value={advogado.id.toString()}>
                        {advogado.nome_completo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            }
          />
        ) : (
          <div className="px-6 py-4">
            <div className="flex items-center gap-2">
              <div className="relative w-full max-w-xs">
                <Search
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  type="search"
                  placeholder="Buscar capturas..."
                  aria-label="Buscar na tabela"
                  value={busca}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                    setBusca(event.target.value);
                    setPagina(0);
                  }}
                  className="h-10 w-full pl-9"
                />
              </div>

              <Select
                value={tipoCaptura}
                onValueChange={(val) => {
                  setTipoCaptura(val as 'all' | TipoCaptura);
                  setPagina(0);
                }}
              >
                <SelectTrigger className={cn('h-10', filterWidth)}>
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  {TIPOS_CAPTURA.map((tipo) => (
                    <SelectItem key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={statusCaptura}
                onValueChange={(val) => {
                  setStatusCaptura(val as 'all' | StatusCaptura);
                  setPagina(0);
                }}
              >
                <SelectTrigger className={cn('h-10', filterWidth)}>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  {STATUS_CAPTURA.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={advogadoId}
                onValueChange={(val) => {
                  setAdvogadoId(val);
                  setPagina(0);
                }}
              >
                <SelectTrigger className={cn('h-10', filterWidth)}>
                  <SelectValue placeholder="Advogado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os advogados</SelectItem>
                  {advogados?.map((advogado) => (
                    <SelectItem key={advogado.id} value={advogado.id.toString()}>
                      {advogado.nome_completo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex-1" />
            </div>
          </div>
        )
      }
      footer={
        paginacao && paginacao.totalPaginas > 0 ? (
          <DataPagination
            pageIndex={paginacao.pagina - 1}
            pageSize={paginacao.limite}
            total={paginacao.total}
            totalPages={paginacao.totalPaginas}
            onPageChange={setPagina}
            onPageSizeChange={setLimite}
            isLoading={isLoading}
          />
        ) : null
      }
    >
      <div className="relative border-t">
        <DataTable
          data={capturas}
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
          isLoading={isLoading}
          error={error}
          density={density}
          onTableReady={(t) => setTable(t as TanstackTable<CapturaLog>)}
          hideTableBorder={true}
          emptyMessage="Nenhuma captura encontrada no histórico."
        />
      </div>
    </DataShell>
  );
}
