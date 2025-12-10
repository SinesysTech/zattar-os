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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  buildTerceirosFilterOptions,
  buildTerceirosFilterGroups,
  parseTerceirosFilters,
  type TerceirosFilters,
} from './terceiros-toolbar-filters';
import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import { Eye, Pencil, Copy, Check } from 'lucide-react';
import {
  formatarCpf,
  formatarCnpj,
  formatarTelefone,
  formatarNome,
  formatarEnderecoCompleto,
} from '@/app/_lib/utils/format-clientes';
import type { ColumnDef } from '@tanstack/react-table';
import type { Terceiro, ProcessoRelacionado } from '@/core/partes';
import { useTerceiros } from '@/app/_lib/hooks/use-terceiros';
import { ProcessosRelacionadosCell } from './processos-relacionados-cell';

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
 * Converte texto para Title Case (primeira letra de cada palavra em maiúsculo)
 */
function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Retorna label formatado do tipo de parte
 * Converte para title case para uniformizar a exibição
 */
function getTipoParteLabel(tipoParte: string): string {
  const labels: Record<string, string> = {
    PERITO: 'Perito',
    PERITO_CONTADOR: 'Perito Contador',
    PERITO_MEDICO: 'Perito Médico',
    MINISTERIO_PUBLICO: 'Ministério Público',
    MINISTERIO_PUBLICO_TRABALHO: 'MP do Trabalho',
    ASSISTENTE: 'Assistente',
    ASSISTENTE_TECNICO: 'Assistente Técnico',
    TESTEMUNHA: 'Testemunha',
    CUSTOS_LEGIS: 'Custos Legis',
    AMICUS_CURIAE: 'Amicus Curiae',
    PREPOSTO: 'Preposto',
    CURADOR: 'Curador',
    CURADOR_ESPECIAL: 'Curador Especial',
    INVENTARIANTE: 'Inventariante',
    ADMINISTRADOR: 'Administrador',
    SINDICO: 'Síndico',
    DEPOSITARIO: 'Depositário',
    LEILOEIRO: 'Leiloeiro',
    LEILOEIRO_OFICIAL: 'Leiloeiro Oficial',
    OUTRO: 'Outro',
    TERCEIRO_INTERESSADO: 'Terceiro Interessado',
  };
  // Se não encontrar no mapa, converte para title case
  return labels[tipoParte] || toTitleCase(tipoParte.replace(/_/g, ' '));
}

/**
 * Retorna as classes CSS do badge para cada tipo de parte
 * Cada tipo tem uma cor específica para fácil identificação
 */
function getTipoParteBadgeClasses(tipoParte: string): string {
  const classes: Record<string, string> = {
    // Peritos - Azul
    PERITO: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
    PERITO_CONTADOR: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
    PERITO_MEDICO: 'bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-900/30 dark:text-sky-300 dark:border-sky-800',
    // Ministério Público - Roxo
    MINISTERIO_PUBLICO: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800',
    MINISTERIO_PUBLICO_TRABALHO: 'bg-violet-100 text-violet-800 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-800',
    // Assistentes - Ciano
    ASSISTENTE: 'bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-800',
    ASSISTENTE_TECNICO: 'bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-800',
    // Testemunha - Verde
    TESTEMUNHA: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
    // Jurídicos - Indigo
    CUSTOS_LEGIS: 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800',
    AMICUS_CURIAE: 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800',
    // Preposto - Laranja
    PREPOSTO: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800',
    // Curadores - Amarelo
    CURADOR: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
    CURADOR_ESPECIAL: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800',
    // Administrativos - Rosa/Pink
    INVENTARIANTE: 'bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-900/30 dark:text-pink-300 dark:border-pink-800',
    ADMINISTRADOR: 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800',
    SINDICO: 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200 dark:bg-fuchsia-900/30 dark:text-fuchsia-300 dark:border-fuchsia-800',
    // Depositário - Lima
    DEPOSITARIO: 'bg-lime-100 text-lime-800 border-lime-200 dark:bg-lime-900/30 dark:text-lime-300 dark:border-lime-800',
    // Leiloeiros - Âmbar
    LEILOEIRO: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
    LEILOEIRO_OFICIAL: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
    // Terceiro Interessado - Slate
    TERCEIRO_INTERESSADO: 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-900/30 dark:text-slate-300 dark:border-slate-800',
    // Outro - Cinza
    OUTRO: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/30 dark:text-gray-300 dark:border-gray-800',
  };
  return classes[tipoParte] || 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/30 dark:text-gray-300 dark:border-gray-800';
}

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

export function TerceirosTab() {
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
    incluirProcessos: true, // Incluir processos relacionados
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
                {/* Linha 1: Badge do tipo de parte */}
                {tipoParte && (
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border w-fit ${getTipoParteBadgeClasses(tipoParte)}`}>
                    {getTipoParteLabel(tipoParte)}
                  </span>
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
