'use client';

/**
 * Table Wrapper de Terceiros
 * Lista e gerencia terceiros vinculados aos processos (peritos, MP, assistentes, etc.)
 */

import * as React from 'react';
import Link from 'next/link';
import { useDebounce } from '@/hooks/use-debounce';
import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Eye, Pencil, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type VisibilityState,
} from '@tanstack/react-table';
import type { Terceiro, ProcessoRelacionado } from '../../types';

// Imports da nova estrutura de features
import { useTerceiros } from '../../hooks';
import { ProcessosRelacionadosCell, CopyButton, MapButton, ContatoCell, FilterPopover } from '../shared';
import { TerceiroFormDialog } from './terceiro-form';
import { ChatwootSyncButton } from '@/features/chatwoot/components';
import { DataTableColumnHeader } from '@/components/shared/data-shell/data-table-column-header';
import {
  formatarCpf,
  formatarCnpj,
  formatarNome,
  formatarEnderecoCompleto,
  calcularIdade,
} from '../../utils';
import type { TerceirosFilters } from '../../types';
import { AppBadge as Badge } from '@/components/ui/app-badge';
import { getSemanticBadgeVariant, getParteTipoLabel } from '@/lib/design-system';

/**
 * Tipo estendido de terceiro com processos relacionados
 */
type TerceiroEndereco = {
  cep?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  municipio?: string | null;
  estado_sigla?: string | null;
};

type TerceiroComProcessos = Terceiro & {
  processos_relacionados?: ProcessoRelacionado[];
  endereco?: TerceiroEndereco | null;
};

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

interface TerceiroActionsProps {
  terceiro: TerceiroComProcessos;
  onEdit: (terceiro: TerceiroComProcessos) => void;
}

function TerceiroActions({ terceiro, onEdit }: TerceiroActionsProps) {
  return (
    <ButtonGroup>
      <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
        <Link href={`/app/partes/terceiros/${terceiro.id}`}>
          <Eye className="h-4 w-4" />
          <span className="sr-only">Visualizar terceiro</span>
        </Link>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => onEdit(terceiro)}
      >
        <Pencil className="h-4 w-4" />
        <span className="sr-only">Editar terceiro</span>
      </Button>
    </ButtonGroup>
  );
}

export function TerceirosTableWrapper() {
  const [busca, setBusca] = React.useState('');
  const [pagina, setPagina] = React.useState(0);
  const [limite] = React.useState(50);

  // Filtros
  const [tipoPessoa, setTipoPessoa] = React.useState<'all' | 'pf' | 'pj'>('all');
  const [tipoParte, setTipoParte] = React.useState<string>('all');
  const [polo, setPolo] = React.useState<'all' | 'ativo' | 'passivo'>('all');
  const [situacao, setSituacao] = React.useState<'all' | 'A' | 'I'>('all');

  // Table state
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});

  // Estados para diálogos
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [terceiroParaEditar, setTerceiroParaEditar] = React.useState<TerceiroComProcessos | null>(null);

  // Debounce da busca
  const buscaDebounced = useDebounce(busca, 500);

  const params = React.useMemo(() => {
    const filtros: TerceirosFilters = {};
    if (tipoPessoa !== 'all') filtros.tipo_pessoa = tipoPessoa;
    if (tipoParte !== 'all') filtros.tipo_parte = tipoParte;
    if (polo !== 'all') filtros.polo = polo;
    if (situacao !== 'all') filtros.situacao = situacao;

    return {
      pagina: pagina + 1,
      limite,
      busca: buscaDebounced || undefined,
      incluirEndereco: true,
      incluirProcessos: true,
      ...filtros,
    };
  }, [pagina, limite, buscaDebounced, tipoPessoa, tipoParte, polo, situacao]);

  const { terceiros, paginacao, isLoading, error, refetch } = useTerceiros(params);

  const handleEdit = React.useCallback((terceiro: TerceiroComProcessos) => {
    setTerceiroParaEditar(terceiro);
    setEditOpen(true);
  }, []);

  const columns = React.useMemo<ColumnDef<TerceiroComProcessos>[]>(
    () => [
      {
        id: 'identificacao',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Identificação" />
        ),
        enableSorting: true,
        accessorKey: 'nome',
        size: 300,
        meta: { align: 'left' },
        cell: ({ row }) => {
          const terceiro = row.original;
          const isPF = terceiro.tipo_pessoa === 'pf';
          const documento = isPF ? formatarCpf(terceiro.cpf) : formatarCnpj(terceiro.cnpj);
          const documentoRaw = isPF ? terceiro.cpf : terceiro.cnpj;
          const dataNascimento = isPF && terceiro.data_nascimento ? terceiro.data_nascimento : null;
          const idade = calcularIdade(dataNascimento);
          const tipoParteTerceiro = terceiro.tipo_parte;

          return (
            <div className="flex flex-col items-start gap-0.5 max-w-full overflow-hidden">
              {/* Badge do tipo de parte */}
              {tipoParteTerceiro && (
                <Badge variant={getSemanticBadgeVariant('parte', tipoParteTerceiro)} className="w-fit mb-1">
                  {getParteTipoLabel(tipoParteTerceiro)}
                </Badge>
              )}
              <div className="flex items-center gap-1 max-w-full">
                <span className="text-sm font-medium wrap-break-word whitespace-normal">
                  {formatarNome(terceiro.nome)}
                </span>
                <CopyButton text={terceiro.nome} label="Copiar nome" />
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
          const terceiro = row.original;
          return (
            <ContatoCell
              telefones={[
                { ddd: terceiro.ddd_celular, numero: terceiro.numero_celular },
                { ddd: terceiro.ddd_comercial, numero: terceiro.numero_comercial },
                { ddd: terceiro.ddd_residencial, numero: terceiro.numero_residencial },
              ]}
              emails={terceiro.emails}
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
          const terceiro = row.original;
          return (
            <div className="flex items-center justify-center">
              <ProcessosRelacionadosCell
                processos={terceiro.processos_relacionados || []}
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
              <TerceiroActions terceiro={row.original} onEdit={handleEdit} />
            </div>
          );
        },
        enableHiding: false,
      },
    ],
    [handleEdit]
  );

  const table = useReactTable({
    data: terceiros,
    columns,
    state: {
      sorting,
      columnVisibility,
    },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    pageCount: paginacao?.totalPaginas ?? 0,
  });

  const handleCreateSuccess = React.useCallback(() => {
    setCreateOpen(false);
    refetch();
  }, [refetch]);

  const handleEditSuccess = React.useCallback(() => {
    setEditOpen(false);
    setTerceiroParaEditar(null);
    refetch();
  }, [refetch]);

  const total = paginacao?.total ?? 0;
  const totalPages = paginacao?.totalPaginas ?? 0;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-4 py-4">
        <Input
          placeholder="Buscar terceiros..."
          value={busca}
          onChange={(e) => {
            setBusca(e.target.value);
            setPagina(0);
          }}
          className="h-10 w-62.5"
        />

        <FilterPopover
          label="Tipo Pessoa"
          value={tipoPessoa}
          onValueChange={(value) => {
            setTipoPessoa(value as 'all' | 'pf' | 'pj');
            setPagina(0);
          }}
          options={[
            { value: 'pf', label: 'Pessoa Física' },
            { value: 'pj', label: 'Pessoa Jurídica' },
          ]}
          defaultValue="all"
        />

        <FilterPopover
          label="Tipo Parte"
          value={tipoParte}
          onValueChange={(value) => {
            setTipoParte(value);
            setPagina(0);
          }}
          options={[
            { value: 'perito', label: 'Perito' },
            { value: 'ministerio_publico', label: 'Ministério Público' },
            { value: 'assistente', label: 'Assistente' },
            { value: 'testemunha', label: 'Testemunha' },
            { value: 'custos_legis', label: 'Custos Legis' },
            { value: 'amicus_curiae', label: 'Amicus Curiae' },
            { value: 'outro', label: 'Outro' },
          ]}
          defaultValue="all"
        />

        <FilterPopover
          label="Polo"
          value={polo}
          onValueChange={(value) => {
            setPolo(value as 'all' | 'ativo' | 'passivo');
            setPagina(0);
          }}
          options={[
            { value: 'ativo', label: 'Polo Ativo' },
            { value: 'passivo', label: 'Polo Passivo' },
          ]}
          defaultValue="all"
        />

        <FilterPopover
          label="Situação"
          value={situacao}
          onValueChange={(value) => {
            setSituacao(value as 'all' | 'A' | 'I');
            setPagina(0);
          }}
          options={[
            { value: 'A', label: 'Ativo' },
            { value: 'I', label: 'Inativo' },
          ]}
          defaultValue="all"
        />

        <div className="ml-auto flex items-center gap-2">
          <ChatwootSyncButton
            tipoEntidade="terceiro"
            apenasAtivos={situacao === 'A'}
          />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-10">
                Colunas <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => column.toggleVisibility(!!value)}
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button onClick={() => setCreateOpen(true)} size="sm" className="h-10">
            Novo Terceiro
          </Button>
        </div>
      </div>

      {/* Error */}
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
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 10 }).map((_, index) => (
                <TableRow key={index}>
                  {columns.map((_, cellIndex) => (
                    <TableCell key={cellIndex}>
                      <Skeleton className="h-8 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  Nenhum terceiro encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between pt-4">
        <div className="text-sm text-muted-foreground">
          {total > 0 ? (
            <>
              Mostrando {pagina * limite + 1} a{' '}
              {Math.min((pagina + 1) * limite, total)} de {total} resultados
            </>
          ) : (
            'Nenhum resultado encontrado'
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPagina((old) => Math.max(0, old - 1))}
            disabled={pagina === 0 || isLoading}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Anterior
          </Button>
          <div className="text-sm text-muted-foreground">
            Página {pagina + 1} de {totalPages || 1}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPagina((old) => old + 1)}
            disabled={pagina >= totalPages - 1 || isLoading}
          >
            Próximo
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>

      {/* Dialogs */}
      <TerceiroFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={handleCreateSuccess}
        mode="create"
      />

      {terceiroParaEditar && (
        <TerceiroFormDialog
          open={editOpen}
          onOpenChange={(open) => {
            setEditOpen(open);
            if (!open) setTerceiroParaEditar(null);
          }}
          terceiro={terceiroParaEditar}
          onSuccess={handleEditSuccess}
          mode="edit"
        />
      )}
    </div>
  );
}
