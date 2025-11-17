'use client';

// Página de expedientes - Lista expedientes pendentes de manifestação

import * as React from 'react';
import { useDebounce } from '@/hooks/use-debounce';
import { DataTable } from '@/components/data-table';
import { DataTableColumnHeader } from '@/components/data-table-column-header';
import { ExpedientesFiltrosAvancados } from '@/components/expedientes-filtros-avancados';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { usePendentes } from '@/lib/hooks/use-pendentes';
import { ExpedientesBaixarDialog } from '@/components/expedientes-baixar-dialog';
import { ExpedientesReverterBaixaDialog } from '@/components/expedientes-reverter-baixa-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, CheckCircle2, XCircle } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import type { PendenteManifestacao } from '@/backend/types/pendentes/types';
import type { ExpedientesFilters } from '@/lib/types/expedientes';

/**
 * Formata data ISO para formato brasileiro (DD/MM/YYYY)
 */
const formatarData = (dataISO: string | null): string => {
  if (!dataISO) return '-';
  try {
    const data = new Date(dataISO);
    return data.toLocaleDateString('pt-BR');
  } catch {
    return '-';
  }
};

/**
 * Formata data e hora ISO para formato brasileiro (DD/MM/YYYY HH:mm)
 */
const formatarDataHora = (dataISO: string | null): string => {
  if (!dataISO) return '-';
  try {
    const data = new Date(dataISO);
    return data.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '-';
  }
};

/**
 * Define as colunas da tabela de expedientes
 */
const colunas: ColumnDef<PendenteManifestacao>[] = [
  {
    accessorKey: 'numero_processo',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Número do Processo" />
    ),
    enableSorting: true,
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue('numero_processo')}</div>
    ),
  },
  {
    accessorKey: 'nome_parte_autora',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Parte Autora" />
    ),
    enableSorting: true,
    cell: ({ row }) => <div>{row.getValue('nome_parte_autora')}</div>,
  },
  {
    accessorKey: 'nome_parte_re',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Parte Ré" />
    ),
    enableSorting: true,
    cell: ({ row }) => <div>{row.getValue('nome_parte_re')}</div>,
  },
  {
    accessorKey: 'descricao_orgao_julgador',
    header: 'Órgão Julgador',
    cell: ({ row }) => (
      <div className="max-w-[300px] truncate">{row.getValue('descricao_orgao_julgador')}</div>
    ),
  },
  {
    accessorKey: 'classe_judicial',
    header: 'Classe Judicial',
    cell: ({ row }) => (
      <Badge variant="outline">{row.getValue('classe_judicial')}</Badge>
    ),
  },
  {
    accessorKey: 'data_ciencia_parte',
    header: 'Data de Ciência',
    cell: ({ row }) => formatarData(row.getValue('data_ciencia_parte')),
  },
  {
    accessorKey: 'data_prazo_legal_parte',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Prazo Legal" />
    ),
    enableSorting: true,
    cell: ({ row }) => formatarData(row.getValue('data_prazo_legal_parte')),
  },
  {
    accessorKey: 'prazo_vencido',
    header: 'Prazo',
    cell: ({ row }) => {
      const prazoVencido = row.getValue('prazo_vencido') as boolean;
      return (
        <Badge variant={prazoVencido ? 'destructive' : 'default'}>
          {prazoVencido ? 'Vencido' : 'No Prazo'}
        </Badge>
      );
    },
  },
  {
    id: 'status_baixa',
    header: 'Status',
    cell: ({ row }) => {
      const baixadoEm = row.original.baixado_em;
      if (baixadoEm) {
        return (
          <Badge variant="secondary" className="capitalize">
            Baixado
          </Badge>
        );
      }
      return (
        <Badge variant="outline" className="capitalize">
          Pendente
        </Badge>
      );
    },
  },
  {
    accessorKey: 'baixado_em',
    header: 'Data de Baixa',
    cell: ({ row }) => formatarData(row.getValue('baixado_em')),
  },
  {
    id: 'acoes',
    header: 'Ações',
    cell: ({ row }) => {
      const expediente = row.original;
      return <AcoesExpediente expediente={expediente} />;
    },
  },
];

/**
 * Componente de ações para cada expediente
 */
function AcoesExpediente({ expediente }: { expediente: PendenteManifestacao }) {
  const [baixarDialogOpen, setBaixarDialogOpen] = React.useState(false);
  const [reverterDialogOpen, setReverterDialogOpen] = React.useState(false);
  const [refetchKey, setRefetchKey] = React.useState(0);

  const handleSuccess = () => {
    setRefetchKey((prev) => prev + 1);
    // Forçar reload da página após sucesso
    window.location.reload();
  };

  const estaBaixado = !!expediente.baixado_em;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Abrir menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {!estaBaixado ? (
            <DropdownMenuItem onClick={() => setBaixarDialogOpen(true)}>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Baixar Expediente
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={() => setReverterDialogOpen(true)}>
              <XCircle className="mr-2 h-4 w-4" />
              Reverter Baixa
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <ExpedientesBaixarDialog
        open={baixarDialogOpen}
        onOpenChange={setBaixarDialogOpen}
        expediente={expediente}
        onSuccess={handleSuccess}
      />

      <ExpedientesReverterBaixaDialog
        open={reverterDialogOpen}
        onOpenChange={setReverterDialogOpen}
        expediente={expediente}
        onSuccess={handleSuccess}
      />
    </>
  );
}

export default function ExpedientesPage() {
  const [busca, setBusca] = React.useState('');
  const [pagina, setPagina] = React.useState(0);
  const [limite, setLimite] = React.useState(50);
  const [ordenarPor, setOrdenarPor] = React.useState<
    'data_prazo_legal_parte' | 'numero_processo' | 'nome_parte_autora' | 'nome_parte_re' | null
  >('data_prazo_legal_parte');
  const [ordem, setOrdem] = React.useState<'asc' | 'desc'>('asc');
  const [filtros, setFiltros] = React.useState<ExpedientesFilters>({});

  // Debounce da busca
  const buscaDebounced = useDebounce(busca, 500);

  // Parâmetros para buscar expedientes
  const params = React.useMemo(
    () => ({
      pagina: pagina + 1, // API usa 1-indexed
      limite,
      busca: buscaDebounced || undefined,
      ordenar_por: ordenarPor || undefined,
      ordem,
      ...filtros, // Spread dos filtros avançados
    }),
    [pagina, limite, buscaDebounced, ordenarPor, ordem, filtros]
  );

  const { expedientes, paginacao, isLoading, error } = usePendentes(params);

  const handleSortingChange = React.useCallback(
    (columnId: string | null, direction: 'asc' | 'desc' | null) => {
      if (columnId && direction) {
        setOrdenarPor(columnId as typeof ordenarPor);
        setOrdem(direction);
      } else {
        setOrdenarPor(null);
        setOrdem('asc');
      }
    },
    []
  );

  const handleFiltersChange = React.useCallback((newFilters: ExpedientesFilters) => {
    setFiltros(newFilters);
    setPagina(0); // Resetar para primeira página ao aplicar filtros
  }, []);

  const handleFiltersReset = React.useCallback(() => {
    setFiltros({});
    setPagina(0);
  }, []);

  return (
    <div className="space-y-4">
      {/* Barra de busca e filtros */}
      <div className="flex items-center gap-4">
        <Input
          placeholder="Buscar por número do processo, parte autora, parte ré, órgão julgador ou classe judicial..."
          value={busca}
          onChange={(e) => {
            setBusca(e.target.value);
            setPagina(0); // Resetar para primeira página ao buscar
          }}
          className="max-w-sm"
        />
        <ExpedientesFiltrosAvancados
          filters={filtros}
          onFiltersChange={handleFiltersChange}
          onReset={handleFiltersReset}
        />
      </div>

      {/* Tabela */}
      <DataTable
        data={expedientes}
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
        sorting={{
          columnId: ordenarPor,
          direction: ordem,
          onSortingChange: handleSortingChange,
        }}
        isLoading={isLoading}
        error={error}
        emptyMessage="Nenhum expediente encontrado."
      />
    </div>
  );
}

