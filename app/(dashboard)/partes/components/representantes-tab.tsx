'use client';

/**
 * Tab de Representantes
 * Lista e gerencia representantes legais (advogados)
 * 
 * NOTA: Representantes são sempre advogados (pessoas físicas) com CPF.
 * O modelo foi deduplicado - um registro por CPF, vínculos via processo_partes.
 */

import * as React from 'react';
import Link from 'next/link';
import { useDebounce } from '@/app/_lib/hooks/use-debounce';
import { DataTable } from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ButtonGroup } from '@/components/ui/button-group';
import { TableToolbar } from '@/components/ui/table-toolbar';
import { Eye, Pencil, Phone, Mail } from 'lucide-react';
import { useRepresentantes } from '@/app/_lib/hooks/use-representantes';
import type { ColumnDef } from '@tanstack/react-table';
import type { Representante } from '@/backend/types/representantes/representantes-types';
import {
  formatarCpf,
  formatarNome,
  formatarTelefone,
} from '@/app/_lib/utils/format-clientes';
import {
  buildRepresentantesFilterOptions,
  buildRepresentantesFilterGroups,
  parseRepresentantesFilters,
  type RepresentantesFilters,
} from './representantes-toolbar-filters';

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
 * Define as colunas da tabela de representantes
 */
function criarColunas(onEditSuccess: () => void): ColumnDef<Representante>[] {
  return [
    // Coluna composta: Representante (OAB + Nome + CPF)
    {
      id: 'representante',
      accessorKey: 'nome',
      header: ({ column }) => (
        <div className="flex items-center justify-start">
          <DataTableColumnHeader column={column} title="Representante" />
        </div>
      ),
      enableSorting: true,
      size: 320,
      meta: { align: 'left' },
      cell: ({ row }) => {
        const representante = row.original;
        const nome = formatarNome(representante.nome);
        const cpf = representante.cpf ? formatarCpf(representante.cpf) : null;
        const oab = representante.numero_oab;
        const ufOab = representante.uf_oab;
        
        return (
          <div className="min-h-12 flex flex-col justify-center py-1.5">
            {/* Linha 1: Badge OAB + Nome */}
            <div className="flex items-center gap-2">
              {oab && (
                <Badge variant="soft" tone="info" className="text-xs shrink-0">
                  OAB {ufOab ? `${ufOab}/` : ''}{oab}
                </Badge>
              )}
              <span className="font-medium text-sm truncate" title={nome}>
                {nome}
              </span>
            </div>
            {/* Linha 2: CPF */}
            {cpf && (
              <span className="text-xs text-muted-foreground mt-0.5">
                CPF: {cpf}
              </span>
            )}
          </div>
        );
      },
    },
    // Situação OAB
    {
      id: 'situacao_oab',
      header: () => (
        <div className="flex items-center justify-center">
          <div className="text-sm font-medium">Situação</div>
        </div>
      ),
      enableSorting: false,
      size: 110,
      cell: ({ row }) => {
        const representante = row.original;
        const situacao = representante.situacao_oab;
        if (!situacao) return <div className="min-h-10 flex items-center justify-center">-</div>;

        const isRegular = situacao === 'REGULAR';
        const label =
          situacao === 'REGULAR'
            ? 'Regular'
            : situacao === 'SUSPENSO'
              ? 'Suspenso'
              : situacao === 'CANCELADO'
                ? 'Cancelado'
                : situacao === 'LICENCIADO'
                  ? 'Licenciado'
                  : 'Falecido';

        return (
          <div className="min-h-10 flex items-center justify-center">
            <Badge
              tone={isRegular ? 'success' : 'neutral'}
              variant={isRegular ? 'soft' : 'outline'}
            >
              {label}
            </Badge>
          </div>
        );
      },
    },
    // Telefone
    {
      id: 'telefone',
      header: () => (
        <div className="flex items-center justify-start">
          <div className="text-sm font-medium">Telefone</div>
        </div>
      ),
      enableSorting: false,
      size: 140,
      meta: { align: 'left' },
      cell: ({ row }) => {
        const representante = row.original;
        const telefone = obterTelefone(representante);
        
        if (!telefone) {
          return <div className="min-h-10 flex items-center justify-start text-muted-foreground">-</div>;
        }
        
        return (
          <div className="min-h-10 flex items-center justify-start gap-1.5">
            <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="text-sm">{telefone}</span>
          </div>
        );
      },
    },
    // E-mail
    {
      id: 'email',
      header: () => (
        <div className="flex items-center justify-start">
          <div className="text-sm font-medium">E-mail</div>
        </div>
      ),
      enableSorting: false,
      size: 240,
      meta: { align: 'left' },
      cell: ({ row }) => {
        const representante = row.original;
        const email = obterEmail(representante);
        
        if (!email) {
          return <div className="min-h-10 flex items-center justify-start text-muted-foreground">-</div>;
        }
        
        return (
          <div className="min-h-10 flex items-center justify-start gap-1.5 max-w-[220px]">
            <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="text-sm truncate" title={email}>{email}</span>
          </div>
        );
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
      size: 90,
      cell: ({ row }) => {
        const representante = row.original;
        return (
          <div className="min-h-10 flex items-center justify-center">
            <RepresentanteActions representante={representante} onEditSuccess={onEditSuccess} />
          </div>
        );
      },
    },
  ];
}

/**
 * Componente de ações para cada representante
 */
function RepresentanteActions({
  representante,
  onEditSuccess,
}: {
  representante: Representante;
  onEditSuccess: () => void;
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

export function RepresentantesTab() {
  const [busca, setBusca] = React.useState('');
  const [pagina, setPagina] = React.useState(0);
  const [limite, setLimite] = React.useState(50);
  const [filtros, setFiltros] = React.useState<RepresentantesFilters>({});
  const [selectedFilterIds, setSelectedFilterIds] = React.useState<string[]>([]);
  const [createOpen, setCreateOpen] = React.useState(false);

  // Debounce da busca
  const buscaDebounced = useDebounce(busca, 500);
  const isSearching = busca !== buscaDebounced;

  // Parâmetros para buscar representantes
  const params = React.useMemo(() => {
    return {
      pagina: pagina + 1, // API usa 1-indexed
      limite,
      busca: buscaDebounced || undefined,
      ...filtros,
    };
  }, [pagina, limite, buscaDebounced, filtros]);

  const { representantes, paginacao, isLoading, error, refetch } = useRepresentantes(params);

  // Função para atualizar após edição
  const handleEditSuccess = React.useCallback(() => {
    refetch();
  }, [refetch]);

  const colunas = React.useMemo(() => criarColunas(handleEditSuccess), [handleEditSuccess]);

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
        onNewClick={() => setCreateOpen(true)}
        newButtonTooltip="Novo Representante"
      />

      {/* Tabela */}
      <DataTable
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
      {/* <RepresentanteCreateSheet
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={handleEditSuccess}
      /> */}
    </div>
  );
}
