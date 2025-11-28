'use client';

/**
 * Tab de Terceiros
 * Lista e gerencia terceiros vinculados aos processos (peritos, MP, assistentes, etc.)
 */

import * as React from 'react';
import Link from 'next/link';
import { useDebounce } from '@/app/_lib/hooks/use-debounce';
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
  formatarEnderecoCompleto,
} from '@/app/_lib/utils/format-clientes';
import { getTipoParteLabel, getPoloLabel } from '@/app/_lib/types/terceiros';
import type { ColumnDef } from '@tanstack/react-table';
import type { Terceiro } from '@/app/_lib/types';
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
    incluirEndereco: true, // Incluir endereços nas respostas
    ...filtros,
  }), [pagina, limite, buscaDebounced, filtros]);

  const { terceiros, paginacao, isLoading, error } = useTerceiros(params);

  const columns = React.useMemo<ColumnDef<Terceiro>[]>(
    () => [
      {
        id: 'identificacao',
        header: ({ column }) => (
          <div className="flex items-center justify-start">
            <DataTableColumnHeader column={column} title="Identificação" />
          </div>
        ),
        enableSorting: true,
        accessorKey: 'nome',
        size: 300,
        meta: { align: 'left' },
        cell: ({ row }) => {
          const terceiro = row.original;
          const isPF = terceiro.tipo_pessoa === 'pf';
          const documento = isPF ? formatarCpf(terceiro.cpf) : formatarCnpj(terceiro.cnpj);

          return (
            <div className="min-h-10 flex items-start justify-start py-2">
              <div className="flex flex-col gap-1">
                <Badge
                  variant="soft"
                  tone={isPF ? 'info' : 'warning'}
                  className="w-fit"
                >
                  {isPF ? 'Pessoa Física' : 'Pessoa Jurídica'}
                </Badge>
                <span className="text-sm font-medium">
                  {formatarNome(terceiro.nome)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {documento}
                </span>
              </div>
            </div>
          );
        },
      },
      {
        id: 'endereco',
        header: () => (
          <div className="flex items-center justify-start">
            <div className="text-sm font-medium">Endereço</div>
          </div>
        ),
        enableSorting: false,
        size: 300,
        meta: { align: 'left' },
        cell: ({ row }) => {
          const terceiro = row.original as Terceiro & { endereco?: any };
          const enderecoFormatado = formatarEnderecoCompleto(terceiro.endereco);
          return (
            <div className="min-h-10 flex items-center justify-start text-sm">
              {enderecoFormatado}
            </div>
          );
        },
      },
      {
        accessorKey: 'tipo_parte',
        header: ({ column }) => (
          <div className="flex items-center justify-center">
            <DataTableColumnHeader column={column} title="Tipo de Parte" />
          </div>
        ),
        enableSorting: true,
        size: 150,
        cell: ({ row }) => {
          if (!row.original.tipo_parte) return '-';
          return (
            <div className="min-h-10 flex items-center justify-center">
              <Badge variant="outline" tone="info">
                {getTipoParteLabel(row.original.tipo_parte)}
              </Badge>
            </div>
          );
        },
      },
      {
        accessorKey: 'polo',
        header: () => (
          <div className="flex items-center justify-center">
            <div className="text-sm font-medium">Polo</div>
          </div>
        ),
        enableSorting: false,
        size: 100,
        cell: ({ row }) => {
          if (!row.original.polo) return '-';
          return (
            <div className="min-h-10 flex items-center justify-center">
              <Badge variant="soft" tone="neutral">
                {getPoloLabel(row.original.polo)}
              </Badge>
            </div>
          );
        },
      },
      {
        id: 'email',
        header: () => (
          <div className="flex items-center justify-start">
            <div className="text-sm font-medium">E-mail</div>
          </div>
        ),
        enableSorting: false,
        size: 200,
        meta: { align: 'left' },
        cell: ({ row }) => {
          const terceiro = row.original;
          const emails = terceiro.emails;
          return (
            <div className="min-h-10 flex items-center justify-start text-sm">
              {emails && emails.length > 0 ? emails[0] : '-'}
            </div>
          );
        },
      },
      {
        id: 'telefone',
        header: () => (
          <div className="flex items-center justify-center">
            <div className="text-sm font-medium">Telefone</div>
          </div>
        ),
        enableSorting: false,
        size: 150,
        cell: ({ row }) => {
          const terceiro = row.original;
          const telefone = terceiro.ddd_residencial && terceiro.numero_residencial
            ? `${terceiro.ddd_residencial}${terceiro.numero_residencial}`
            : null;
          return (
            <div className="min-h-10 flex items-center justify-center text-sm">
              {telefone ? formatarTelefone(telefone) : '-'}
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
        size: 120,
        cell: ({ row }) => {
          return (
            <div className="min-h-10 flex items-center justify-center">
              <TerceiroActions terceiro={row.original} />
            </div>
          );
        },
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
        filterButtonsMode="buttons"
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
