'use client';

/**
 * Table Wrapper de Terceiros
 * Lista e gerencia terceiros vinculados aos processos (peritos, MP, assistentes, etc.)
 */

import * as React from 'react';
import Link from 'next/link';
import { useDebounce } from '@/hooks/use-debounce';
import { DataTable } from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { TableToolbar } from '@/components/ui/table-toolbar';
import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import { Eye, Pencil } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import type { Terceiro, ProcessoRelacionado } from '../../types';

// Imports da nova estrutura de features
import { useTerceiros } from '../../hooks';
import { ProcessosRelacionadosCell, CopyButton } from '../shared';
import {
  formatarCpf,
  formatarCnpj,
  formatarTelefone,
  formatarNome,
  formatarEnderecoCompleto,
} from '../../utils';
import {
  buildTerceirosFilterOptions,
  buildTerceirosFilterGroups,
  parseTerceirosFilters,
} from './terceiros-toolbar-filters';
import type { TerceirosFilters } from '../../types';
import { Badge } from '@/components/ui/badge';
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

// Funções getTipoParteLabel e getTipoParteBadgeClasses removidas.
// Agora usamos getParteTipoLabel e getSemanticBadgeVariant de @/lib/design-system

function TerceiroActions({ terceiro }: { terceiro: TerceiroComProcessos }) {
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

export function TerceirosTableWrapper() {
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
    incluirEndereco: true,
    incluirProcessos: true,
    ...filtros,
  }), [pagina, limite, buscaDebounced, filtros]);

  const { terceiros, paginacao, isLoading, error } = useTerceiros(params);

  const columns = React.useMemo<ColumnDef<TerceiroComProcessos>[]>(
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
        size: 340,
        meta: { align: 'left' },
        cell: ({ row }) => {
          const terceiro = row.original;
          const isPF = terceiro.tipo_pessoa === 'pf';
          const documento = isPF ? formatarCpf(terceiro.cpf) : formatarCnpj(terceiro.cnpj);
          const documentoRaw = isPF ? terceiro.cpf : terceiro.cnpj;
          const dataNascimento = isPF && terceiro.data_nascimento ? terceiro.data_nascimento : null;
          const idade = calcularIdade(dataNascimento);
          const tipoParte = terceiro.tipo_parte;

          return (
            <div className="min-h-10 flex items-start justify-start py-2 group">
              <div className="flex flex-col gap-0.5">
                {/* Linha 1: Badge do tipo de parte - usa sistema semântico */}
                {tipoParte && (
                  <Badge variant={getSemanticBadgeVariant('parte', tipoParte)} className="w-fit">
                    {getParteTipoLabel(tipoParte)}
                  </Badge>
                )}
                {/* Linha 2: Nome */}
                <div className="flex items-center gap-1">
                  <span className="text-sm font-medium">
                    {formatarNome(terceiro.nome)}
                  </span>
                  <CopyButton text={terceiro.nome} label="Copiar nome" />
                </div>
                {/* Linha 3: Documento */}
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
        meta: { align: 'left' },
        cell: ({ row }) => {
          const terceiro = row.original;
          const emails = terceiro.emails || [];

          const telefones: { ddd: string; numero: string; tipo: string }[] = [];
          if (terceiro.ddd_celular && terceiro.numero_celular) {
            telefones.push({ ddd: terceiro.ddd_celular, numero: terceiro.numero_celular, tipo: 'Cel' });
          }
          if (terceiro.ddd_residencial && terceiro.numero_residencial) {
            telefones.push({ ddd: terceiro.ddd_residencial, numero: terceiro.numero_residencial, tipo: 'Res' });
          }
          if (terceiro.ddd_comercial && terceiro.numero_comercial) {
            telefones.push({ ddd: terceiro.ddd_comercial, numero: terceiro.numero_comercial, tipo: 'Com' });
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
        meta: { align: 'left' },
        cell: ({ row }) => {
          const enderecoFormatado = formatarEnderecoCompleto(row.original.endereco);
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
        cell: ({ row }) => {
          const terceiro = row.original;
          return (
            <ProcessosRelacionadosCell
              processos={terceiro.processos_relacionados || []}
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
