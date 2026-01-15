'use client';

import * as React from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MoreHorizontal, User, FileText, MessageSquareText } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { AppBadge } from '@/components/ui/app-badge';
import { ParteBadge } from '@/components/ui/parte-badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

import type { GrauTribunal, Pericia } from '../domain';
import { SITUACAO_PERICIA_LABELS, SituacaoPericiaCodigo } from '../domain';
import { GRAU_TRIBUNAL_LABELS } from '@/features/expedientes/domain';
import type { UsuarioOption } from '../types';
import { PericiaDetalhesDialog } from './pericia-detalhes-dialog';
import { PericiaAtribuirResponsavelDialog } from './pericia-atribuir-responsavel-dialog';
import { PericiaObservacoesDialog } from './pericia-observacoes-dialog';

export interface PericiasTableMeta {
  usuarios: UsuarioOption[];
  onSuccess?: () => void;
}

function getSituacaoVariant(codigo: SituacaoPericiaCodigo) {
  const variantMap: Record<string, 'success' | 'info' | 'destructive' | 'warning' | 'secondary'> = {
    F: 'success',
    P: 'info',
    C: 'destructive',
    L: 'warning',
    S: 'warning',
    R: 'secondary',
  };
  return variantMap[codigo] || 'secondary';
}

function formatarDataCurta(dataISO: string | null): string {
  if (!dataISO) return '-';
  try {
    return format(new Date(dataISO), 'dd/MM/yyyy', { locale: ptBR });
  } catch {
    return '-';
  }
}

function isVencido(prazoEntrega: string | null): boolean {
  if (!prazoEntrega) return false;
  try {
    return new Date(prazoEntrega).getTime() < new Date().getTime();
  } catch {
    return false;
  }
}

function ActionsCell({
  pericia,
  usuarios,
  onSuccess,
}: {
  pericia: Pericia;
  usuarios: UsuarioOption[];
  onSuccess?: () => void;
}) {
  const [showDetalhes, setShowDetalhes] = React.useState(false);
  const [showResponsavel, setShowResponsavel] = React.useState(false);
  const [showObs, setShowObs] = React.useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Abrir ações</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setShowDetalhes(true)}>
            <FileText className="mr-2 h-4 w-4" />
            Ver detalhes
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowResponsavel(true)}>
            <User className="mr-2 h-4 w-4" />
            Atribuir responsável
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowObs(true)}>
            <MessageSquareText className="mr-2 h-4 w-4" />
            Observações
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <PericiaDetalhesDialog
        pericia={pericia}
        open={showDetalhes}
        onOpenChange={setShowDetalhes}
      />

      <PericiaAtribuirResponsavelDialog
        pericia={pericia}
        usuarios={usuarios}
        open={showResponsavel}
        onOpenChange={setShowResponsavel}
        onSuccess={onSuccess}
      />

      <PericiaObservacoesDialog
        pericia={pericia}
        open={showObs}
        onOpenChange={setShowObs}
        onSuccess={onSuccess}
      />
    </>
  );
}

export const columns: ColumnDef<Pericia>[] = [
  {
    accessorKey: 'numeroProcesso',
    header: 'Processo',
    meta: { align: 'left' as const },
    cell: ({ row }) => {
      const p = row.original;
      const nomeParteAutora = p.processo?.nomeParteAutora || '-';
      const nomeParteRe = p.processo?.nomeParteRe || '-';

      return (
        <div className="flex flex-col gap-1 items-start leading-relaxed min-w-0">
          {/* Linha 1: Número do processo */}
          <span className="text-xs font-bold leading-relaxed truncate max-w-full" title={p.numeroProcesso}>
            {p.numeroProcesso}
          </span>

          {/* Linha 2: TRT e Grau */}
          <div className="text-xs text-muted-foreground">
            {p.trt} • {p.grau}
          </div>

          {/* Partes com badges de polo (nome dentro do badge) */}
          {/* FONTE DA VERDADE: Usar nomes do 1º grau para evitar inversão por recursos */}
          <div className="flex flex-col gap-0.5 w-full">
            {/* Polo Ativo (Autor) - nome dentro do badge */}
            <div className="flex items-center gap-1 text-xs leading-relaxed">
              <ParteBadge polo="ATIVO" className="text-xs px-1.5 py-0.5">
                {nomeParteAutora}
              </ParteBadge>
            </div>
            {/* Polo Passivo (Réu) - nome dentro do badge */}
            <div className="flex items-center gap-1 text-xs leading-relaxed">
              <ParteBadge polo="PASSIVO" className="text-xs px-1.5 py-0.5">
                {nomeParteRe}
              </ParteBadge>
            </div>
          </div>
        </div>
      );
    },
    size: 280,
  },
  {
    accessorKey: 'especialidade',
    header: 'Especialidade',
    meta: { align: 'left' as const },
    cell: ({ row }) => (
      <div className="max-w-60 truncate">
        {row.original.especialidade?.descricao || '-'}
      </div>
    ),
    size: 240,
  },
  {
    accessorKey: 'perito',
    header: 'Perito',
    meta: { align: 'left' as const },
    cell: ({ row }) => (
      <div className="max-w-50 truncate">{row.original.perito?.nome || '-'}</div>
    ),
    size: 200,
  },
  {
    accessorKey: 'situacaoCodigo',
    header: 'Situação',
    cell: ({ row }) => {
      const situacao = row.original.situacaoCodigo;
      return (
        <AppBadge variant={getSituacaoVariant(situacao)}>
          {SITUACAO_PERICIA_LABELS[situacao]}
        </AppBadge>
      );
    },
    size: 160,
  },
  {
    accessorKey: 'prazoEntrega',
    header: 'Prazo Entrega',
    cell: ({ row }) => {
      const prazo = row.original.prazoEntrega;
      if (!prazo) return <span className="text-muted-foreground">-</span>;

      const vencido = isVencido(prazo) && !row.original.laudoJuntado;
      return (
        <div className={vencido ? 'text-destructive font-semibold' : ''}>
          {formatarDataCurta(prazo)}
        </div>
      );
    },
    size: 130,
  },
  {
    accessorKey: 'responsavelId',
    header: 'Responsável',
    meta: { align: 'left' as const },
    cell: ({ row }) => (
      <div className="flex items-center gap-2 min-w-0">
        <User className="h-4 w-4 text-muted-foreground shrink-0" />
        <span className="truncate">
          {row.original.responsavel?.nomeExibicao || 'Sem responsável'}
        </span>
      </div>
    ),
    size: 200,
  },
  {
    id: 'actions',
    header: () => <span className="text-center block">Ações</span>,
    cell: ({ row, table }) => {
      const meta = table.options.meta as PericiasTableMeta | undefined;
      return (
        <ActionsCell
          pericia={row.original}
          usuarios={meta?.usuarios || []}
          onSuccess={meta?.onSuccess}
        />
      );
    },
    size: 80,
  },
];


