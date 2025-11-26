'use client';

/**
 * Tab de Partes Contrárias
 * Lista e gerencia partes contrárias dos processos
 */

import * as React from 'react';
import Link from 'next/link';
import { useDebounce } from '@/app/_lib/hooks/use-debounce';
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
  formatarEnderecoCompleto,
} from '@/app/_lib/utils/format-clientes';
import type { ColumnDef } from '@tanstack/react-table';
import type { ParteContraria } from '@/app/_lib/types';
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
    incluirEndereco: true, // Incluir endereços nas respostas
    ...filtros,
  }), [pagina, limite, buscaDebounced, filtros]);

  const { partesContrarias, paginacao, isLoading, error } = usePartesContrarias(params);

  const columns = React.useMemo<ColumnDef<ParteContraria>[]>(
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
          const parte = row.original;
          const isPF = parte.tipo_pessoa === 'pf';
          const documento = isPF ? formatarCpf(parte.cpf) : formatarCnpj(parte.cnpj);

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
                  {formatarNome(parte.nome)}
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
          const parte = row.original as ParteContraria & { endereco?: any };
          const enderecoFormatado = formatarEnderecoCompleto(parte.endereco);
          return (
            <div className="min-h-10 flex items-center justify-start text-sm">
              {enderecoFormatado}
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
          const parte = row.original;
          const emails = parte.emails;
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
          const parte = row.original;
          const telefone = parte.ddd_residencial && parte.numero_residencial
            ? `${parte.ddd_residencial}${parte.numero_residencial}`
            : null;
          return (
            <div className="min-h-10 flex items-center justify-center text-sm">
              {telefone ? formatarTelefone(telefone) : '-'}
            </div>
          );
        },
      },
      {
        accessorKey: 'situacao_pje',
        header: ({ column }) => (
          <div className="flex items-center justify-center">
            <DataTableColumnHeader column={column} title="Status" />
          </div>
        ),
        enableSorting: true,
        size: 100,
        cell: ({ row }) => {
          const situacao = row.getValue('situacao_pje') as string | null;
          // PJE pode retornar 'A', 'Ativo', ou null
          const ativo = situacao === 'A' || situacao?.toLowerCase() === 'ativo';
          return (
            <div className="min-h-10 flex items-center justify-center">
              <Badge tone={ativo ? 'success' : 'neutral'} variant={ativo ? 'soft' : 'outline'}>
                {ativo ? 'Ativo' : 'Inativo'}
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
        size: 120,
        cell: ({ row }) => {
          return (
            <div className="min-h-10 flex items-center justify-center">
              <ParteContrariaActions parte={row.original} />
            </div>
          );
        },
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
