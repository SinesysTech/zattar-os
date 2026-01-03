
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { AppBadge as Badge } from '@/components/ui/app-badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DataPagination, DataShell, DataTable } from '@/components/shared/data-shell';
import { DataTableColumnHeader } from '@/components/shared/data-shell/data-table-column-header';
import { DataTableToolbar } from '@/components/shared/data-shell/data-table-toolbar';
import type { Table as TanstackTable } from '@tanstack/react-table';
import type { ColumnDef } from '@tanstack/react-table';
import { GerarFolhaDialog } from './gerar-folha-dialog';
import { useFolhasPagamento } from '../../hooks';
import { MESES_LABELS, STATUS_FOLHA_LABELS } from '../../domain';
import { STATUS_FOLHA_CORES } from '../../utils';
import type { FolhaPagamentoComDetalhes } from '../../types';

const statusOptions = [
  { value: 'rascunho', label: STATUS_FOLHA_LABELS.rascunho },
  { value: 'aprovada', label: STATUS_FOLHA_LABELS.aprovada },
  { value: 'paga', label: STATUS_FOLHA_LABELS.paga },
  { value: 'cancelada', label: STATUS_FOLHA_LABELS.cancelada },
];

// ============================================================================
// Helpers
// ============================================================================

const formatarValor = (valor: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
};

const formatarData = (data: string): string => {
  return new Date(data).toLocaleDateString('pt-BR');
};

// ============================================================================
// Definição das Colunas
// ============================================================================

function criarColunas(
  onDetalhes: (folha: FolhaPagamentoComDetalhes) => void
): ColumnDef<FolhaPagamentoComDetalhes>[] {
  return [
    {
      accessorKey: 'periodo',
      header: ({ column }) => (
        <div className="flex items-center justify-start">
          <DataTableColumnHeader column={column} title="Período" />
        </div>
      ),
      enableSorting: true,
      size: 150,
      cell: ({ row }) => {
        const folha = row.original;
        return (
          <div className="font-medium">
            {MESES_LABELS[folha.mesReferencia]}/{folha.anoReferencia}
          </div>
        );
      },
    },
    {
      accessorKey: 'dataGeracao',
      header: ({ column }) => (
        <div className="flex items-center justify-center">
          <DataTableColumnHeader column={column} title="Data Geração" />
        </div>
      ),
      enableSorting: true,
      size: 130,
      cell: ({ row }) => (
        <div className="text-center">
          {formatarData(row.original.dataGeracao)}
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: ({ column }) => (
        <div className="flex items-center justify-center">
          <DataTableColumnHeader column={column} title="Status" />
        </div>
      ),
      enableSorting: true,
      size: 130,
      cell: ({ row }) => {
        const folha = row.original;
        const cores = STATUS_FOLHA_CORES[folha.status] || STATUS_FOLHA_CORES.rascunho;
        return (
          <div className="flex justify-center">
            <Badge
              className={`${cores.bg} ${cores.text} border ${cores.border}`}
              variant="outline"
            >
              {STATUS_FOLHA_LABELS[folha.status]}
            </Badge>
          </div>
        );
      },
    },
    {
      accessorKey: 'totalFuncionarios',
      header: ({ column }) => (
        <div className="flex items-center justify-center">
          <DataTableColumnHeader column={column} title="Funcionários" />
        </div>
      ),
      enableSorting: true,
      size: 120,
      cell: ({ row }) => (
        <div className="text-center font-medium">
          {row.original.totalFuncionarios}
        </div>
      ),
    },
    {
      accessorKey: 'valorTotal',
      header: ({ column }) => (
        <div className="flex items-center justify-end">
          <DataTableColumnHeader column={column} title="Valor Total" />
        </div>
      ),
      enableSorting: true,
      size: 150,
      cell: ({ row }) => (
        <div className="text-right font-medium text-green-600">
          {formatarValor(row.original.valorTotal ?? 0)}
        </div>
      ),
    },
    {
      id: 'actions',
      header: () => <div className="text-center">Ações</div>,
      size: 100,
      cell: ({ row }) => (
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDetalhes(row.original)}
          >
            Detalhes
          </Button>
        </div>
      ),
    },
  ];
}

// ============================================================================
// Componente Principal
// ============================================================================

export function FolhasPagamentoList() {
  const router = useRouter();

  // Estado da instância da tabela e densidade
  const [table, setTable] = React.useState<TanstackTable<FolhaPagamentoComDetalhes> | null>(null);
  const [density, setDensity] = React.useState<'compact' | 'standard' | 'relaxed'>('standard');

  // Estados de filtros
  const [dialogAberto, setDialogAberto] = React.useState(false);
  const [pagina, setPagina] = React.useState(1);
  const [mesReferencia, setMesReferencia] = React.useState<string>('');
  const [anoReferencia, setAnoReferencia] = React.useState<string>('');
  const [status, setStatus] = React.useState<string>('');

  const { folhas, paginacao, isLoading, error, refetch } = useFolhasPagamento({
    pagina,
    limite: 50,
    mesReferencia: mesReferencia ? Number(mesReferencia) : undefined,
    anoReferencia: anoReferencia ? Number(anoReferencia) : undefined,
    status: status as 'rascunho' | 'aprovada' | 'paga' | 'cancelada' | undefined,
  });

  const handleNovaFolha = React.useCallback(() => setDialogAberto(true), []);

  const handleGerada = React.useCallback(
    (folhaId?: number) => {
      refetch();
      setPagina(1);
      if (folhaId) {
        router.push(`/rh/folhas-pagamento/${folhaId}`);
      }
    },
    [refetch, router]
  );

  const handleDetalhes = React.useCallback(
    (folha: FolhaPagamentoComDetalhes) => {
      router.push(`/rh/folhas-pagamento/${folha.id}`);
    },
    [router]
  );

  // Colunas
  const colunas = React.useMemo(
    () => criarColunas(handleDetalhes),
    [handleDetalhes]
  );

  return (
    <div className="flex flex-col gap-6 p-6">
      <DataShell
        header={
          <DataTableToolbar
            table={table}
            density={density}
            onDensityChange={setDensity}
            actionButton={{
              label: 'Gerar Nova Folha',
              onClick: handleNovaFolha,
            }}
            filtersSlot={
              <>
                <Select value={mesReferencia} onValueChange={setMesReferencia}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Mês" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos os meses</SelectItem>
                    {Object.entries(MESES_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Input
                  type="number"
                  placeholder="Ano"
                  value={anoReferencia}
                  onChange={(e) => setAnoReferencia(e.target.value)}
                  className="w-[120px]"
                />

                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos os status</SelectItem>
                    {statusOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {(mesReferencia || anoReferencia || status) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setMesReferencia('');
                      setAnoReferencia('');
                      setStatus('');
                      setPagina(1);
                    }}
                  >
                    Limpar filtros
                  </Button>
                )}
              </>
            }
          />
        }
        footer={
          paginacao && paginacao.totalPaginas > 0 ? (
            <DataPagination
              pageIndex={pagina - 1}
              pageSize={50}
              total={paginacao.total}
              totalPages={paginacao.totalPaginas}
              onPageChange={(pageIndex) => setPagina(pageIndex + 1)}
              onPageSizeChange={() => {}}
              isLoading={isLoading}
            />
          ) : null
        }
      >
        <div className="relative border-t">
          <DataTable
            columns={colunas}
            data={folhas}
            isLoading={isLoading}
            error={error}
            pagination={
              paginacao
                ? {
                    pageIndex: pagina - 1,
                    pageSize: 50,
                    total: paginacao.total,
                    totalPages: paginacao.totalPaginas,
                    onPageChange: (pageIndex) => setPagina(pageIndex + 1),
                    onPageSizeChange: () => {},
                  }
                : undefined
            }
            hideTableBorder={true}
            hidePagination={true}
            onTableChange={setTable}
            density={density}
          />
        </div>
      </DataShell>

      <GerarFolhaDialog
        open={dialogAberto}
        onOpenChange={setDialogAberto}
        onSuccess={handleGerada}
      />
    </div>
  );
}
