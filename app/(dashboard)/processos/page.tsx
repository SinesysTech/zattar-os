'use client';

// Página de processos - Lista processos do acervo

import * as React from 'react';
import { useDebounce } from '@/hooks/use-debounce';
import { DataTable } from '@/components/data-table';
import { DataTableColumnHeader } from '@/components/data-table-column-header';
import { ProcessosFiltrosAvancados } from '@/components/processos-filtros-avancados';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAcervo } from '@/lib/hooks/use-acervo';
import type { ColumnDef } from '@tanstack/react-table';
import type { Acervo } from '@/backend/types/acervo/types';
import type { ProcessosFilters } from '@/lib/types/acervo';

/**
 * Formata data ISO para formato brasileiro (DD/MM/YYYY)
 */
const formatarData = (dataISO: string | null): string => {
  if (!dataISO) return '-';
  try {
    const data = new Date(dataISO);
    return data.toLocaleDateString('pt-BR');
  } catch {
    return '-';
  }
};

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
 * Define as colunas da tabela de processos
 */
const colunas: ColumnDef<Acervo>[] = [
  {
    accessorKey: 'numero_processo',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Número do Processo" />
    ),
    enableSorting: true,
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue('numero_processo')}</div>
    ),
  },
  {
    accessorKey: 'nome_parte_autora',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Parte Autora" />
    ),
    enableSorting: true,
    cell: ({ row }) => <div>{row.getValue('nome_parte_autora')}</div>,
  },
  {
    accessorKey: 'nome_parte_re',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Parte Ré" />
    ),
    enableSorting: true,
    cell: ({ row }) => <div>{row.getValue('nome_parte_re')}</div>,
  },
  {
    accessorKey: 'descricao_orgao_julgador',
    header: 'Órgão Julgador',
    cell: ({ row }) => (
      <div className="max-w-[300px] truncate">{row.getValue('descricao_orgao_julgador')}</div>
    ),
  },
  {
    accessorKey: 'classe_judicial',
    header: 'Classe Judicial',
    cell: ({ row }) => (
      <Badge variant="outline">{row.getValue('classe_judicial')}</Badge>
    ),
  },
  {
    accessorKey: 'codigo_status_processo',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('codigo_status_processo') as string;
      return (
        <Badge variant="secondary" className="capitalize">
          {status}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'data_autuacao',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Data de Autuação" />
    ),
    enableSorting: true,
    cell: ({ row }) => formatarData(row.getValue('data_autuacao')),
  },
  {
    accessorKey: 'data_arquivamento',
    header: 'Data de Arquivamento',
    cell: ({ row }) => formatarData(row.getValue('data_arquivamento')),
  },
  {
    accessorKey: 'data_proxima_audiencia',
    header: 'Próxima Audiência',
    cell: ({ row }) => formatarDataHora(row.getValue('data_proxima_audiencia')),
  },
];

export default function ProcessosPage() {
  const [busca, setBusca] = React.useState('');
  const [pagina, setPagina] = React.useState(0);
  const [limite, setLimite] = React.useState(50);
  const [ordenarPor, setOrdenarPor] = React.useState<'data_autuacao' | 'numero_processo' | 'nome_parte_autora' | 'nome_parte_re' | null>('data_autuacao');
  const [ordem, setOrdem] = React.useState<'asc' | 'desc'>('desc');
  const [filtros, setFiltros] = React.useState<ProcessosFilters>({});
  
  // Debounce da busca
  const buscaDebounced = useDebounce(busca, 500);
  
  // Parâmetros para buscar processos
  const params = React.useMemo(() => ({
    pagina: pagina + 1, // API usa 1-indexed
    limite,
    busca: buscaDebounced || undefined,
    ordenar_por: ordenarPor || undefined,
    ordem,
    ...filtros, // Spread dos filtros avançados
  }), [pagina, limite, buscaDebounced, ordenarPor, ordem, filtros]);
  
  const { processos, paginacao, isLoading, error } = useAcervo(params);
  
  const handleSortingChange = React.useCallback((columnId: string | null, direction: 'asc' | 'desc' | null) => {
    if (columnId && direction) {
      setOrdenarPor(columnId as typeof ordenarPor);
      setOrdem(direction);
    } else {
      setOrdenarPor(null);
      setOrdem('desc');
    }
  }, []);
  
  const handleFiltersChange = React.useCallback((newFilters: ProcessosFilters) => {
    setFiltros(newFilters);
    setPagina(0); // Resetar para primeira página ao aplicar filtros
  }, []);
  
  const handleFiltersReset = React.useCallback(() => {
    setFiltros({});
    setPagina(0);
  }, []);
  
  return (
    <div className="space-y-4">
      {/* Barra de busca e filtros */}
      <div className="flex items-center gap-4">
        <Input
          placeholder="Buscar por número, parte autora, parte ré, órgão julgador ou classe judicial..."
          value={busca}
          onChange={(e) => {
            setBusca(e.target.value);
            setPagina(0); // Resetar para primeira página ao buscar
          }}
          className="max-w-sm"
        />
        <ProcessosFiltrosAvancados
          filters={filtros}
          onFiltersChange={handleFiltersChange}
          onReset={handleFiltersReset}
        />
      </div>
      
      {/* Tabela */}
      <DataTable
        data={processos}
        columns={colunas}
        pagination={
          paginacao
            ? {
                pageIndex: paginacao.pagina - 1, // Converter para 0-indexed
                pageSize: paginacao.limite,
                total: paginacao.total,
                totalPages: paginacao.totalPaginas,
                onPageChange: setPagina,
                onPageSizeChange: setLimite,
              }
            : undefined
        }
        sorting={{
          columnId: ordenarPor,
          direction: ordem,
          onSortingChange: handleSortingChange,
        }}
        isLoading={isLoading}
        error={error}
        emptyMessage="Nenhum processo encontrado."
      />
    </div>
  );
}

