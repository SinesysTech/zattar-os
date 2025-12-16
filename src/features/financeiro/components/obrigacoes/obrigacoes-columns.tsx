'use client';

/**
 * Obrigações Columns
 *
 * Factory function para colunas da tabela de obrigações.
 * Extraído de page.tsx para reutilização.
 */

import * as React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  MoreHorizontal,
  RefreshCw,
  Eye,
  Link as LinkIcon,
  AlertCircle,
  CheckCircle,
  Clock,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DataTableColumnHeader } from '@/components/shared/data-shell/data-table-column-header';
import { cn } from '@/lib/utils';
import type { ColumnDef } from '@tanstack/react-table';
import type {
  ObrigacaoComDetalhes,
  TipoObrigacao,
  StatusObrigacao,
  StatusSincronizacao,
} from '@/features/financeiro';

// =============================================================================
// TIPOS E CONSTANTES
// =============================================================================

type BadgeTone = 'primary' | 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'muted';

export const TIPO_CONFIG: Record<TipoObrigacao, { label: string; tone: BadgeTone }> = {
  acordo_recebimento: { label: 'Acordo - Recebimento', tone: 'success' },
  acordo_pagamento: { label: 'Acordo - Pagamento', tone: 'danger' },
  conta_receber: { label: 'Conta a Receber', tone: 'info' },
  conta_pagar: { label: 'Conta a Pagar', tone: 'warning' },
};

export const STATUS_CONFIG: Record<StatusObrigacao, { label: string; tone: BadgeTone }> = {
  pendente: { label: 'Pendente', tone: 'warning' },
  vencida: { label: 'Vencida', tone: 'danger' },
  efetivada: { label: 'Efetivada', tone: 'success' },
  cancelada: { label: 'Cancelada', tone: 'neutral' },
  estornada: { label: 'Estornada', tone: 'muted' },
};

export const SINCRONIZACAO_CONFIG: Record<
  StatusSincronizacao,
  { label: string; icon: React.ReactNode; className: string }
> = {
  sincronizado: { label: 'Sincronizado', icon: <CheckCircle className="h-3 w-3" />, className: 'text-success' },
  pendente: { label: 'Pendente', icon: <Clock className="h-3 w-3" />, className: 'text-warning' },
  inconsistente: { label: 'Inconsistente', icon: <AlertCircle className="h-3 w-3" />, className: 'text-destructive' },
  nao_aplicavel: { label: 'N/A', icon: null, className: 'text-muted-foreground' },
};

// =============================================================================
// HELPERS
// =============================================================================

export function formatarValor(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
}

export function formatarData(data: string | null | undefined): string {
  if (!data) return '-';
  return format(new Date(data), 'dd/MM/yyyy', { locale: ptBR });
}

// =============================================================================
// COMPONENTE DE AÇÕES
// =============================================================================

interface ObrigacoesActionsProps {
  obrigacao: ObrigacaoComDetalhes;
  onVerDetalhes: (obrigacao: ObrigacaoComDetalhes) => void;
  onSincronizar: (obrigacao: ObrigacaoComDetalhes) => void;
  onVerLancamento: (obrigacao: ObrigacaoComDetalhes) => void;
}

function ObrigacoesActions({
  obrigacao,
  onVerDetalhes,
  onSincronizar,
  onVerLancamento,
}: ObrigacoesActionsProps) {
  const podeVerLancamento = obrigacao.lancamentoId !== null;
  const podeSincronizar =
    obrigacao.tipoEntidade === 'parcela' &&
    (obrigacao.statusSincronizacao === 'pendente' || obrigacao.statusSincronizacao === 'inconsistente');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Ações</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onVerDetalhes(obrigacao)}>
          <Eye className="mr-2 h-4 w-4" />
          Ver Detalhes
        </DropdownMenuItem>
        {podeVerLancamento && (
          <DropdownMenuItem onClick={() => onVerLancamento(obrigacao)}>
            <LinkIcon className="mr-2 h-4 w-4" />
            Ver Lançamento Financeiro
          </DropdownMenuItem>
        )}
        {podeSincronizar && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onSincronizar(obrigacao)}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Sincronizar
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// =============================================================================
// FACTORY FUNCTION DE COLUNAS
// =============================================================================

export function getObrigacoesColumns(
  onVerDetalhes: (obrigacao: ObrigacaoComDetalhes) => void,
  onSincronizar: (obrigacao: ObrigacaoComDetalhes) => void,
  onVerLancamento: (obrigacao: ObrigacaoComDetalhes) => void
): ColumnDef<ObrigacaoComDetalhes>[] {
  return [
    {
      accessorKey: 'tipo',
      header: ({ column }) => (
        <div className="flex items-center justify-center">
          <DataTableColumnHeader column={column} title="Tipo" />
        </div>
      ),
      enableSorting: true,
      size: 160,
      meta: { align: 'center' as const, headerLabel: 'Tipo' },
      cell: ({ row }) => {
        const tipo = row.getValue('tipo') as TipoObrigacao;
        const config = TIPO_CONFIG[tipo];
        return (
          <div className="min-h-10 flex items-center justify-center">
            <Badge tone={config.tone} variant="soft" className="text-xs">
              {config.label}
            </Badge>
          </div>
        );
      },
    },
    {
      accessorKey: 'descricao',
      header: ({ column }) => (
        <div className="flex items-center justify-start">
          <DataTableColumnHeader column={column} title="Descrição" />
        </div>
      ),
      enableSorting: true,
      size: 280,
      meta: { align: 'left' as const, headerLabel: 'Descrição' },
      cell: ({ row }) => {
        const obrigacao = row.original;
        return (
          <div className="min-h-10 flex flex-col justify-center">
            <span className="text-sm font-medium">{obrigacao.descricao}</span>
            {obrigacao.cliente && (
              <span className="text-xs text-muted-foreground">{obrigacao.cliente.nome}</span>
            )}
            {obrigacao.processo && (
              <span className="text-xs text-muted-foreground">
                Proc. {obrigacao.processo.numeroProcesso}
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'valor',
      header: ({ column }) => (
        <div className="flex items-center justify-end">
          <DataTableColumnHeader column={column} title="Valor" />
        </div>
      ),
      enableSorting: true,
      size: 130,
      meta: { align: 'right' as const, headerLabel: 'Valor' },
      cell: ({ row }) => {
        const valor = row.getValue('valor') as number;
        return (
          <div className="min-h-10 flex items-center justify-end font-mono text-sm font-medium">
            {formatarValor(valor)}
          </div>
        );
      },
    },
    {
      accessorKey: 'dataVencimento',
      header: ({ column }) => (
        <div className="flex items-center justify-center">
          <DataTableColumnHeader column={column} title="Vencimento" />
        </div>
      ),
      enableSorting: true,
      size: 120,
      meta: { align: 'center' as const, headerLabel: 'Vencimento' },
      cell: ({ row }) => {
        const obrigacao = row.original;
        const isVencida = obrigacao.status === 'vencida';
        return (
          <div
            className={cn(
              'min-h-10 flex items-center justify-center text-sm',
              isVencida && 'text-destructive font-medium'
            )}
          >
            {formatarData(obrigacao.dataVencimento)}
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: ({ column }) => (
        <div className="flex items-center justify-center">
          <DataTableColumnHeader column={column} title="Status" />
        </div>
      ),
      enableSorting: true,
      size: 100,
      meta: { align: 'center' as const, headerLabel: 'Status' },
      cell: ({ row }) => {
        const status = row.getValue('status') as StatusObrigacao;
        const config = STATUS_CONFIG[status];
        return (
          <div className="min-h-10 flex items-center justify-center">
            <Badge tone={config.tone} variant="soft">
              {config.label}
            </Badge>
          </div>
        );
      },
    },
    {
      accessorKey: 'statusSincronizacao',
      header: ({ column }) => (
        <div className="flex items-center justify-center">
          <DataTableColumnHeader column={column} title="Sinc." />
        </div>
      ),
      enableSorting: false,
      size: 80,
      meta: { align: 'center' as const, headerLabel: 'Sincronização' },
      cell: ({ row }) => {
        const status = row.getValue('statusSincronizacao') as StatusSincronizacao;
        const config = SINCRONIZACAO_CONFIG[status];
        return (
          <div className={cn('min-h-10 flex items-center justify-center gap-1', config.className)}>
            {config.icon}
            <span className="text-xs">{config.label}</span>
          </div>
        );
      },
    },
    {
      id: 'acoes',
      header: () => <span className="sr-only">Ações</span>,
      enableSorting: false,
      size: 80,
      meta: { align: 'center' as const, headerLabel: 'Ações' },
      cell: ({ row }) => {
        const obrigacao = row.original;
        return (
          <div className="min-h-10 flex items-center justify-center">
            <ObrigacoesActions
              obrigacao={obrigacao}
              onVerDetalhes={onVerDetalhes}
              onSincronizar={onSincronizar}
              onVerLancamento={onVerLancamento}
            />
          </div>
        );
      },
    },
  ];
}
