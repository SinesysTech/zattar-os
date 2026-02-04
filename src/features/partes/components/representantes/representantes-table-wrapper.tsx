'use client';

/**
 * Table Wrapper de Representantes
 * Lista e gerencia representantes legais (advogados)
 *
 * NOTA: Representantes são sempre advogados (pessoas físicas) com CPF.
 * O modelo foi deduplicado - um registro por CPF, vínculos via processo_partes.
 */

import * as React from 'react';
import Link from 'next/link';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type VisibilityState,
} from '@tanstack/react-table';
import { useDebounce } from '@/hooks/use-debounce';
import { DataTableColumnHeader } from '@/components/shared/data-shell/data-table-column-header';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
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
import { Skeleton } from '@/components/ui/skeleton';
import { Eye, Pencil, Settings2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ProcessoRelacionado } from '../../types';

// Imports da nova estrutura de features
import { useRepresentantes } from '../../hooks';
import { ProcessosRelacionadosCell, CopyButton, ContatoCell, FilterPopover } from '../shared';
import { RepresentanteFormDialog } from './representante-form';
import { formatarCpf, formatarNome } from '../../utils';
import type { Representante, InscricaoOAB } from '../../types';

// UFs do Brasil
const UFS_BRASIL = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
];


/**
 * Tipo estendido de representante com processos relacionados
 */
type RepresentanteComProcessos = Representante & {
  processos_relacionados?: ProcessoRelacionado[];
};

/**
 * Formata número da OAB removendo UF do início se presente
 * Ex: "MG128404" -> "128.404"
 */
function formatarNumeroOab(numero: string): string {
  // Remove UF do início se presente
  const apenasNumeros = numero.replace(/^[A-Z]{2}/i, '').replace(/\D/g, '');
  return apenasNumeros.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/**
 * Retorna o label e a cor do tone para a situação da OAB
 */
function obterSituacaoOab(situacao: string | null | undefined): { label: string; tone: 'success' | 'warning' | 'danger' | 'neutral' } {
  if (!situacao) return { label: '', tone: 'neutral' };

  switch (situacao) {
    case 'REGULAR':
      return { label: 'Regular', tone: 'success' };
    case 'SUSPENSO':
      return { label: 'Suspenso', tone: 'warning' };
    case 'CANCELADO':
      return { label: 'Cancelado', tone: 'danger' };
    case 'LICENCIADO':
      return { label: 'Licenciado', tone: 'warning' };
    case 'FALECIDO':
      return { label: 'Falecido', tone: 'neutral' };
    default:
      return { label: situacao, tone: 'neutral' };
  }
}

/**
 * Badge composto para OAB + Situação
 * Metade esquerda em azul (OAB), metade direita na cor da situação
 */
function OabSituacaoBadge({
  numero,
  uf,
  situacao,
}: {
  numero: string;
  uf: string;
  situacao: string | null;
}) {
  const numeroFormatado = formatarNumeroOab(numero);
  const { label: situacaoLabel, tone: situacaoTone } = obterSituacaoOab(situacao);

  // Classes para cada tone
  const toneClasses = {
    success: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
    warning: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
    danger: 'bg-red-500/15 text-red-700 dark:text-red-400',
    neutral: 'bg-muted text-muted-foreground',
  };

  return (
    <div className="inline-flex items-center text-xs font-medium rounded-full overflow-hidden shrink-0">
      {/* Lado esquerdo: OAB (azul/info) */}
      <span className="bg-sky-500/15 text-sky-700 dark:text-sky-400 px-2 py-0.5">
        {numeroFormatado} OAB-{uf}
      </span>
      {/* Separador e lado direito: Situação */}
      {situacaoLabel && (
        <span className={cn('px-2 py-0.5 border-l border-background/50', toneClasses[situacaoTone])}>
          {situacaoLabel}
        </span>
      )}
    </div>
  );
}

/**
 * Componente para exibir múltiplas OABs
 */
function OabsBadges({ oabs }: { oabs: InscricaoOAB[] }) {
  if (!oabs || oabs.length === 0) return null;

  // Mostrar até 2 OABs na listagem, com indicador de +N se houver mais
  const oabsVisiveis = oabs.slice(0, 2);
  const oabsRestantes = oabs.length - 2;

  return (
    <div className="flex flex-wrap gap-1 items-center">
      {oabsVisiveis.map((oab, index) => (
        <OabSituacaoBadge
          key={index}
          numero={oab.numero}
          uf={oab.uf}
          situacao={oab.situacao}
        />
      ))}
      {oabsRestantes > 0 && (
        <span className="text-xs text-muted-foreground">+{oabsRestantes}</span>
      )}
    </div>
  );
}


/**
 * Componente de ações para cada representante
 */
interface RepresentanteActionsProps {
  representante: Representante;
  onEdit: (representante: Representante) => void;
}

function RepresentanteActions({
  representante,
  onEdit,
}: RepresentanteActionsProps) {
  return (
    <ButtonGroup>
      <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
        <Link href={`/app/partes/representantes/${representante.id}`}>
          <Eye className="h-4 w-4" />
          <span className="sr-only">Visualizar representante</span>
        </Link>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => onEdit(representante)}
      >
        <Pencil className="h-4 w-4" />
        <span className="sr-only">Editar representante</span>
      </Button>
    </ButtonGroup>
  );
}

export function RepresentantesTableWrapper() {
  const [busca, setBusca] = React.useState('');
  const [pagina, setPagina] = React.useState(0);
  const [limite] = React.useState(50);

  // Estados para diálogos
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [representanteParaEditar, setRepresentanteParaEditar] = React.useState<RepresentanteComProcessos | null>(null);

  // Filtros
  const [ufOab, setUfOab] = React.useState<string>('all');

  // TanStack Table states
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});

  // Debounce da busca
  const buscaDebounced = useDebounce(busca, 500);

  // Parâmetros para buscar representantes
  const params = React.useMemo(() => {
    return {
      pagina: pagina + 1, // API usa 1-indexed
      limite,
      busca: buscaDebounced || undefined,
      uf_oab: ufOab !== 'all' ? ufOab : undefined,
      incluirProcessos: true, // Incluir processos relacionados
    };
  }, [pagina, limite, buscaDebounced, ufOab]);

  const { representantes, paginacao, isLoading, error, refetch } = useRepresentantes(params);

  const handleEdit = React.useCallback((representante: RepresentanteComProcessos) => {
    setRepresentanteParaEditar(representante);
    setEditOpen(true);
  }, []);

  const columns = React.useMemo<ColumnDef<RepresentanteComProcessos>[]>(
    () => [
      // Coluna composta: Representante (Badge OAB+Situação | Nome | CPF)
      {
        id: 'representante',
        accessorKey: 'nome',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Representante" />
        ),
        enableSorting: true,
        size: 360,
        meta: { align: 'left' },
        cell: ({ row }) => {
          const representante = row.original;
          const nome = formatarNome(representante.nome);
          const cpf = representante.cpf ? formatarCpf(representante.cpf) : null;
          const cpfRaw = representante.cpf;

          return (
            <div className="flex flex-col items-start gap-0.5 max-w-full overflow-hidden">
              {/* Linha 1: Badges de OABs */}
              {representante.oabs && representante.oabs.length > 0 && (
                <div className="mb-1">
                  <OabsBadges oabs={representante.oabs} />
                </div>
              )}
              {/* Linha 2: Nome */}
              <div className="flex items-center gap-1">
                <span className="font-medium text-sm" title={nome}>
                  {nome}
                </span>
                <CopyButton text={representante.nome} label="Copiar nome" />
              </div>
              {/* Linha 3: CPF */}
              {cpf && (
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">{cpf}</span>
                  {cpfRaw && <CopyButton text={cpfRaw} label="Copiar CPF" />}
                </div>
              )}
            </div>
          );
        },
      },
      // Coluna composta: Contato (Telefone + E-mail)
      {
        id: 'contato',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Contato" />,
        enableSorting: false,
        size: 280,
        meta: { align: 'left' },
        cell: ({ row }) => {
          const rep = row.original;
          return (
            <ContatoCell
              telefones={[
                { ddd: rep.ddd_celular, numero: rep.numero_celular },
                { ddd: rep.ddd_comercial, numero: rep.numero_comercial },
                { ddd: rep.ddd_residencial, numero: rep.numero_residencial },
              ]}
              email={rep.email}
              emails={rep.emails}
            />
          );
        },
      },
      // Processos relacionados
      {
        id: 'processos',
        header: 'Processos',
        enableSorting: false,
        meta: { align: 'center' },
        size: 200,
        cell: ({ row }) => {
          const representante = row.original;
          return (
            <div className="flex items-center justify-center">
              <ProcessosRelacionadosCell processos={representante.processos_relacionados || []} />
            </div>
          );
        },
      },
      // Ações
      {
        id: 'acoes',
        header: 'Ações',
        enableSorting: false,
        meta: { align: 'center' },
        size: 120,
        cell: ({ row }) => {
          const representante = row.original;
          return (
            <div className="flex items-center justify-center">
              <RepresentanteActions representante={representante} onEdit={handleEdit} />
            </div>
          );
        },
        enableHiding: false,
      },
    ],
    [handleEdit]
  );

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: representantes,
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
    setRepresentanteParaEditar(null);
    refetch();
  }, [refetch]);

  const total = paginacao?.total ?? 0;
  const totalPages = paginacao?.totalPaginas ?? 0;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-4 py-4">
        <Input
          placeholder="Buscar por nome, CPF ou OAB..."
          value={busca}
          onChange={(e) => {
            setBusca(e.target.value);
            setPagina(0);
          }}
          className="max-w-sm"
        />

        <FilterPopover
          label="UF OAB"
          value={ufOab}
          onValueChange={(val) => {
            setUfOab(val);
            setPagina(0);
          }}
          options={UFS_BRASIL.map((uf) => ({ value: uf, label: uf }))}
          defaultValue="all"
        />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="ml-auto">
              <Settings2 className="mr-2 h-4 w-4" />
              Colunas
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
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button onClick={() => setCreateOpen(true)}>
          Novo Representante
        </Button>
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
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  {columns.map((_, colIndex) => (
                    <TableCell key={colIndex}>
                      <Skeleton className="h-12 w-full" />
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
                  {error ? (
                    <div className="text-destructive">
                      Erro ao carregar representantes: {error}
                    </div>
                  ) : (
                    'Nenhum representante encontrado.'
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between pt-4">
        <div className="text-sm text-muted-foreground">
          {total > 0
            ? `Mostrando ${pagina * limite + 1} a ${Math.min((pagina + 1) * limite, total)} de ${total} resultado${total !== 1 ? 's' : ''}`
            : 'Nenhum resultado encontrado'}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPagina((p) => Math.max(0, p - 1))}
            disabled={pagina === 0 || isLoading}
          >
            Anterior
          </Button>
          <div className="text-sm text-muted-foreground">
            Página {pagina + 1} de {totalPages || 1}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPagina((p) => p + 1)}
            disabled={pagina >= totalPages - 1 || isLoading}
          >
            Próximo
          </Button>
        </div>
      </div>

      <RepresentanteFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={handleCreateSuccess}
        mode="create"
      />

      {representanteParaEditar && (
        <RepresentanteFormDialog
          open={editOpen}
          onOpenChange={(open) => {
            setEditOpen(open);
            if (!open) setRepresentanteParaEditar(null);
          }}
          representante={representanteParaEditar}
          onSuccess={handleEditSuccess}
          mode="edit"
        />
      )}
    </div>
  );
}
