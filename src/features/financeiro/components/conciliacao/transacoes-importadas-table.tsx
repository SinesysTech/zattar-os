'use client';

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DataTable } from '@/components/shared/data-shell';
import { DataTableColumnHeader } from '@/components/shared/data-shell/data-table-column-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Wand2, CheckCircle2, XCircle, Info } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import type { TransacaoComConciliacao } from '../../types/conciliacao';

interface Props {
  transacoes: TransacaoComConciliacao[];
  onConciliar: (transacao: TransacaoComConciliacao) => void;
  onDesconciliar: (transacao: TransacaoComConciliacao) => void;
  onIgnorar?: (transacao: TransacaoComConciliacao) => void;
  onVerSugestoes?: (transacao: TransacaoComConciliacao) => void;
  onVerDetalhes?: (transacao: TransacaoComConciliacao) => void;
}

const formatarData = (data: string) => format(new Date(data), 'dd/MM/yyyy', { locale: ptBR });

const formatarValor = (valor: number, tipo: 'credito' | 'debito') =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(tipo === 'debito' ? -valor : valor);

const STATUS_VARIANTS: Record<string, { label: string; variant: 'warning' | 'success' | 'destructive' | 'outline' }> = {
  pendente: { label: 'Pendente', variant: 'warning' },
  conciliado: { label: 'Conciliado', variant: 'success' },
  divergente: { label: 'Divergente', variant: 'destructive' },
  ignorado: { label: 'Ignorado', variant: 'outline' },
};

const TIPO_VARIANTS: Record<'credito' | 'debito', { label: string; variant: 'success' | 'destructive' }> = {
  credito: { label: 'Crédito', variant: 'success' },
  debito: { label: 'Débito', variant: 'destructive' },
};

export function TransacoesImportadasTable({
  transacoes,
  onConciliar,
  onDesconciliar,
  onIgnorar,
  onVerSugestoes,
  onVerDetalhes,
}: Props) {
  const colunas: ColumnDef<TransacaoComConciliacao>[] = [
    {
      accessorKey: 'dataTransacao',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Data" />,
      cell: ({ row }) => <span className="text-sm">{formatarData(row.original.dataTransacao)}</span>,
      enableSorting: true,
      size: 100,
    },
    {
      accessorKey: 'descricao',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Descri\u00e7\u00e3o" />,
      cell: ({ row }) => (
        <div className="max-w-md truncate text-sm" title={row.original.descricao}>
          {row.original.descricao}
        </div>
      ),
      size: 260,
    },
    {
      accessorKey: 'valor',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Valor" />,
      cell: ({ row }) => (
        <div className="text-right font-mono text-sm">
          {formatarValor(row.original.valor, row.original.tipoTransacao)}
        </div>
      ),
      size: 120,
      enableSorting: true,
    },
    {
      accessorKey: 'tipoTransacao',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Tipo" />,
      cell: ({ row }) => {
        const tipo = row.original.tipoTransacao;
        const config = TIPO_VARIANTS[tipo as 'credito' | 'debito'];
        return (
          <Badge variant={config.variant}>
            {config.label}
          </Badge>
        );
      },
      size: 100,
    },
    {
      id: 'status',
      header: () => <div className="text-sm font-medium">Conciliação</div>,
      cell: ({ row }) => {
        const status = row.original.conciliacao?.status || 'pendente';
        const config = STATUS_VARIANTS[status] || STATUS_VARIANTS.pendente;
        return (
          <Badge variant={config.variant}>
            {config.label}
          </Badge>
        );
      },
      size: 140,
    },
    {
      id: 'lancamento',
      header: () => <div className="text-sm font-medium">Lan\u00e7amento</div>,
      cell: ({ row }) => {
        const lanc = row.original.lancamentoVinculado;
        return lanc ? (
          <div className="max-w-xs truncate text-sm" title={lanc.descricao}>
            {lanc.descricao}
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">N\u00e3o conciliado</span>
        );
      },
      size: 200,
    },
    {
      id: 'actions',
      header: () => <div className="text-sm font-medium">A\u00e7\u00f5es</div>,
      cell: ({ row }) => {
        const transacao = row.original;
        const status = transacao.conciliacao?.status || 'pendente';
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {status === 'pendente' && (
                <>
                  <DropdownMenuItem onClick={() => onVerSugestoes?.(transacao)}>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Ver Sugest\u00f5es
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onConciliar(transacao)}>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Conciliar Manualmente
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onIgnorar?.(transacao)}>
                    <XCircle className="mr-2 h-4 w-4" />
                    Marcar como Ignorado
                  </DropdownMenuItem>
                </>
              )}
              {status === 'conciliado' && (
                <DropdownMenuItem onClick={() => onDesconciliar(transacao)}>
                  <XCircle className="mr-2 h-4 w-4" />
                  Desconciliar
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => onVerDetalhes?.(transacao)}>
                <Info className="mr-2 h-4 w-4" />
                Ver Detalhes
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
      size: 80,
    },
  ];

  return (
    <DataTable
      data={transacoes}
      columns={colunas}
      isLoading={false}
      emptyMessage="Nenhuma transa\u00e7\u00e3o importada"
    />
  );
}
