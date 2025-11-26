'use client';

/**
 * Tab de Representantes
 * Lista e gerencia representantes legais (advogados, procuradores, etc.)
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
import { Eye, Pencil } from 'lucide-react';
import { useRepresentantes } from '@/app/_lib/hooks/use-representantes';
import type { ColumnDef } from '@tanstack/react-table';
import type { Representante } from '@/backend/types/representantes/representantes-types';
import {
  formatarCpf,
  formatarCnpj,
  formatarTelefone,
  formatarNome,
  formatarTipoPessoa,
} from '@/app/_lib/utils/format-clientes';
import {
  buildRepresentantesFilterOptions,
  buildRepresentantesFilterGroups,
  parseRepresentantesFilters,
  type RepresentantesFilters,
} from './representantes-toolbar-filters';

/**
 * Define as colunas da tabela de representantes
 */
function criarColunas(onEditSuccess: () => void): ColumnDef<Representante>[] {
  return [
    {
      accessorKey: 'nome',
      header: ({ column }) => (
        <div className="flex items-center justify-start">
          <DataTableColumnHeader column={column} title="Nome" />
        </div>
      ),
      enableSorting: true,
      size: 200,
      meta: { align: 'left' },
      cell: ({ row }) => (
        <div className="min-h-10 flex items-center justify-start text-sm">
          {formatarNome(row.getValue('nome'))}
        </div>
      ),
    },
    {
      accessorKey: 'tipo_pessoa',
      header: ({ column }) => (
        <div className="flex items-center justify-center">
          <DataTableColumnHeader column={column} title="Tipo" />
        </div>
      ),
      enableSorting: true,
      size: 120,
      cell: ({ row }) => {
        const tipoPessoa = row.getValue('tipo_pessoa') as 'pf' | 'pj';
        return (
          <div className="min-h-10 flex items-center justify-center">
            <Badge variant="outline" tone="neutral">
              {formatarTipoPessoa(tipoPessoa)}
            </Badge>
          </div>
        );
      },
    },
    {
      id: 'documento',
      header: () => (
        <div className="flex items-center justify-center">
          <div className="text-sm font-medium">CPF/CNPJ</div>
        </div>
      ),
      enableSorting: false,
      size: 150,
      cell: ({ row }) => {
        const representante = row.original;
        // Representantes são sempre advogados (PF) com CPF
        const documento = representante.cpf ? formatarCpf(representante.cpf) : '-';
        return (
          <div className="min-h-10 flex items-center justify-center text-sm">
            {documento}
          </div>
        );
      },
    },
    {
      accessorKey: 'numero_oab',
      header: () => (
        <div className="flex items-center justify-center">
          <div className="text-sm font-medium">OAB</div>
        </div>
      ),
      enableSorting: false,
      size: 130,
      cell: ({ row }) => {
        const numeroOab = row.getValue('numero_oab') as string | null;
        return (
          <div className="min-h-10 flex items-center justify-center text-sm">
            {numeroOab ? (
              <Badge variant="outline" tone="info">
                {numeroOab}
              </Badge>
            ) : (
              '-'
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'parte_tipo',
      header: () => (
        <div className="flex items-center justify-center">
          <div className="text-sm font-medium">Tipo de Parte</div>
        </div>
      ),
      enableSorting: false,
      size: 150,
      cell: ({ row }) => {
        const parteTipo = row.getValue('parte_tipo') as string;
        const tipoLabel =
          parteTipo === 'cliente'
            ? 'Cliente'
            : parteTipo === 'parte_contraria'
              ? 'Parte Contrária'
              : 'Terceiro';
        const tone =
          parteTipo === 'cliente'
            ? 'success'
            : parteTipo === 'parte_contraria'
              ? 'danger'
              : 'neutral';
        return (
          <div className="min-h-10 flex items-center justify-center">
            <Badge variant="soft" tone={tone}>
              {tipoLabel}
            </Badge>
          </div>
        );
      },
    },
    {
      id: 'situacao_oab',
      header: () => (
        <div className="flex items-center justify-center">
          <div className="text-sm font-medium">Situação OAB</div>
        </div>
      ),
      enableSorting: false,
      size: 120,
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
    {
      id: 'email',
      header: () => (
        <div className="flex items-center justify-start">
          <div className="text-sm font-medium">E-mail</div>
        </div>
      ),
      enableSorting: false,
      size: 200,
      meta: { align: 'left' },
      cell: ({ row }) => {
        const representante = row.original;
        // Email pode ser string simples ou JSONB array
        const email = representante.email;
        const emails = representante.emails;
        // Prioriza email simples, depois tenta extrair do JSONB
        const displayEmail = email 
          || (Array.isArray(emails) && emails.length > 0 ? String(emails[0]) : null)
          || '-';
        return (
          <div className="min-h-10 flex items-center justify-start text-sm">
            {displayEmail}
          </div>
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
        searchPlaceholder="Buscar por nome, CPF, CNPJ, OAB ou e-mail..."
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
