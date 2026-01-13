'use client';

/**
 * Table Wrapper de Terceiros
 * Lista e gerencia terceiros vinculados aos processos (peritos, MP, assistentes, etc.)
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
import type { Terceiro, ProcessoRelacionado } from '../../types';

// Imports da nova estrutura de features
import { useTerceiros } from '../../hooks';
import { ProcessosRelacionadosCell, CopyButton, MapButton, ContatoCell } from '../shared';
import { TerceiroFormDialog } from './terceiro-form';
import { ChatwootSyncButton } from '@/features/chatwoot';
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
  const [limite, setLimite] = React.useState(50);
  const [ordenarPor, setOrdenarPor] = React.useState<'nome' | 'cpf' | 'cnpj' | 'tipo_parte' | null>('nome');
  const [ordem, setOrdem] = React.useState<'asc' | 'desc'>('asc');

  // Filtros
  const [tipoPessoa, setTipoPessoa] = React.useState<'all' | 'pf' | 'pj'>('all');
  const [tipoParte, setTipoParte] = React.useState<string>('all');
  const [polo, setPolo] = React.useState<'all' | 'ativo' | 'passivo'>('all');
  const [situacao, setSituacao] = React.useState<'all' | 'A' | 'I'>('all');

  // Estados para o novo DataTableToolbar
  const [table, setTable] = React.useState<TanstackTable<TerceiroComProcessos> | null>(null);
  const [density, setDensity] = React.useState<'compact' | 'standard' | 'relaxed'>('standard');

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

  const handleSortingChange = React.useCallback((columnId: string | null, direction: 'asc' | 'desc' | null) => {
    if (columnId && direction) {
      setOrdenarPor(columnId as typeof ordenarPor);
      setOrdem(direction);
    } else {
      setOrdenarPor(null);
      setOrdem('asc');
    }
  }, []);

  const handleCreateSuccess = React.useCallback(() => {
    setCreateOpen(false);
    refetch();
  }, [refetch]);

  const handleEditSuccess = React.useCallback(() => {
    setEditOpen(false);
    setTerceiroParaEditar(null);
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
            searchPlaceholder="Buscar terceiros..."
            actionButton={{
              label: 'Novo Terceiro',
              onClick: () => setCreateOpen(true),
            }}
            actionSlot={
              <ChatwootSyncButton
                tipoEntidade="terceiro"
                apenasAtivos={situacao === 'A'}
              />
            }
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
                  value={tipoParte}
                  onValueChange={(val) => {
                    setTipoParte(val);
                    setPagina(0);
                  }}
                >
                  <SelectTrigger className="h-10 w-[170px]">
                    <SelectValue placeholder="Tipo de parte" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="perito">Perito</SelectItem>
                    <SelectItem value="ministerio_publico">Ministério Público</SelectItem>
                    <SelectItem value="assistente">Assistente</SelectItem>
                    <SelectItem value="testemunha">Testemunha</SelectItem>
                    <SelectItem value="custos_legis">Custos Legis</SelectItem>
                    <SelectItem value="amicus_curiae">Amicus Curiae</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={polo}
                  onValueChange={(val) => {
                    setPolo(val as 'all' | 'ativo' | 'passivo');
                    setPagina(0);
                  }}
                >
                  <SelectTrigger className="h-10 w-[150px]">
                    <SelectValue placeholder="Polo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="ativo">Polo Ativo</SelectItem>
                    <SelectItem value="passivo">Polo Passivo</SelectItem>
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
          density={density}
          onTableReady={(t) => setTable(t as TanstackTable<TerceiroComProcessos>)}
          emptyMessage="Nenhum terceiro encontrado"
          hideTableBorder={true}
          hidePagination={true}
        />
      </div>

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
    </DataShell>
  );
}
