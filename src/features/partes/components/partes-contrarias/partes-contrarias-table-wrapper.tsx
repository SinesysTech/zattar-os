'use client';

/**
 * Table Wrapper de Partes Contrárias
 * Lista e gerencia partes contrárias dos processos
 */

import * as React from 'react';
import Link from 'next/link';
import { useDebounce } from '@/hooks/use-debounce';
import { DataPagination, DataShell, DataTable, DataTableToolbar } from '@/components/shared/data-shell';
import { DataTableColumnHeader } from '@/components/shared/data-shell/data-table-column-header';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import { Eye, Pencil } from 'lucide-react';
import type { ColumnDef, Table as TanstackTable } from '@tanstack/react-table';
import type { ParteContraria, ProcessoRelacionado } from '../../types';

// Imports da nova estrutura de features
import { usePartesContrarias } from '../../hooks';
import { ProcessosRelacionadosCell, CopyButton, MapButton, ContatoCell } from '../shared';
import { ParteContrariaFormDialog } from './parte-contraria-form';
import {
  formatarCpf,
  formatarCnpj,
  formatarNome,
  formatarEnderecoCompleto,
  calcularIdade,
} from '../../utils';
import type { PartesContrariasFilters } from '../../types';

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

interface ParteContrariaActionsProps {
  parte: ParteContrariaComProcessos;
  onEdit: (parte: ParteContrariaComProcessos) => void;
}

function ParteContrariaActions({ parte, onEdit }: ParteContrariaActionsProps) {
  return (
    <ButtonGroup>
      <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
        <Link href={`/partes/partes-contrarias/${parte.id}`}>
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

export function PartesContrariasTableWrapper() {
  const [busca, setBusca] = React.useState('');
  const [pagina, setPagina] = React.useState(0);
  const [limite, setLimite] = React.useState(50);
  const [ordenarPor, setOrdenarPor] = React.useState<'nome' | 'cpf' | 'cnpj' | null>('nome');
  const [ordem, setOrdem] = React.useState<'asc' | 'desc'>('asc');
  const [tipoPessoa, setTipoPessoa] = React.useState<'all' | 'pf' | 'pj'>('all');
  const [situacao, setSituacao] = React.useState<'all' | 'A' | 'I'>('all');

  // Estados para o novo DataTableToolbar
  const [table, setTable] = React.useState<TanstackTable<ParteContrariaComProcessos> | null>(null);
  const [density, setDensity] = React.useState<'compact' | 'standard' | 'relaxed'>('standard');

  // Estados para diálogos
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

  // Handlers devem ser definidos antes de serem usados nas colunas
  const handleEdit = React.useCallback((parte: ParteContrariaComProcessos) => {
    setParteParaEditar(parte);
    setEditOpen(true);
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

  const handleCreateSuccess = React.useCallback(() => {
    setCreateOpen(false);
    refetch();
  }, [refetch]);

  const handleEditSuccess = React.useCallback(() => {
    setEditOpen(false);
    setParteParaEditar(null);
    refetch();
  }, [refetch]);

  return (
    <DataShell
      header={
        table ? (
          <DataTableToolbar
            table={table}
            density={density}
            onDensityChange={setDensity}
            searchValue={busca}
            onSearchValueChange={(value) => {
              setBusca(value);
              setPagina(0);
            }}
            searchPlaceholder="Buscar partes contrárias..."
            actionButton={{
              label: 'Nova Parte Contrária',
              onClick: () => setCreateOpen(true),
            }}
            filtersSlot={
              <>
                <Select
                  value={tipoPessoa}
                  onValueChange={(val) => {
                    setTipoPessoa(val as 'all' | 'pf' | 'pj');
                    setPagina(0);
                  }}
                >
                  <SelectTrigger className="h-10 w-[170px]">
                    <SelectValue placeholder="Tipo de pessoa" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="pf">Pessoa Física</SelectItem>
                    <SelectItem value="pj">Pessoa Jurídica</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={situacao}
                  onValueChange={(val) => {
                    setSituacao(val as 'all' | 'A' | 'I');
                    setPagina(0);
                  }}
                >
                  <SelectTrigger className="h-10 w-[130px]">
                    <SelectValue placeholder="Situação" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="A">Ativo</SelectItem>
                    <SelectItem value="I">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </>
            }
          />
        ) : (
          <div className="p-6" />
        )
      }
      footer={
        paginacao ? (
          <DataPagination
            pageIndex={paginacao.pagina - 1}
            pageSize={paginacao.limite}
            total={paginacao.total}
            totalPages={paginacao.totalPaginas}
            onPageChange={setPagina}
            onPageSizeChange={setLimite}
            isLoading={isLoading}
          />
        ) : null
      }
    >
      <div className="relative border-t">
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
          density={density}
          onTableReady={(t) => setTable(t as TanstackTable<ParteContrariaComProcessos>)}
          emptyMessage="Nenhuma parte contrária encontrada"
          hideTableBorder={true}
          hidePagination={true}
        />
      </div>

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
    </DataShell>
  );
}
