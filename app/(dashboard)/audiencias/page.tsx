'use client';

// Página de audiências - Lista audiências agendadas

import * as React from 'react';
import { useDebounce } from '@/hooks/use-debounce';
import { DataTable } from '@/components/data-table';
import { DataTableColumnHeader } from '@/components/data-table-column-header';
import { AudienciasFiltrosAvancados } from '@/components/audiencias-filtros-avancados';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAudiencias } from '@/lib/hooks/use-audiencias';
import { useUsuarios } from '@/lib/hooks/use-usuarios';
import type { ColumnDef } from '@tanstack/react-table';
import type { Audiencia } from '@/backend/types/audiencias/types';
import type { AudienciasFilters } from '@/lib/types/audiencias';


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
 * Formata status da audiência para exibição
 */
const formatarStatus = (status: string | null): string => {
  if (!status) return '-';
  const statusMap: Record<string, string> = {
    M: 'Marcada',
    R: 'Realizada',
    C: 'Cancelada',
  };
  return statusMap[status] || status;
};

/**
 * Componente para atribuir responsável a uma audiência
 */
function ResponsavelCell({ audiencia, onSuccess }: { audiencia: Audiencia; onSuccess: () => void }) {
  const [isLoading, setIsLoading] = React.useState(false);
  const { usuarios } = useUsuarios({ ativo: true, limite: 1000 });

  const handleChange = async (value: string) => {
    setIsLoading(true);
    try {
      const responsavelId = value === 'null' || value === '' ? null : parseInt(value, 10);
      
      const response = await fetch(`/api/audiencias/${audiencia.id}/responsavel`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ responsavelId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(errorData.error || 'Erro ao atribuir responsável');
      }

      // Atualizar a lista após sucesso
      onSuccess();
    } catch (error) {
      console.error('Erro ao atribuir responsável:', error);
      // Em caso de erro, ainda atualizamos para mostrar o estado atual
      onSuccess();
    } finally {
      setIsLoading(false);
    }
  };

  const responsavelAtual = usuarios.find(u => u.id === audiencia.responsavel_id);

  return (
    <Select
      value={audiencia.responsavel_id?.toString() || 'null'}
      onValueChange={handleChange}
      disabled={isLoading}
    >
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Sem responsável">
          {responsavelAtual ? responsavelAtual.nomeExibicao : 'Sem responsável'}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="null">Sem responsável</SelectItem>
        {usuarios.map((usuario) => (
          <SelectItem key={usuario.id} value={usuario.id.toString()}>
            {usuario.nomeExibicao}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/**
 * Define as colunas da tabela de audiências
 */
function criarColunas(onSuccess: () => void): ColumnDef<Audiencia>[] {
  return [
  {
    accessorKey: 'data_inicio',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Data e Hora de Início" />
    ),
    enableSorting: true,
    cell: ({ row }) => formatarDataHora(row.getValue('data_inicio')),
  },
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
    accessorKey: 'polo_ativo_nome',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Parte Autora" />
    ),
    enableSorting: true,
    cell: ({ row }) => <div>{row.getValue('polo_ativo_nome') || '-'}</div>,
  },
  {
    accessorKey: 'polo_passivo_nome',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Parte Ré" />
    ),
    enableSorting: true,
    cell: ({ row }) => <div>{row.getValue('polo_passivo_nome') || '-'}</div>,
  },
  {
    accessorKey: 'sala_audiencia_nome',
    header: 'Sala de Audiência',
    cell: ({ row }) => (
      <div>{row.getValue('sala_audiencia_nome') || '-'}</div>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as string;
      const statusValue = formatarStatus(status);
      const variant =
        status === 'M'
          ? 'default'
          : status === 'R'
            ? 'secondary'
            : status === 'C'
              ? 'destructive'
              : 'outline';
      return (
        <Badge variant={variant} className="capitalize">
          {statusValue}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'tipo_descricao',
    header: 'Tipo',
    cell: ({ row }) => {
      const tipo = row.getValue('tipo_descricao') as string | null;
      const isVirtual = row.original.tipo_is_virtual;
      return (
        <div className="flex items-center gap-2">
          <span>{tipo || '-'}</span>
          {isVirtual && (
            <Badge variant="outline" className="text-xs">
              Virtual
            </Badge>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: 'data_fim',
    header: 'Data e Hora de Fim',
    cell: ({ row }) => formatarDataHora(row.getValue('data_fim')),
  },
  {
    accessorKey: 'responsavel_id',
    header: 'Responsável',
    cell: ({ row }) => (
      <ResponsavelCell audiencia={row.original} onSuccess={onSuccess} />
    ),
  },
];
}

export default function AudienciasPage() {
  const [busca, setBusca] = React.useState('');
  const [pagina, setPagina] = React.useState(0);
  const [limite, setLimite] = React.useState(50);
  const [ordenarPor, setOrdenarPor] = React.useState<
    'data_inicio' | 'numero_processo' | 'polo_ativo_nome' | 'polo_passivo_nome' | null
  >('data_inicio');
  const [ordem, setOrdem] = React.useState<'asc' | 'desc'>('asc');
  const [filtros, setFiltros] = React.useState<AudienciasFilters>({});

  // Debounce da busca
  const buscaDebounced = useDebounce(busca, 500);

  // Parâmetros para buscar audiências
  const params = React.useMemo(
    () => ({
      pagina: pagina + 1, // API usa 1-indexed
      limite,
      busca: buscaDebounced || undefined,
      ordenar_por: ordenarPor || undefined,
      ordem,
      ...filtros, // Spread dos filtros avançados
    }),
    [pagina, limite, buscaDebounced, ordenarPor, ordem, filtros]
  );

  const { audiencias, paginacao, isLoading, error, refetch } = useAudiencias(params);

  const handleSuccess = React.useCallback(() => {
    refetch();
  }, [refetch]);

  const colunas = React.useMemo(
    () => criarColunas(handleSuccess),
    [handleSuccess]
  );

  const handleSortingChange = React.useCallback(
    (columnId: string | null, direction: 'asc' | 'desc' | null) => {
      if (columnId && direction) {
        setOrdenarPor(columnId as typeof ordenarPor);
        setOrdem(direction);
      } else {
        setOrdenarPor(null);
        setOrdem('asc');
      }
    },
    []
  );

  const handleFiltersChange = React.useCallback((newFilters: AudienciasFilters) => {
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
          placeholder="Buscar por número do processo, parte autora ou parte ré..."
          value={busca}
          onChange={(e) => {
            setBusca(e.target.value);
            setPagina(0); // Resetar para primeira página ao buscar
          }}
          className="max-w-sm"
        />
        <AudienciasFiltrosAvancados
          filters={filtros}
          onFiltersChange={handleFiltersChange}
          onReset={handleFiltersReset}
        />
      </div>

      {/* Tabela */}
      <DataTable
        data={audiencias}
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
        emptyMessage="Nenhuma audiência encontrada."
      />
    </div>
  );
}

