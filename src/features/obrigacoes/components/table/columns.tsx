'use client';

import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, FileText, DollarSign, Calendar, Info } from 'lucide-react';
import { format } from 'date-fns';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
  TipoObrigacao,
  DirecaoPagamento,
  StatusAcordo,
  TIPO_LABELS,
  DIRECAO_LABELS,
  STATUS_LABELS,
} from '../../domain';

// Helper de formatação
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

// Cores dos badges
const getStatusColor = (status: StatusAcordo) => {
  switch (status) {
    case 'pendente': return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-500/20 border-yellow-200 dark:border-yellow-800';
    case 'pago_parcial': return 'bg-blue-500/10 text-blue-700 dark:text-blue-400 hover:bg-blue-500/20 border-blue-200 dark:border-blue-800';
    case 'pago_total': return 'bg-green-500/10 text-green-700 dark:text-green-400 hover:bg-green-500/20 border-green-200 dark:border-green-800';
    case 'atrasado': return 'bg-red-500/10 text-red-700 dark:text-red-400 hover:bg-red-500/20 border-red-200 dark:border-red-800';
    default: return 'bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-200 dark:border-gray-800';
  }
};

const getTipoColor = (tipo: TipoObrigacao) => {
  switch (tipo) {
    case 'acordo': return 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800';
    case 'condenacao': return 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800';
    case 'custas_processuais': return 'bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-200 dark:border-gray-800';
    default: return 'bg-gray-100 text-gray-700';
  }
};

const getDirecaoColor = (direcao: DirecaoPagamento) => {
  return direcao === 'recebimento'
    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
};

export const columns: ColumnDef<AcordoComParcelas>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="translate-y-[2px]"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="translate-y-[2px]"
      />
    ),
    enableSorting: false,
    enableHiding: false,
    meta: {
      align: 'center',
    },
    size: 40,
  },
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
        <Badge variant="outline" className={`${getTipoColor(tipo)} whitespace-nowrap`}>
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
        <Badge variant="outline" className={`${getDirecaoColor(direcao)} whitespace-nowrap`}>
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
        <Badge variant="outline" className={`${getStatusColor(status)} whitespace-nowrap`}>
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
      const meta = table.options.meta as any;
      
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
