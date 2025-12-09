'use client';

/**
 * Tab de Clientes
 * Lista e gerencia clientes do escritório
 */

import * as React from 'react';
import Link from 'next/link';
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
import { Eye, Pencil, Copy, Check } from 'lucide-react';
import { useClientes } from '@/app/_lib/hooks/use-clientes';
import type { Cliente } from '@/app/_lib/types';
import { ClienteEditDialog } from './cliente-edit-dialog';
import { ClienteCreateDialog } from './cliente-create-dialog';
import type { ProcessoRelacionado } from '@/backend/types/partes/processo-relacionado-types';
import { ProcessosRelacionadosCell } from './processos-relacionados-cell';
import {
  formatarCpf,
  formatarCnpj,
  formatarTelefone,
  formatarNome,
  formatarEnderecoCompleto,
} from '@/app/_lib/utils/format-clientes';
import {
  buildClientesFilterOptions,
  buildClientesFilterGroups,
  parseClientesFilters,
  type ClientesFilters,
} from './clientes-toolbar-filters';

/**
 * Tipo estendido de cliente com processos relacionados
 */
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

/**
 * Calcula a idade a partir da data de nascimento
 */
function calcularIdade(dataNascimento: string | null): number | null {
  if (!dataNascimento) return null;
  try {
    const nascimento = new Date(dataNascimento);
    const hoje = new Date();
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const mesAtual = hoje.getMonth();
    const mesNascimento = nascimento.getMonth();
    if (mesAtual < mesNascimento || (mesAtual === mesNascimento && hoje.getDate() < nascimento.getDate())) {
      idade--;
    }
    return idade;
  } catch {
    return null;
  }
}

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

/**
 * Componente de botão para copiar texto
 */
function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = React.useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Erro ao copiar:', err);
    }
  }, [text]);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center justify-center h-5 w-5 rounded hover:bg-muted/50 transition-colors opacity-0 group-hover:opacity-100"
        >
          {copied ? (
            <Check className="h-3 w-3 text-green-500" />
          ) : (
            <Copy className="h-3 w-3 text-muted-foreground" />
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent side="top">
        {copied ? 'Copiado!' : label}
      </TooltipContent>
    </Tooltip>
  );
}

/**
 * Define as colunas da tabela de clientes
 */
function criarColunas(onEdit: (cliente: ClienteComProcessos) => void): ResponsiveTableColumn<ClienteComProcessos>[] {
  return [
    {
      id: 'identificacao',
      header: ({ column }) => (
        <div className="flex items-center justify-start">
          <DataTableColumnHeader column={column} title="Identificação" />
        </div>
      ),
      enableSorting: true,
      accessorKey: 'nome',
      size: 320,
      priority: 1,
      sticky: true,
      cardLabel: 'Identificação',
      meta: { align: 'left' },
      cell: ({ row }) => {
        const cliente = row.original;
        const isPF = cliente.tipo_pessoa === 'pf';
        const documento = isPF ? formatarCpf(cliente.cpf) : formatarCnpj(cliente.cnpj);
        const documentoRaw = isPF ? cliente.cpf : cliente.cnpj;
        const dataNascimento = isPF && cliente.data_nascimento ? cliente.data_nascimento : null;
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

        // Coletar todos os telefones disponíveis
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
          <div className="text-sm font-medium">Endereço</div>
        </div>
      ),
      enableSorting: false,
      size: 260,
      priority: 4,
      cardLabel: 'Endereço',
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
          <div className="text-sm font-medium">Ações</div>
        </div>
      ),
      enableSorting: false,
      size: 120,
      priority: 5,
      cardLabel: 'Ações',
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

/**
 * Componente de ações para cada cliente
 */
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

export function ClientesTab() {
  const [busca, setBusca] = React.useState('');
  const [pagina, setPagina] = React.useState(0);
  const [limite, setLimite] = React.useState(50);
  const [filtros, setFiltros] = React.useState<ClientesFilters>({});
  const [selectedFilterIds, setSelectedFilterIds] = React.useState<string[]>([]);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [clienteParaEditar, setClienteParaEditar] = React.useState<ClienteComProcessos | null>(null);

  // Debounce da busca
  const buscaDebounced = useDebounce(busca, 500);
  const isSearching = busca !== buscaDebounced;

  // Parâmetros para buscar clientes
  const params = React.useMemo(() => {
    return {
      pagina: pagina + 1, // API usa 1-indexed
      limite,
      busca: buscaDebounced || undefined,
      incluirEndereco: true, // Incluir endereços nas respostas
      incluirProcessos: true, // Incluir processos relacionados
      ...filtros,
    };
  }, [pagina, limite, buscaDebounced, filtros]);

  const { clientes, paginacao, isLoading, error, refetch } = useClientes(params);

  // Função para abrir dialog de edição
  const handleEdit = React.useCallback((cliente: ClienteComProcessos) => {
    setClienteParaEditar(cliente);
    setEditOpen(true);
  }, []);

  // Função para atualizar após edição
  const handleEditSuccess = React.useCallback(() => {
    refetch();
    setEditOpen(false);
    setClienteParaEditar(null);
  }, [refetch]);

  const colunas = React.useMemo(() => criarColunas(handleEdit), [handleEdit]);

  const filterOptions = React.useMemo(() => buildClientesFilterOptions(), []);
  const filterGroups = React.useMemo(() => buildClientesFilterGroups(), []);

  // Handler para mudança de filtros
  const handleFilterIdsChange = React.useCallback((ids: string[]) => {
    setSelectedFilterIds(ids);
    const newFilters = parseClientesFilters(ids);
    setFiltros(newFilters);
    setPagina(0); // Reset página ao aplicar filtros
  }, []);

  return (
    <div className="space-y-4">
      {/* Barra de busca e filtros */}
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

      {/* Tabela */}
      <ResponsiveTable
        data={clientes}
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

      {/* Dialog de Criação (Wizard) */}
      <ClienteCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={handleEditSuccess}
      />

      {/* Dialog de Edição */}
      {clienteParaEditar && (
        <ClienteEditDialog
          open={editOpen}
          onOpenChange={(open) => {
            setEditOpen(open);
            if (!open) setClienteParaEditar(null);
          }}
          cliente={clienteParaEditar}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
}
