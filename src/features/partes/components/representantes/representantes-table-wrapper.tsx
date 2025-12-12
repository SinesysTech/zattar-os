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
import { useDebounce } from '@/hooks/use-debounce';
import { DataTable } from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { TableToolbar } from '@/components/ui/table-toolbar';
import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import { Eye, Pencil, Phone, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ColumnDef } from '@tanstack/react-table';
import type { ProcessoRelacionado } from '../../types';

// Imports da nova estrutura de features
import { useRepresentantes } from '../../hooks';
import { ProcessosRelacionadosCell, CopyButton } from '../shared';
import { formatarCpf, formatarNome, formatarTelefone } from '../../utils';
import {
  buildRepresentantesFilterOptions,
  buildRepresentantesFilterGroups,
  parseRepresentantesFilters,
} from './representantes-toolbar-filters';
import type { Representante, RepresentantesFilters, InscricaoOAB } from '../../types';

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
 * Extrai o melhor telefone disponível do representante
 */
function obterTelefone(representante: Representante): string | null {
  // Prioridade: celular > comercial > residencial
  if (representante.ddd_celular && representante.numero_celular) {
    return formatarTelefone(representante.ddd_celular, representante.numero_celular);
  }
  if (representante.ddd_comercial && representante.numero_comercial) {
    return formatarTelefone(representante.ddd_comercial, representante.numero_comercial);
  }
  if (representante.ddd_residencial && representante.numero_residencial) {
    return formatarTelefone(representante.ddd_residencial, representante.numero_residencial);
  }
  return null;
}

/**
 * Extrai o melhor e-mail disponível do representante
 */
function obterEmail(representante: Representante): string | null {
  // Prioriza email simples, depois tenta extrair do JSONB
  if (representante.email) return representante.email;
  if (Array.isArray(representante.emails) && representante.emails.length > 0) {
    return String(representante.emails[0]);
  }
  return null;
}

/**
 * Componente de ações para cada representante
 */
function RepresentanteActions({
  representante,
}: {
  representante: Representante;
}) {
  return (
    <ButtonGroup>
      <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
        <Link href={`/partes/representantes/${representante.id}`}>
          <Eye className="h-4 w-4" />
          <span className="sr-only">Visualizar representante</span>
        </Link>
      </Button>
      <Button variant="ghost" size="icon" className="h-8 w-8" disabled>
        <Pencil className="h-4 w-4" />
        <span className="sr-only">Editar representante</span>
      </Button>
    </ButtonGroup>
  );
}

/**
 * Define as colunas da tabela de representantes
 */
function criarColunas(): ColumnDef<RepresentanteComProcessos>[] {
  return [
    // Coluna composta: Representante (Badge OAB+Situação | Nome | CPF)
    {
      id: 'representante',
      accessorKey: 'nome',
      header: ({ column }) => (
        <div className="flex items-center justify-start">
          <DataTableColumnHeader column={column} title="Representante" />
        </div>
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
          <div className="min-h-14 flex flex-col justify-center py-1.5 gap-0.5 group">
            {/* Linha 1: Badges de OABs */}
            <OabsBadges oabs={representante.oabs || []} />
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
      header: () => (
        <div className="flex items-center justify-start">
          <div className="text-sm font-medium">Contato</div>
        </div>
      ),
      enableSorting: false,
      size: 280,
      meta: { align: 'left' },
      cell: ({ row }) => {
        const representante = row.original;
        const telefone = obterTelefone(representante);
        const telefoneRaw =
          representante.ddd_celular && representante.numero_celular
            ? `${representante.ddd_celular}${representante.numero_celular}`
            : representante.ddd_comercial && representante.numero_comercial
              ? `${representante.ddd_comercial}${representante.numero_comercial}`
              : representante.ddd_residencial && representante.numero_residencial
                ? `${representante.ddd_residencial}${representante.numero_residencial}`
                : null;
        const email = obterEmail(representante);

        // Se não tem nenhum contato
        if (!telefone && !email) {
          return <div className="min-h-14 flex items-center justify-start text-muted-foreground">-</div>;
        }

        return (
          <div className="min-h-14 flex flex-col justify-center py-1.5 gap-1 w-full overflow-hidden group">
            {/* Linha 1: Telefone */}
            <div className="flex items-center gap-1.5 min-w-0">
              <Phone
                className={cn(
                  'h-3.5 w-3.5 shrink-0',
                  telefone ? 'text-muted-foreground' : 'text-muted-foreground/50'
                )}
              />
              <span className={cn('text-sm whitespace-nowrap', !telefone && 'text-muted-foreground')}>
                {telefone || '-'}
              </span>
              {telefoneRaw && <CopyButton text={telefoneRaw} label="Copiar telefone" />}
            </div>
            {/* Linha 2: E-mail */}
            <div className="flex items-center gap-1.5 min-w-0 w-full">
              <Mail
                className={cn(
                  'h-3.5 w-3.5 shrink-0',
                  email ? 'text-muted-foreground' : 'text-muted-foreground/50'
                )}
              />
              <span className={cn('text-sm', !email && 'text-muted-foreground')} title={email || undefined}>
                {email || '-'}
              </span>
              {email && <CopyButton text={email} label="Copiar e-mail" />}
            </div>
          </div>
        );
      },
    },
    // Processos relacionados
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
        const representante = row.original;
        return <ProcessosRelacionadosCell processos={representante.processos_relacionados || []} />;
      },
    },
    // Ações
    {
      id: 'acoes',
      header: () => (
        <div className="flex items-center justify-center">
          <div className="text-sm font-medium">Ações</div>
        </div>
      ),
      enableSorting: false,
      size: 140,
      cell: ({ row }) => {
        const representante = row.original;
        return (
          <div className="min-h-10 flex items-center justify-center">
            <RepresentanteActions representante={representante} />
          </div>
        );
      },
    },
  ];
}

export function RepresentantesTableWrapper() {
  const [busca, setBusca] = React.useState('');
  const [pagina, setPagina] = React.useState(0);
  const [limite, setLimite] = React.useState(50);
  const [filtros, setFiltros] = React.useState<RepresentantesFilters>({});
  const [selectedFilterIds, setSelectedFilterIds] = React.useState<string[]>([]);
  const [, setCreateOpen] = React.useState(false);

  // Debounce da busca
  const buscaDebounced = useDebounce(busca, 500);
  const isSearching = busca !== buscaDebounced;

  // Parâmetros para buscar representantes
  const params = React.useMemo(() => {
    return {
      pagina: pagina + 1, // API usa 1-indexed
      limite,
      busca: buscaDebounced || undefined,
      incluirProcessos: true, // Incluir processos relacionados
      ...filtros,
    };
  }, [pagina, limite, buscaDebounced, filtros]);

  const { representantes, paginacao, isLoading, error } = useRepresentantes(params);

  const colunas: ColumnDef<RepresentanteComProcessos>[] = React.useMemo(() => criarColunas(), []);

  const filterOptions = React.useMemo(() => buildRepresentantesFilterOptions(), []);
  const filterGroups = React.useMemo(() => buildRepresentantesFilterGroups(), []);

  // Handler para mudança de filtros
  const handleFilterIdsChange = React.useCallback((ids: string[]) => {
    setSelectedFilterIds(ids);
    const newFilters = parseRepresentantesFilters(ids);
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
        searchPlaceholder="Buscar por nome, CPF ou OAB..."
        filterOptions={filterOptions}
        filterGroups={filterGroups}
        selectedFilters={selectedFilterIds}
        onFiltersChange={handleFilterIdsChange}
        filterButtonsMode="buttons"
        onNewClick={() => setCreateOpen(true)}
        newButtonTooltip="Novo Representante"
      />

      {/* Tabela */}
      <DataTable<RepresentanteComProcessos>
        data={representantes}
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
        emptyMessage="Nenhum representante encontrado."
      />

      {/* TODO: Implementar RepresentanteCreateSheet */}
    </div>
  );
}
