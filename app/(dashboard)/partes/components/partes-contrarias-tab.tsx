'use client';

/**
 * Tab de Partes Contrárias
 * Lista e gerencia partes contrárias dos processos
 */

import * as React from 'react';
import Link from 'next/link';
import { useDebounce } from '@/hooks/use-debounce';
import { DataTable } from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { TableToolbar } from '@/components/ui/table-toolbar';
import {
  buildPartesContrariasFilterOptions,
  buildPartesContrariasFilterGroups,
  parsePartesContrariasFilters,
  type PartesContrariasFilters,
} from './partes-contrarias-toolbar-filters';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ButtonGroup } from '@/components/ui/button-group';
import { Eye, Pencil } from 'lucide-react';
import {
  formatarCpf,
  formatarCnpj,
  formatarTelefone,
  formatarNome,
  formatarTipoPessoa,
} from '@/app/_lib/utils/format-clientes';
import type { ColumnDef } from '@tanstack/react-table';
import type { ParteContraria } from '@/lib/types/partes';
import { usePartesContrarias } from '@/app/_lib/hooks/use-partes-contrarias';

interface PartesContrariasTabProps {}

function ParteContrariaActions({ parte }: { parte: ParteContraria }) {
  return (
    <ButtonGroup>
      <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
        <Link href={`/partes/partes-contrarias/${parte.id}`}>
          <Eye className="h-4 w-4" />
          <span className="sr-only">Visualizar parte contrária</span>
        </Link>
      </Button>
      <Button variant="ghost" size="icon" className="h-8 w-8" disabled>
        <Pencil className="h-4 w-4" />
        <span className="sr-only">Editar parte contrária</span>
      </Button>
    </ButtonGroup>
  );
}

export function PartesContrariasTab({}: PartesContrariasTabProps) {
  const [busca, setBusca] = React.useState('');
  const [pagina, setPagina] = React.useState(0);
  const [limite, setLimite] = React.useState(50);
  const [ordenarPor, setOrdenarPor] = React.useState<'nome' | 'cpf' | 'cnpj' | null>('nome');
  const [ordem, setOrdem] = React.useState<'asc' | 'desc'>('asc');
  const [filtros, setFiltros] = React.useState<PartesContrariasFilters>({});
  const [selectedFilterIds, setSelectedFilterIds] = React.useState<string[]>([]);

  // Debounce da busca
  const buscaDebounced = useDebounce(busca, 500);
  const isSearching = busca !== buscaDebounced;

  const params = React.useMemo(() => ({
    pagina: pagina + 1,
    limite,
    busca: buscaDebounced || undefined,
    ...filtros,
  }), [pagina, limite, buscaDebounced, filtros]);

  const { partesContrarias, paginacao, isLoading, error } = usePartesContrarias(params);

  const columns = React.useMemo<ColumnDef<ParteContraria>[]>(
    () => [
      {
        accessorKey: 'nome',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Nome" />,
        enableSorting: true,
        cell: ({ row }) => (
          <div className="flex flex-col gap-1">
            <span className="font-medium">{formatarNome(row.original.nome)}</span>
            {row.original.nome_social && (
              <span className="text-xs text-muted-foreground">
                {row.original.nome_social}
              </span>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'tipo_pessoa',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Tipo" />,
        enableSorting: true,
        cell: ({ row }) => (
          <Badge variant="outline" tone="neutral">
            {formatarTipoPessoa(row.original.tipo_pessoa)}
          </Badge>
        ),
      },
      {
        id: 'documento',
        header: 'Documento',
        cell: ({ row }) => {
          const parte = row.original;
          if (parte.tipo_pessoa === 'pf') {
            return parte.cpf ? formatarCpf(parte.cpf) : '-';
          }
          return parte.cnpj ? formatarCnpj(parte.cnpj) : '-';
        },
      },
      {
        id: 'email',
        header: 'E-mail',
        cell: ({ row }) => {
          const emails = row.original.emails;
          if (!emails || emails.length === 0) return '-';
          return (
            <span className="text-sm text-muted-foreground truncate max-w-[200px] block">
              {emails[0]}
            </span>
          );
        },
      },
      {
        id: 'telefone',
        header: 'Telefone',
        cell: ({ row }) => {
          const parte = row.original;
          if (parte.ddd_celular && parte.numero_celular) {
            return formatarTelefone(`${parte.ddd_celular}${parte.numero_celular}`);
          }
          if (parte.ddd_telefone && parte.numero_telefone) {
            return formatarTelefone(`${parte.ddd_telefone}${parte.numero_telefone}`);
          }
          return '-';
        },
      },
      {
        accessorKey: 'situacao',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
        enableSorting: true,
        cell: ({ row }) => {
          const situacao = row.original.situacao;
          if (!situacao) return '-';
          return (
            <Badge
              tone={situacao === 'A' ? 'success' : 'neutral'}
              variant={situacao === 'A' ? 'soft' : 'outline'}
            >
              {situacao === 'A' ? 'Ativo' : 'Inativo'}
            </Badge>
          );
        },
      },
      {
        id: 'acoes',
        header: 'Ações',
        cell: ({ row }) => <ParteContrariaActions parte={row.original} />,
      },
    ],
    []
  );

  const filterOptions = React.useMemo(() => buildPartesContrariasFilterOptions(), []);
  const filterGroups = React.useMemo(() => buildPartesContrariasFilterGroups(), []);

  const handleFilterIdsChange = React.useCallback((selectedIds: string[]) => {
    setSelectedFilterIds(selectedIds);
    const newFilters = parsePartesContrariasFilters(selectedIds);
    setFiltros(newFilters);
    setPagina(0);
  }, []);

  const handleSortingChange = React.useCallback((columnId: string | null, direction: 'asc' | 'desc' | null) => {
    if (columnId && direction) {
      setOrdenarPor(columnId as typeof ordenarPor);
      setOrdem(direction);
    } else {
      setOrdenarPor(null);
      setOrdem('asc');
    }
  }, []);

  return (
    <div className="space-y-4">
      <TableToolbar
        searchValue={busca}
        onSearchChange={(value) => {
          setBusca(value);
          setPagina(0);
        }}
        isSearching={isSearching}
        searchPlaceholder="Buscar partes contrárias..."
        filterOptions={filterOptions}
        filterGroups={filterGroups}
        selectedFilters={selectedFilterIds}
        onFiltersChange={handleFilterIdsChange}
        onNewClick={() => {
          // TODO: Implementar dialog de criação
          console.log('Nova parte contrária');
        }}
        newButtonTooltip="Nova parte contrária"
      />

      <DataTable
        columns={columns}
        data={partesContrarias}
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
        sorting={{
          columnId: ordenarPor,
          direction: ordem,
          onSortingChange: handleSortingChange,
        }}
        isLoading={isLoading}
        error={error}
        emptyMessage="Nenhuma parte contrária encontrada"
      />
    </div>
  );
}
