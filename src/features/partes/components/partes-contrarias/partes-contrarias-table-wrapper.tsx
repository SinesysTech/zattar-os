'use client';

/**
 * Table Wrapper de Partes Contrárias
 * Lista e gerencia partes contrárias dos processos
 */

import * as React from 'react';
import Link from 'next/link';
import {
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
} from '@tanstack/react-table';
import { Columns, Eye, Pencil } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';
import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { DataTableColumnHeader } from '@/components/shared/data-shell/data-table-column-header';
import type { ParteContraria, ProcessoRelacionado } from '../../types';

// Imports da nova estrutura de features
import { usePartesContrarias } from '../../hooks';
import { ProcessosRelacionadosCell, CopyButton, MapButton, ContatoCell, FilterPopover } from '../shared';
import { ParteContrariaFormDialog } from './parte-contraria-form';
import { ChatwootSyncButton } from '@/features/chatwoot/components';
import {
  formatarCpf,
  formatarCnpj,
  formatarNome,
  formatarEnderecoCompleto,
  calcularIdade,
} from '../../utils';
import type { PartesContrariasFilters } from '../../types';

// =============================================================================
// TIPOS
// =============================================================================

/**
 * Tipo estendido de parte contrária com processos relacionados
 */
type ParteEndereco = {
  cep?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  municipio?: string | null;
  estado_sigla?: string | null;
};

type ParteContrariaComProcessos = ParteContraria & {
  processos_relacionados?: ProcessoRelacionado[];
  endereco?: ParteEndereco | null;
};

// =============================================================================
// FUNÇÕES AUXILIARES
// =============================================================================

/**
 * Formata data para exibição (DD/MM/YYYY)
 */
function formatarData(dataISO: string | null): string {
  if (!dataISO) return '';
  try {
    const data = new Date(dataISO);
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

// =============================================================================
// COMPONENTES INTERNOS
// =============================================================================

interface ParteContrariaActionsProps {
  parte: ParteContrariaComProcessos;
  onEdit: (parte: ParteContrariaComProcessos) => void;
}

function ParteContrariaActions({ parte, onEdit }: ParteContrariaActionsProps) {
  return (
    <ButtonGroup>
      <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
        <Link href={`/app/partes/partes-contrarias/${parte.id}`}>
          <Eye className="h-4 w-4" />
          <span className="sr-only">Visualizar parte contrária</span>
        </Link>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => onEdit(parte)}
      >
        <Pencil className="h-4 w-4" />
        <span className="sr-only">Editar parte contrária</span>
      </Button>
    </ButtonGroup>
  );
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export function PartesContrariasTableWrapper() {
  // Search & Filters
  const [busca, setBusca] = React.useState('');
  const [tipoPessoa, setTipoPessoa] = React.useState<'all' | 'pf' | 'pj'>('all');
  const [situacao, setSituacao] = React.useState<'all' | 'A' | 'I'>('all');

  // Pagination
  const [pagina, setPagina] = React.useState(0);
  const [limite] = React.useState(50);

  // Table state
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});

  // Dialog state
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [parteParaEditar, setParteParaEditar] = React.useState<ParteContrariaComProcessos | null>(null);

  // Debounce da busca
  const buscaDebounced = useDebounce(busca, 500);

  const params = React.useMemo(() => {
    const filtros: PartesContrariasFilters = {};
    if (tipoPessoa !== 'all') filtros.tipo_pessoa = tipoPessoa;
    if (situacao !== 'all') filtros.situacao = situacao;

    return {
      pagina: pagina + 1,
      limite,
      busca: buscaDebounced || undefined,
      incluirEndereco: true,
      incluirProcessos: true,
      ...filtros,
    };
  }, [pagina, limite, buscaDebounced, tipoPessoa, situacao]);

  const { partesContrarias, paginacao, isLoading, error, refetch } = usePartesContrarias(params);

  // Handlers
  const handleEdit = React.useCallback((parte: ParteContrariaComProcessos) => {
    setParteParaEditar(parte);
    setEditOpen(true);
  }, []);

  const handleCreateSuccess = React.useCallback(() => {
    setCreateOpen(false);
    refetch();
  }, [refetch]);

  const handleEditSuccess = React.useCallback(() => {
    setEditOpen(false);
    setParteParaEditar(null);
    refetch();
  }, [refetch]);

  // Columns definition
  const columns = React.useMemo<ColumnDef<ParteContrariaComProcessos>[]>(
    () => [
      {
        id: 'identificacao',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Identificação" />
        ),
        enableSorting: true,
        accessorKey: 'nome',
        size: 280,
        meta: { align: 'left' },
        cell: ({ row }) => {
          const parte = row.original;
          const isPF = parte.tipo_pessoa === 'pf';
          const documento = isPF ? formatarCpf(parte.cpf) : formatarCnpj(parte.cnpj);
          const documentoRaw = isPF ? parte.cpf : parte.cnpj;
          const dataNascimento = isPF && parte.data_nascimento ? parte.data_nascimento : null;
          const idade = calcularIdade(dataNascimento);

          return (
            <div className="flex flex-col items-start gap-0.5 max-w-full overflow-hidden">
              <div className="flex items-center gap-1 max-w-full">
                <span className="text-sm font-medium wrap-break-word whitespace-normal">
                  {formatarNome(parte.nome)}
                </span>
                <CopyButton text={parte.nome} label="Copiar nome" />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground">
                  {documento}
                </span>
                {documentoRaw && (
                  <CopyButton text={documentoRaw} label={isPF ? 'Copiar CPF' : 'Copiar CNPJ'} />
                )}
              </div>
              {isPF && dataNascimento && (
                <span className="text-xs text-muted-foreground text-left">
                  {formatarData(dataNascimento)}
                  {idade !== null && ` - ${idade} anos`}
                </span>
              )}
            </div>
          );
        },
      },
      {
        id: 'contato',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Contato" />,
        enableSorting: false,
        size: 240,
        meta: { align: 'left' },
        cell: ({ row }) => {
          const parte = row.original;
          return (
            <ContatoCell
              telefones={[
                { ddd: parte.ddd_celular, numero: parte.numero_celular },
                { ddd: parte.ddd_comercial, numero: parte.numero_comercial },
                { ddd: parte.ddd_residencial, numero: parte.numero_residencial },
              ]}
              emails={parte.emails}
            />
          );
        },
      },
      {
        id: 'endereco',
        header: 'Endereço',
        enableSorting: false,
        size: 280,
        meta: { align: 'left' },
        cell: ({ row }) => {
          const enderecoFormatado = formatarEnderecoCompleto(row.original.endereco);
          const hasEndereco = enderecoFormatado && enderecoFormatado !== '-';

          return (
            <div className="flex items-start gap-1 max-w-full overflow-hidden">
              <span
                className="text-sm whitespace-normal wrap-break-word flex-1"
                title={enderecoFormatado}
              >
                {enderecoFormatado || '-'}
              </span>
              {hasEndereco && (
                <>
                  <CopyButton text={enderecoFormatado} label="Copiar endereço" />
                  <MapButton address={enderecoFormatado} />
                </>
              )}
            </div>
          );
        },
      },
      {
        id: 'processos',
        header: 'Processos',
        enableSorting: false,
        meta: { align: 'center' },
        size: 200,
        cell: ({ row }) => {
          const parte = row.original;
          return (
            <div className="flex items-center justify-center">
              <ProcessosRelacionadosCell
                processos={parte.processos_relacionados || []}
              />
            </div>
          );
        },
      },
      {
        id: 'acoes',
        header: 'Ações',
        enableSorting: false,
        meta: { align: 'center' },
        size: 120,
        cell: ({ row }) => {
          return (
            <div className="flex items-center justify-center">
              <ParteContrariaActions parte={row.original} onEdit={handleEdit} />
            </div>
          );
        },
        enableHiding: false,
      },
    ],
    [handleEdit]
  );

  // TanStack Table
  const table = useReactTable({
    data: partesContrarias,
    columns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: { sorting, columnVisibility },
    manualPagination: true,
    pageCount: paginacao?.totalPaginas ?? 0,
  });

  const pageIndex = pagina;
  const total = paginacao?.total ?? 0;
  const totalPages = paginacao?.totalPaginas ?? 0;

  return (
    <>
      <div className="w-full">
        {/* Toolbar */}
        <div className="flex items-center gap-4 py-4">
          <div className="flex gap-2 flex-1">
            <Input
              placeholder="Buscar partes contrárias..."
              value={busca}
              onChange={(e) => {
                setBusca(e.target.value);
                setPagina(0);
              }}
              className="max-w-sm"
            />
            <FilterPopover
              label="Tipo Pessoa"
              options={[
                { value: 'pf', label: 'Pessoa Física' },
                { value: 'pj', label: 'Pessoa Jurídica' },
              ]}
              value={tipoPessoa}
              onValueChange={(val) => {
                setTipoPessoa(val as typeof tipoPessoa);
                setPagina(0);
              }}
              defaultValue="all"
            />
            <FilterPopover
              label="Situação"
              options={[
                { value: 'A', label: 'Ativo' },
                { value: 'I', label: 'Inativo' },
              ]}
              value={situacao}
              onValueChange={(val) => {
                setSituacao(val as typeof situacao);
                setPagina(0);
              }}
              defaultValue="all"
            />
          </div>
          <div className="flex items-center gap-2">
            <ChatwootSyncButton
              tipoEntidade="parte_contraria"
              apenasAtivos={situacao === 'A'}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Columns className="h-4 w-4" />
                  <span className="hidden md:inline">Colunas</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => column.toggleVisibility(value)}
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button onClick={() => setCreateOpen(true)}>Nova Parte Contrária</Button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={`skeleton-${i}`}>
                    {columns.map((_, j) => (
                      <TableCell key={`skeleton-${i}-${j}`}>
                        <Skeleton className="h-8 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    Nenhuma parte contrária encontrada.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 0 && (
          <div className="flex items-center justify-between pt-4">
            <div className="text-muted-foreground text-sm">
              {total} registro(s)
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Página {pageIndex + 1} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagina(Math.max(0, pageIndex - 1))}
                disabled={pageIndex === 0 || isLoading}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagina(Math.min(totalPages - 1, pageIndex + 1))}
                disabled={pageIndex >= totalPages - 1 || isLoading}
              >
                Próximo
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Dialogs */}
      <ParteContrariaFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={handleCreateSuccess}
        mode="create"
      />

      {parteParaEditar && (
        <ParteContrariaFormDialog
          open={editOpen}
          onOpenChange={(open) => {
            setEditOpen(open);
            if (!open) setParteParaEditar(null);
          }}
          parteContraria={parteParaEditar}
          onSuccess={handleEditSuccess}
          mode="edit"
        />
      )}
    </>
  );
}
