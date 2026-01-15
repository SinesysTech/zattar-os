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

/**
 * Badge composto para Tribunal + Grau
 * Metade esquerda mostra o TRT (azul), metade direita mostra o Grau (cor por nível)
 * Padrão consistente com audiências e expedientes
 */
function TribunalGrauBadge({ trt, grau }: { trt: string; grau: GrauTribunal }) {
  const grauLabel = GRAU_TRIBUNAL_LABELS[grau] || grau;

  // Classes de cor baseadas no grau
  const grauColorClasses: Record<GrauTribunal, string> = {
    primeiro_grau: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
    segundo_grau: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
    tribunal_superior: 'bg-violet-500/15 text-violet-700 dark:text-violet-400',
  };

  return (
    <div className="inline-flex items-center text-xs font-medium shrink-0">
      {/* Tribunal (lado esquerdo - azul, arredondado à esquerda) */}
      <span className="bg-sky-500/15 text-sky-700 dark:text-sky-400 px-2 py-0.5 rounded-l-full">
        {trt}
      </span>
      {/* Grau (lado direito - cor baseada no grau, arredondado à direita) */}
      <span className={cn(
        'px-2 py-0.5 border-l border-background/50 rounded-r-full',
        grauColorClasses[grau] || 'bg-muted text-muted-foreground'
      )}>
        {grauLabel}
      </span>
    </div>
  );
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
  // Coluna 1: Prazo (composta: data do prazo + situação)
  {
    id: 'prazo',
    accessorKey: 'prazoEntrega',
    header: 'Prazo',
    meta: { align: 'left' as const },
    cell: ({ row }) => {
      const p = row.original;
      const prazo = p.prazoEntrega;
      const situacao = p.situacaoCodigo;
      const vencido = prazo && isVencido(prazo) && !p.laudoJuntado;

      return (
        <div className="flex flex-col gap-1 items-start">
          {/* Data do prazo */}
          <span className={cn(
            'text-sm font-medium',
            vencido && 'text-destructive font-semibold'
          )}>
            {prazo ? formatarDataCurta(prazo) : '-'}
          </span>
          {/* Status/Situação */}
          <AppBadge variant={getSituacaoVariant(situacao)}>
            {SITUACAO_PERICIA_LABELS[situacao]}
          </AppBadge>
        </div>
      );
    },
    size: 160,
  },
  // Coluna 2: Processo (padrão consistente com audiências/expedientes)
  {
    accessorKey: 'numeroProcesso',
    header: 'Processo',
    meta: { align: 'left' as const },
    cell: ({ row }) => {
      const p = row.original;
      const nomeParteAutora = p.processo?.nomeParteAutora || '-';
      const nomeParteRe = p.processo?.nomeParteRe || '-';

      return (
        <div className="flex flex-col gap-0.5 items-start leading-relaxed min-w-0">
          {/* Linha 1: Badge Tribunal + Grau */}
          <TribunalGrauBadge trt={p.trt} grau={p.grau} />

          {/* Linha 2: Número do processo */}
          <span className="text-xs font-bold leading-relaxed" title={p.numeroProcesso}>
            {p.numeroProcesso}
          </span>

          {/* Partes com badges de polo (nome dentro do badge) */}
          {/* FONTE DA VERDADE: Usar nomes do 1º grau para evitar inversão por recursos */}
          <div className="flex flex-col gap-0.5">
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
  // Coluna 3: Especialidade
  {
    accessorKey: 'especialidade',
    header: 'Especialidade',
    meta: { align: 'left' as const },
    cell: ({ row }) => (
      <div className="max-w-60 truncate">
        {row.original.especialidade?.descricao || '-'}
      </div>
    ),
    size: 200,
  },
  // Coluna 4: Perito
  {
    accessorKey: 'perito',
    header: 'Perito',
    meta: { align: 'left' as const },
    cell: ({ row }) => (
      <div className="max-w-50 truncate">{row.original.perito?.nome || '-'}</div>
    ),
    size: 180,
  },
  // Coluna 5: Responsável
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
    size: 180,
  },
  // Coluna 6: Ações
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


