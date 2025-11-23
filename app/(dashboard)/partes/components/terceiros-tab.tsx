'use client';

/**
 * Tab de Terceiros
 * Lista e gerencia terceiros vinculados aos processos (peritos, MP, assistentes, etc.)
 */

import * as React from 'react';
import Link from 'next/link';
import { useDebounce } from '@/hooks/use-debounce';
import { DataTable } from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { TableToolbar } from '@/components/ui/table-toolbar';
import {
  buildTerceirosFilterOptions,
  buildTerceirosFilterGroups,
  parseTerceirosFilters,
  type TerceirosFilters,
} from './terceiros-toolbar-filters';
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
import { getTipoParteLabel, getPoloLabel } from '@/lib/types/partes/terceiros';
import type { ColumnDef } from '@tanstack/react-table';
import type { Terceiro } from '@/lib/types/partes';
import { useTerceiros } from '@/app/_lib/hooks/use-terceiros';

interface TerceirosTabProps {}

function TerceiroActions({ terceiro }: { terceiro: Terceiro }) {
  return (
    <ButtonGroup>
      <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
        <Link href={`/partes/terceiros/${terceiro.id}`}>
          <Eye className="h-4 w-4" />
          <span className="sr-only">Visualizar terceiro</span>
        </Link>
      </Button>
      <Button variant="ghost" size="icon" className="h-8 w-8" disabled>
        <Pencil className="h-4 w-4" />
        <span className="sr-only">Editar terceiro</span>
      </Button>
    </ButtonGroup>
  );
}

export function TerceirosTab({}: TerceirosTabProps) {
  const [busca, setBusca] = React.useState('');
  const [pagina, setPagina] = React.useState(0);
  const [limite, setLimite] = React.useState(50);
  const [ordenarPor, setOrdenarPor] = React.useState<'nome' | 'cpf' | 'cnpj' | 'tipo_parte' | null>('nome');
  const [ordem, setOrdem] = React.useState<'asc' | 'desc'>('asc');
  const [filtros, setFiltros] = React.useState<TerceirosFilters>({});
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

  const { terceiros, paginacao, isLoading, error } = useTerceiros(params);

  const columns = React.useMemo<ColumnDef<Terceiro>[]>(
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
          const terceiro = row.original;
          if (terceiro.tipo_pessoa === 'pf') {
            return terceiro.cpf ? formatarCpf(terceiro.cpf) : '-';
          }
          return terceiro.cnpj ? formatarCnpj(terceiro.cnpj) : '-';
        },
      },
      {
        accessorKey: 'tipo_parte',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Tipo de Parte" />,
        enableSorting: true,
        cell: ({ row }) => {
          if (!row.original.tipo_parte) return '-';
          return (
            <Badge variant="outline" tone="info">
              {getTipoParteLabel(row.original.tipo_parte)}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'polo',
        header: 'Polo',
        cell: ({ row }) => {
          if (!row.original.polo) return '-';
          return (
            <Badge variant="soft" tone="neutral">
              {getPoloLabel(row.original.polo)}
            </Badge>
          );
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
          const terceiro = row.original;
          if (terceiro.ddd_celular && terceiro.numero_celular) {
            return formatarTelefone(`${terceiro.ddd_celular}${terceiro.numero_celular}`);
          }
          if (terceiro.ddd_telefone && terceiro.numero_telefone) {
            return formatarTelefone(`${terceiro.ddd_telefone}${terceiro.numero_telefone}`);
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
        cell: ({ row }) => <TerceiroActions terceiro={row.original} />,
      },
    ],
    []
  );

  const filterOptions = React.useMemo(() => buildTerceirosFilterOptions(), []);
  const filterGroups = React.useMemo(() => buildTerceirosFilterGroups(), []);

  const handleFilterIdsChange = React.useCallback((selectedIds: string[]) => {
    setSelectedFilterIds(selectedIds);
    const newFilters = parseTerceirosFilters(selectedIds);
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
        searchPlaceholder="Buscar terceiros..."
        filterOptions={filterOptions}
        filterGroups={filterGroups}
        selectedFilters={selectedFilterIds}
        onFiltersChange={handleFilterIdsChange}
        onNewClick={() => {
          // TODO: Implementar dialog de criação
          console.log('Novo terceiro');
        }}
        newButtonTooltip="Novo terceiro"
      />

      <DataTable
        columns={columns}
        data={terceiros}
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
        emptyMessage="Nenhum terceiro encontrado"
      />
    </div>
  );
}
