'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable } from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import { formatCurrency, formatDate } from '@/app/_lib/utils/utils';
import type { ColumnDef } from '@tanstack/react-table';
import type { ObrigacoesFilters } from './obrigacoes-toolbar-filters';

interface AcordoCondenacao {
  id: number;
  processoId: number;
  tipo: 'acordo' | 'condenacao' | 'custas_processuais';
  direcao: 'recebimento' | 'pagamento';
  valorTotal: number;
  numeroParcelas: number;
  status: 'pendente' | 'pago_parcial' | 'pago_total' | 'atrasado';
  dataVencimentoPrimeiraParcela: string;
  formaDistribuicao?: string | null;
  createdAt: string;
}

interface ListagemResultado {
  acordos: AcordoCondenacao[];
  total: number;
  pagina: number;
  limite: number;
  totalPaginas: number;
}

interface AcordosCondenacoesListProps {
  busca: string;
  filtros: ObrigacoesFilters;
  refreshKey: number;
}

/**
 * Retorna a classe CSS de cor para badge do tipo
 */
const getTipoColorClass = (tipo: AcordoCondenacao['tipo']): string => {
  const tipoColors: Record<string, string> = {
    'acordo': 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-800',
    'condenacao': 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900 dark:text-purple-200 dark:border-purple-800',
    'custas_processuais': 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900 dark:text-amber-200 dark:border-amber-800',
  };

  return tipoColors[tipo] || 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900 dark:text-gray-200 dark:border-gray-800';
};

/**
 * Retorna a classe CSS de cor para badge da direção
 */
const getDirecaoColorClass = (direcao: AcordoCondenacao['direcao']): string => {
  const direcaoColors: Record<string, string> = {
    'recebimento': 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-800',
    'pagamento': 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-200 dark:border-red-800',
  };

  return direcaoColors[direcao] || 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900 dark:text-gray-200 dark:border-gray-800';
};

/**
 * Retorna a classe CSS de cor para badge do status
 */
const getStatusColorClass = (status: AcordoCondenacao['status']): string => {
  const statusColors: Record<string, string> = {
    'pendente': 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-800',
    'pago_parcial': 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900 dark:text-orange-200 dark:border-orange-800',
    'pago_total': 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-800',
    'atrasado': 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-200 dark:border-red-800',
  };

  return statusColors[status] || 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900 dark:text-gray-200 dark:border-gray-800';
};

/**
 * Formata o tipo para exibição
 */
const formatarTipo = (tipo: AcordoCondenacao['tipo']): string => {
  const tipoLabels: Record<string, string> = {
    'acordo': 'Acordo',
    'condenacao': 'Condenação',
    'custas_processuais': 'Custas',
  };
  return tipoLabels[tipo] || tipo;
};

/**
 * Formata a direção para exibição
 */
const formatarDirecao = (direcao: AcordoCondenacao['direcao']): string => {
  const direcaoLabels: Record<string, string> = {
    'recebimento': 'Recebimento',
    'pagamento': 'Pagamento',
  };
  return direcaoLabels[direcao] || direcao;
};

/**
 * Formata o status para exibição
 */
const formatarStatus = (status: AcordoCondenacao['status']): string => {
  const statusLabels: Record<string, string> = {
    'pendente': 'Pendente',
    'pago_parcial': 'Pago Parcial',
    'pago_total': 'Pago Total',
    'atrasado': 'Atrasado',
  };
  return statusLabels[status] || status;
};

/**
 * Define as colunas da tabela de obrigações
 */
function criarColunas(router: ReturnType<typeof useRouter>): ColumnDef<AcordoCondenacao>[] {
  return [
    {
      accessorKey: 'processoId',
      header: ({ column }) => (
        <div className="flex items-center justify-start">
          <DataTableColumnHeader column={column} title="Processo" />
        </div>
      ),
      enableSorting: true,
      size: 150,
      cell: ({ row }) => {
        const processoId = row.getValue('processoId') as number;
        return (
          <div className="min-h-10 flex items-center justify-start">
            <span className="text-sm font-medium">{processoId}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'tipo',
      header: ({ column }) => (
        <div className="flex items-center justify-start">
          <DataTableColumnHeader column={column} title="Tipo" />
        </div>
      ),
      enableSorting: true,
      size: 150,
      cell: ({ row }) => {
        const tipo = row.getValue('tipo') as AcordoCondenacao['tipo'];
        return (
          <div className="min-h-10 flex items-center justify-start">
            <Badge variant="outline" className={getTipoColorClass(tipo)}>
              {formatarTipo(tipo)}
            </Badge>
          </div>
        );
      },
    },
    {
      accessorKey: 'direcao',
      header: ({ column }) => (
        <div className="flex items-center justify-start">
          <DataTableColumnHeader column={column} title="Direção" />
        </div>
      ),
      enableSorting: true,
      size: 150,
      cell: ({ row }) => {
        const direcao = row.getValue('direcao') as AcordoCondenacao['direcao'];
        return (
          <div className="min-h-10 flex items-center justify-start">
            <Badge variant="outline" className={getDirecaoColorClass(direcao)}>
              {formatarDirecao(direcao)}
            </Badge>
          </div>
        );
      },
    },
    {
      accessorKey: 'valorTotal',
      header: ({ column }) => (
        <div className="flex items-center justify-end">
          <DataTableColumnHeader column={column} title="Valor Total" />
        </div>
      ),
      enableSorting: true,
      size: 150,
      cell: ({ row }) => {
        const valor = row.getValue('valorTotal') as number;
        return (
          <div className="min-h-10 flex items-center justify-end">
            <span className="text-sm font-medium">{formatCurrency(valor)}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'numeroParcelas',
      header: ({ column }) => (
        <div className="flex items-center justify-center">
          <DataTableColumnHeader column={column} title="Parcelas" />
        </div>
      ),
      enableSorting: true,
      size: 100,
      cell: ({ row }) => {
        const parcelas = row.getValue('numeroParcelas') as number;
        return (
          <div className="min-h-10 flex items-center justify-center">
            <span className="text-sm">{parcelas}x</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'dataVencimentoPrimeiraParcela',
      header: ({ column }) => (
        <div className="flex items-center justify-center">
          <DataTableColumnHeader column={column} title="1ª Parcela" />
        </div>
      ),
      enableSorting: true,
      size: 120,
      cell: ({ row }) => {
        const data = row.getValue('dataVencimentoPrimeiraParcela') as string;
        return (
          <div className="min-h-10 flex items-center justify-center">
            <span className="text-sm">{formatDate(data)}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: ({ column }) => (
        <div className="flex items-center justify-start">
          <DataTableColumnHeader column={column} title="Status" />
        </div>
      ),
      enableSorting: true,
      size: 150,
      cell: ({ row }) => {
        const status = row.getValue('status') as AcordoCondenacao['status'];
        return (
          <div className="min-h-10 flex items-center justify-start">
            <Badge variant="outline" className={getStatusColorClass(status)}>
              {formatarStatus(status)}
            </Badge>
          </div>
        );
      },
    },
    {
      id: 'acoes',
      header: () => (
        <div className="flex items-center justify-end">
          <div className="text-sm font-medium">Ações</div>
        </div>
      ),
      enableSorting: false,
      size: 100,
      cell: ({ row }) => {
        return (
          <div className="min-h-10 flex items-center justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/acordos-condenacoes/${row.original.id}`);
              }}
            >
              <Eye className="h-4 w-4 mr-1" />
              Detalhes
            </Button>
          </div>
        );
      },
    },
  ];
}

export function AcordosCondenacoesList({ busca, filtros, refreshKey }: AcordosCondenacoesListProps) {
  const router = useRouter();
  const [dados, setDados] = useState<ListagemResultado>({
    acordos: [],
    total: 0,
    pagina: 1,
    limite: 50,
    totalPaginas: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagina, setPagina] = useState(0);
  const [limite, setLimite] = useState(50);
  const [ordenarPor, setOrdenarPor] = useState<string | null>(null);
  const [ordem, setOrdem] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    loadData();
  }, [filtros, busca, pagina, limite, ordenarPor, ordem, refreshKey]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.append('pagina', (pagina + 1).toString()); // API usa 1-indexed
      params.append('limite', limite.toString());

      if (filtros.tipo) params.append('tipo', filtros.tipo);
      if (filtros.direcao) params.append('direcao', filtros.direcao);
      if (filtros.status) params.append('status', filtros.status);
      if (busca) params.append('busca', busca);
      if (ordenarPor) params.append('ordenar_por', ordenarPor);
      if (ordem) params.append('ordem', ordem);

      const url = `/api/acordos-condenacoes?${params.toString()}`;
      const response = await fetch(url);
      const result = await response.json();

      if (response.ok && result.success) {
        setDados(result.data);
      } else {
        setError(result.error || 'Erro ao carregar dados');
      }
    } catch (err) {
      setError('Erro ao comunicar com o servidor');
      console.error('Erro ao carregar acordos:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const colunas = React.useMemo(() => criarColunas(router), [router]);

  const handleSortingChange = React.useCallback(
    (columnId: string | null, direction: 'asc' | 'desc' | null) => {
      if (columnId && direction) {
        setOrdenarPor(columnId);
        setOrdem(direction);
      } else {
        setOrdenarPor(null);
        setOrdem('asc');
      }
    },
    []
  );

  return (
    <DataTable
      data={dados.acordos}
      columns={colunas}
      pagination={{
        pageIndex: pagina,
        pageSize: limite,
        total: dados.total,
        totalPages: dados.totalPaginas,
        onPageChange: setPagina,
        onPageSizeChange: setLimite,
      }}
      sorting={{
        columnId: ordenarPor,
        direction: ordem,
        onSortingChange: handleSortingChange,
      }}
      isLoading={isLoading}
      error={error}
      emptyMessage="Nenhuma obrigação encontrada."
      onRowClick={(row) => router.push(`/acordos-condenacoes/${row.id}`)}
    />
  );
}
