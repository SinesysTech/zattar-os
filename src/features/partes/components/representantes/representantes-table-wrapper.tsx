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
import { cn } from '@/lib/utils';
import type { ColumnDef, Table as TanstackTable } from '@tanstack/react-table';
import type { ProcessoRelacionado } from '../../types';

// Imports da nova estrutura de features
import { useRepresentantes } from '../../hooks';
import { ProcessosRelacionadosCell, CopyButton, ContatoCell } from '../shared';
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

export function RepresentantesTableWrapper() {
  const [busca, setBusca] = React.useState('');
  const [pagina, setPagina] = React.useState(0);
  const [limite, setLimite] = React.useState(50);
  const [, setCreateOpen] = React.useState(false);

  // Filtros
  const [ufOab, setUfOab] = React.useState<string>('all');

  // Estados para o novo DataTableToolbar
  const [table, setTable] = React.useState<TanstackTable<RepresentanteComProcessos> | null>(null);
  const [density, setDensity] = React.useState<'compact' | 'standard' | 'relaxed'>('standard');

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

  const { representantes, paginacao, isLoading, error } = useRepresentantes(params);

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
              <RepresentanteActions representante={representante} />
            </div>
          );
        },
        enableHiding: false,
      },
    ],
    []
  );

  return (
    <DataShell
      actionButton={{
        label: 'Novo Representante',
        onClick: () => setCreateOpen(true),
      }}
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
            searchPlaceholder="Buscar por nome, CPF ou OAB..."
            filtersSlot={
              <Select
                value={ufOab}
                onValueChange={(val) => {
                  setUfOab(val);
                  setPagina(0);
                }}
              >
                <SelectTrigger className="h-10 w-[150px]">
                  <SelectValue placeholder="UF OAB" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {UFS_BRASIL.map((uf) => (
                    <SelectItem key={uf} value={uf}>
                      {uf}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
        <DataTable<RepresentanteComProcessos, unknown>
          data={representantes}
          columns={columns}
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
          density={density}
          onTableReady={(t) => setTable(t as TanstackTable<RepresentanteComProcessos>)}
          emptyMessage="Nenhum representante encontrado."
          hideTableBorder={true}
          hidePagination={true}
        />
      </div>
    </DataShell>
  );
}
