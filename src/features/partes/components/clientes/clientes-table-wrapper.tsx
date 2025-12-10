'use client';

/**
 * ClientesTableWrapper - Componente Client que encapsula a tabela de clientes
 *
 * Recebe dados iniciais do Server Component e gerencia:
 * - Estado de busca e filtros
 * - Paginacao client-side com refresh via Server Actions
 * - Dialogs de criacao e edicao
 */

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDebounce } from '@/app/_lib/hooks/use-debounce';
import { ResponsiveTable, ResponsiveTableColumn } from '@/components/ui/responsive-table';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import { TableToolbar } from '@/components/ui/table-toolbar';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Eye, Pencil } from 'lucide-react';
import type { Cliente, ProcessoRelacionado } from '@/core/partes';
import { ClienteFormDialog } from './cliente-form';
import { ProcessosRelacionadosCell } from '../shared/processos-relacionados-cell';
import { CopyButton } from '../shared/copy-button';
import {
  formatarCpf,
  formatarCnpj,
  formatarTelefone,
  formatarNome,
  formatarEnderecoCompleto,
  calcularIdade,
} from '../../utils';
import {
  buildClientesFilterOptions,
  buildClientesFilterGroups,
  parseClientesFilters,
} from './clientes-toolbar-filters';
import type { ClientesFilters } from '../../types';
import { actionListarClientes } from '@/app/actions/partes';

// =============================================================================
// TIPOS
// =============================================================================

type ClienteEndereco = {
  cep?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  municipio?: string | null;
  estado_sigla?: string | null;
};

type ClienteComProcessos = Cliente & {
  processos_relacionados?: ProcessoRelacionado[];
  endereco?: ClienteEndereco | null;
};

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

interface ClientesTableWrapperProps {
  initialData: Cliente[];
  initialPagination: PaginationInfo | null;
}

// =============================================================================
// HELPERS
// =============================================================================

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
// COMPONENTES AUXILIARES
// =============================================================================

function ClienteActions({
  cliente,
  onEdit,
}: {
  cliente: ClienteComProcessos;
  onEdit: (cliente: ClienteComProcessos) => void;
}) {
  return (
    <ButtonGroup>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            asChild
          >
            <Link href={`/partes/clientes/${cliente.id}`}>
              <Eye className="h-4 w-4" />
              <span className="sr-only">Visualizar cliente</span>
            </Link>
          </Button>
        </TooltipTrigger>
        <TooltipContent>Visualizar</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onEdit(cliente)}
          >
            <Pencil className="h-4 w-4" />
            <span className="sr-only">Editar cliente</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>Editar</TooltipContent>
      </Tooltip>
    </ButtonGroup>
  );
}

// =============================================================================
// COLUNAS DA TABELA
// =============================================================================

function criarColunas(onEdit: (cliente: ClienteComProcessos) => void): ResponsiveTableColumn<ClienteComProcessos>[] {
  return [
    {
      id: 'identificacao',
      header: ({ column }) => (
        <div className="flex items-center justify-start">
          <DataTableColumnHeader column={column} title="Identificacao" />
        </div>
      ),
      enableSorting: true,
      accessorKey: 'nome',
      size: 320,
      priority: 1,
      sticky: true,
      cardLabel: 'Identificacao',
      meta: { align: 'left' },
      cell: ({ row }) => {
        const cliente = row.original;
        const isPF = cliente.tipo_pessoa === 'pf';
        const documento = isPF ? formatarCpf(cliente.cpf) : formatarCnpj(cliente.cnpj);
        const documentoRaw = isPF ? cliente.cpf : cliente.cnpj;
        const dataNascimento = isPF && 'data_nascimento' in cliente ? cliente.data_nascimento : null;
        const idade = calcularIdade(dataNascimento);

        return (
          <div className="min-h-10 flex items-start justify-start py-2 group">
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-1">
                <span className="text-sm font-medium">
                  {formatarNome(cliente.nome)}
                </span>
                <CopyButton text={cliente.nome} label="Copiar nome" />
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
                <span className="text-xs text-muted-foreground">
                  {formatarData(dataNascimento)}
                  {idade !== null && ` - ${idade} anos`}
                </span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      id: 'contato',
      header: () => (
        <div className="flex items-center justify-start">
          <div className="text-sm font-medium">Contato</div>
        </div>
      ),
      enableSorting: false,
      size: 280,
      priority: 2,
      cardLabel: 'Contato',
      meta: { align: 'left' },
      cell: ({ row }) => {
        const cliente = row.original;
        const emails = cliente.emails || [];

        const telefones: { ddd: string; numero: string; tipo: string }[] = [];
        if (cliente.ddd_celular && cliente.numero_celular) {
          telefones.push({ ddd: cliente.ddd_celular, numero: cliente.numero_celular, tipo: 'Cel' });
        }
        if (cliente.ddd_residencial && cliente.numero_residencial) {
          telefones.push({ ddd: cliente.ddd_residencial, numero: cliente.numero_residencial, tipo: 'Res' });
        }
        if (cliente.ddd_comercial && cliente.numero_comercial) {
          telefones.push({ ddd: cliente.ddd_comercial, numero: cliente.numero_comercial, tipo: 'Com' });
        }

        const hasContato = emails.length > 0 || telefones.length > 0;

        return (
          <div className="min-h-10 flex items-start justify-start py-2 group">
            {hasContato ? (
              <div className="flex flex-col gap-0.5">
                {emails.slice(0, 2).map((email, idx) => (
                  <div key={idx} className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground">
                      {email}
                    </span>
                    <CopyButton text={email} label="Copiar e-mail" />
                  </div>
                ))}
                {emails.length > 2 && (
                  <span className="text-xs text-muted-foreground">
                    +{emails.length - 2} e-mail(s)
                  </span>
                )}
                {telefones.map((tel, idx) => {
                  const telefoneFormatado = formatarTelefone(`${tel.ddd}${tel.numero}`);
                  const telefoneRaw = `${tel.ddd}${tel.numero}`;
                  return (
                    <div key={idx} className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground">
                        {telefoneFormatado}
                      </span>
                      <CopyButton text={telefoneRaw} label="Copiar telefone" />
                    </div>
                  );
                })}
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">-</span>
            )}
          </div>
        );
      },
    },
    {
      id: 'endereco',
      header: () => (
        <div className="flex items-center justify-start">
          <div className="text-sm font-medium">Endereco</div>
        </div>
      ),
      enableSorting: false,
      size: 260,
      priority: 4,
      cardLabel: 'Endereco',
      meta: { align: 'left' },
      cell: ({ row }) => {
        const cliente = row.original;
        const enderecoFormatado = formatarEnderecoCompleto(cliente.endereco);
        return (
          <div className="min-h-10 flex items-center justify-start text-sm">
            {enderecoFormatado}
          </div>
        );
      },
    },
    {
      id: 'processos',
      header: () => (
        <div className="flex items-center justify-start">
          <div className="text-sm font-medium">Processos</div>
        </div>
      ),
      enableSorting: false,
      size: 240,
      priority: 3,
      cardLabel: 'Processos',
      cell: ({ row }) => {
        const cliente = row.original;
        return (
          <ProcessosRelacionadosCell
            processos={cliente.processos_relacionados || []}
          />
        );
      },
    },
    {
      id: 'acoes',
      header: () => (
        <div className="flex items-center justify-center">
          <div className="text-sm font-medium">Acoes</div>
        </div>
      ),
      enableSorting: false,
      size: 120,
      priority: 5,
      cardLabel: 'Acoes',
      cell: ({ row }) => {
        const cliente = row.original;
        return (
          <div className="min-h-10 flex items-center justify-center">
            <ClienteActions cliente={cliente} onEdit={onEdit} />
          </div>
        );
      },
    },
  ];
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export function ClientesTableWrapper({
  initialData,
  initialPagination,
}: ClientesTableWrapperProps) {
  const router = useRouter();
  const [clientes, setClientes] = React.useState<ClienteComProcessos[]>(initialData as ClienteComProcessos[]);
  const [paginacao, setPaginacao] = React.useState(initialPagination);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [busca, setBusca] = React.useState('');
  const [pagina, setPagina] = React.useState(0);
  const [limite, setLimite] = React.useState(50);
  const [filtros, setFiltros] = React.useState<ClientesFilters>({});
  const [selectedFilterIds, setSelectedFilterIds] = React.useState<string[]>([]);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [clienteParaEditar, setClienteParaEditar] = React.useState<ClienteComProcessos | null>(null);

  const buscaDebounced = useDebounce(busca, 500);
  const isSearching = busca !== buscaDebounced;

  // Funcao para recarregar dados
  const refetch = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await actionListarClientes({
        pagina: pagina + 1,
        limite,
        busca: buscaDebounced || undefined,
        ...filtros,
      });

      if (result.success) {
        const data = result.data as { data: ClienteComProcessos[]; pagination: PaginationInfo };
        setClientes(data.data);
        setPaginacao(data.pagination);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar clientes');
    } finally {
      setIsLoading(false);
    }
  }, [pagina, limite, buscaDebounced, filtros]);

  // Ref para controlar primeira renderizacao
  const isFirstRender = React.useRef(true);

  // Recarregar quando parametros mudam
  React.useEffect(() => {
    // Evitar execucao na montagem inicial
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    refetch();
  }, [pagina, buscaDebounced, filtros, refetch]);

  const handleEdit = React.useCallback((cliente: ClienteComProcessos) => {
    setClienteParaEditar(cliente);
    setEditOpen(true);
  }, []);

  const handleEditSuccess = React.useCallback(() => {
    refetch();
    setEditOpen(false);
    setClienteParaEditar(null);
    router.refresh();
  }, [refetch, router]);

  const handleCreateSuccess = React.useCallback(() => {
    refetch();
    setCreateOpen(false);
    router.refresh();
  }, [refetch, router]);

  const colunas = React.useMemo(() => criarColunas(handleEdit), [handleEdit]);
  const filterOptions = React.useMemo(() => buildClientesFilterOptions(), []);
  const filterGroups = React.useMemo(() => buildClientesFilterGroups(), []);

  const handleFilterIdsChange = React.useCallback((ids: string[]) => {
    setSelectedFilterIds(ids);
    const newFilters = parseClientesFilters(ids);
    setFiltros(newFilters);
    setPagina(0);
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
        searchPlaceholder="Buscar por nome, CPF, CNPJ ou e-mail..."
        filterOptions={filterOptions}
        filterGroups={filterGroups}
        selectedFilters={selectedFilterIds}
        onFiltersChange={handleFilterIdsChange}
        filterButtonsMode="buttons"
        onNewClick={() => setCreateOpen(true)}
        newButtonTooltip="Novo Cliente"
      />

      <ResponsiveTable
        data={clientes}
        columns={colunas}
        pagination={
          paginacao
            ? {
              pageIndex: paginacao.page - 1,
              pageSize: paginacao.limit,
              total: paginacao.total,
              totalPages: paginacao.totalPages,
              onPageChange: setPagina,
              onPageSizeChange: setLimite,
            }
            : undefined
        }
        sorting={undefined}
        isLoading={isLoading}
        error={error}
        mobileLayout="cards"
        stickyFirstColumn={true}
        emptyMessage="Nenhum cliente encontrado."
        rowActions={[
          {
            label: 'Visualizar',
            icon: <Eye className="h-4 w-4" />,
            onClick: (row) => {
              window.location.href = `/partes/clientes/${row.id}`;
            },
          },
          {
            label: 'Editar',
            icon: <Pencil className="h-4 w-4" />,
            onClick: (row) => {
              handleEdit(row);
            },
          },
        ]}
      />

      <ClienteFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={handleCreateSuccess}
        mode="create"
      />

      {clienteParaEditar && (
        <ClienteFormDialog
          open={editOpen}
          onOpenChange={(open) => {
            setEditOpen(open);
            if (!open) setClienteParaEditar(null);
          }}
          cliente={clienteParaEditar}
          onSuccess={handleEditSuccess}
          mode="edit"
        />
      )}
    </div>
  );
}
