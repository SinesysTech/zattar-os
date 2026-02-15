'use client';

import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, FileText, DollarSign, Calendar } from 'lucide-react';
import { format } from 'date-fns';

import { AppBadge as Badge } from '@/components/ui/app-badge';
import { Button } from '@/components/ui/button';
import { getSemanticBadgeVariant } from '@/lib/design-system';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DataTableColumnHeader } from '@/components/shared/data-shell';

import {
  AcordoComParcelas,
  TIPO_LABELS,
  DIRECAO_LABELS,
  STATUS_LABELS,
} from '../../domain';

// TableMeta type para ações da tabela
interface ObrigacoesTableMeta {
  onVerDetalhes?: (acordo: AcordoComParcelas) => void;
  onRegistrarPagamento?: (acordo: AcordoComParcelas) => void;
  onSucessoOperacao?: () => void;
}

// Helper de formatação
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

// Removidas funções getStatusColor, getTipoColor, getDirecaoColor
// Agora usando getSemanticBadgeVariant() do design system

export const columns: ColumnDef<AcordoComParcelas>[] = [
  {
    accessorKey: 'processo',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Processo" />
    ),
    cell: ({ row }) => {
      const processo = row.original.processo;
      if (!processo) return <span className="text-muted-foreground">-</span>;
      return (
        <div className="flex flex-col max-w-[200px]">
          <span className="font-medium truncate" title={processo.numero_processo}>
            {processo.numero_processo}
          </span>
          <div className="text-xs text-muted-foreground truncate" title={processo.nome_parte_autora + ' x ' + processo.nome_parte_re}>
            {processo.nome_parte_autora} x {processo.nome_parte_re}
          </div>
        </div>
      );
    },
    enableSorting: false, // Sorting by nested object usually requires backend support
  },
  {
    accessorKey: 'tipo',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Tipo" />
    ),
    cell: ({ row }) => {
      const tipo = row.original.tipo;
      return (
        <Badge variant={getSemanticBadgeVariant('obrigacao_tipo', tipo)} className="whitespace-nowrap">
          {TIPO_LABELS[tipo]}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
    size: 100,
  },
  {
    accessorKey: 'direcao',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Direção" />
    ),
    cell: ({ row }) => {
      const direcao = row.original.direcao;
      return (
        <Badge variant={getSemanticBadgeVariant('obrigacao_direcao', direcao)} className="whitespace-nowrap">
          {DIRECAO_LABELS[direcao]}
        </Badge>
      );
    },
    size: 100,
  },
  {
    accessorKey: 'valorTotal',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Valor Total" />
    ),
    cell: ({ row }) => {
      const valor = row.original.valorTotal;
      return (
        <div className="text-right font-medium">
          {formatCurrency(valor)}
        </div>
      );
    },
    meta: {
      align: 'right',
    },
    size: 120,
  },
  {
    id: 'parcelas',
    header: 'Parcelas',
    cell: ({ row }) => {
      const pagas = row.original.parcelasPagas;
      const total = row.original.totalParcelas;
      return (
        <div className="flex items-center gap-1 text-sm">
          <span className="font-medium">{pagas}</span>
          <span className="text-muted-foreground">/</span>
          <span className="text-muted-foreground">{total}</span>
        </div>
      );
    },
    size: 80,
  },
  {
    accessorKey: 'dataVencimentoPrimeiraParcela', // Assuming sorting by first installment for now
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Próx. Vencimento" />
    ),
    cell: ({ row }) => {
      const dateToShow = row.original.proximoVencimento;

      if (!dateToShow) {
        return (
          <div className="flex items-center gap-2">
            <Calendar className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">—</span>
          </div>
        );
      }

      return (
        <div className="flex items-center gap-2">
          <Calendar className="h-3 w-3 text-muted-foreground" />
          <span>{format(new Date(dateToShow), 'dd/MM/yyyy')}</span>
        </div>
      )
    },
    size: 120,
  },
  {
    accessorKey: 'status',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const status = row.original.status;
      return (
        <Badge variant={getSemanticBadgeVariant('obrigacao_status', status)} className="whitespace-nowrap">
          {STATUS_LABELS[status]}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
    size: 110,
  },
  {
    id: 'actions',
    cell: ({ row, table }) => {
      const acordo = row.original;
      const meta = table.options.meta as ObrigacoesTableMeta | undefined;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Ações</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(acordo.id.toString())}
            >
              Copiar ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => meta?.onVerDetalhes?.(acordo)}>
              <FileText className="mr-2 h-4 w-4" />
              Ver Detalhes
            </DropdownMenuItem>
            {acordo.status !== 'pago_total' && (
              <DropdownMenuItem onClick={() => meta?.onRegistrarPagamento?.(acordo)}>
                <DollarSign className="mr-2 h-4 w-4" />
                Registrar Pagamento
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            {/* Add more actions like Edit, Delete if needed */}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
    size: 40,
    meta: {
      align: 'center',
    }
  },
];
