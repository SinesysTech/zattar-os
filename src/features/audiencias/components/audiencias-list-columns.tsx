'use client';

import * as React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Eye, Pencil } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { DataTableColumnHeader } from '@/components/shared/data-shell/data-table-column-header';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { ParteBadge } from '@/components/ui/parte-badge';

import type { Audiencia, GrauTribunal } from '../domain';
import { GRAU_TRIBUNAL_LABELS } from '../domain';
import { AudienciaStatusBadge } from './audiencia-status-badge';
import { AudienciaModalidadeBadge } from './audiencia-modalidade-badge';
import { AudienciasAlterarResponsavelDialog } from './audiencias-alterar-responsavel-dialog';

// =============================================================================
// HELPER COMPONENTS
// =============================================================================

/**
 * Badge composto para Tribunal + Grau
 * Metade esquerda mostra o TRT (azul), metade direita mostra o Grau (cor por nível)
 * Baseado no padrão de expedientes
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

// Types
export interface AudienciaComResponsavel extends Audiencia {
  responsavelNome?: string | null;
  responsavelAvatar?: string | null;
}

interface Usuario {
  id: number;
  nomeExibicao?: string;
  nomeCompleto?: string;
}

// =============================================================================
// RESPONSÁVEL CELL - Edição inline
// =============================================================================

function getUsuarioNome(u: Usuario): string {
  return u.nomeExibicao || u.nomeCompleto || `Usuário ${u.id}`;
}

export function ResponsavelCell({
  audiencia,
  usuarios = [],
  onSuccess,
}: {
  audiencia: AudienciaComResponsavel;
  usuarios?: Usuario[];
  onSuccess?: () => void;
}) {
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const responsavel = usuarios.find((u) => u.id === audiencia.responsavelId);
  const nomeExibicao = responsavel ? getUsuarioNome(responsavel) : audiencia.responsavelNome || '-';

  return (
    <>
      <button
        type="button"
        onClick={() => setIsDialogOpen(true)}
        className="flex items-center justify-start gap-2 text-sm w-full min-w-0 hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 rounded px-1 -mx-1"
        title={nomeExibicao !== '-' ? `Clique para alterar responsável: ${nomeExibicao}` : 'Clique para atribuir responsável'}
      >
        {responsavel || audiencia.responsavelId ? (
          <>
            <Avatar className="h-7 w-7 shrink-0">
              <AvatarImage src={undefined} alt={nomeExibicao} />
              <AvatarFallback className="text-xs font-medium">
                {getInitials(nomeExibicao)}
              </AvatarFallback>
            </Avatar>
            <span className="truncate max-w-[120px]">{nomeExibicao}</span>
          </>
        ) : (
          <span className="text-muted-foreground">Sem responsável</span>
        )}
      </button>

      <AudienciasAlterarResponsavelDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        audiencia={audiencia}
        usuarios={usuarios}
        onSuccess={() => {
          onSuccess?.();
        }}
      />
    </>
  );
}

// Actions Component
function AudienciaActions({
  audiencia,
  onView,
  onEdit,
}: {
  audiencia: AudienciaComResponsavel;
  onView: (audiencia: AudienciaComResponsavel) => void;
  onEdit: (audiencia: AudienciaComResponsavel) => void;
}) {
  return (
    <ButtonGroup>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onView(audiencia)}
          >
            <Eye className="h-4 w-4" />
            <span className="sr-only">Visualizar audiência</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>Visualizar</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onEdit(audiencia)}
          >
            <Pencil className="h-4 w-4" />
            <span className="sr-only">Editar audiência</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>Editar</TooltipContent>
      </Tooltip>
    </ButtonGroup>
  );
}

// Helper functions
function formatarDataHora(dataISO: string): string {
  try {
    const data = new Date(dataISO);
    return format(data, 'dd/MM/yyyy HH:mm', { locale: ptBR });
  } catch {
    return '-';
  }
}

function getInitials(name: string | null | undefined): string {
  if (!name) return 'SR';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Factory function for columns
export function getAudienciasColumns(
  onView: (audiencia: AudienciaComResponsavel) => void,
  onEdit: (audiencia: AudienciaComResponsavel) => void
): ColumnDef<AudienciaComResponsavel>[] {
  return [
    {
      accessorKey: 'dataInicio',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Data/Hora" />
      ),
      meta: {
        align: 'left' as const,
        headerLabel: 'Data/Hora',
      },
      size: 160,
      cell: ({ row }) => {
        const audiencia = row.original;
        return (
          <div className="flex flex-col gap-1">
            <span className="font-medium">
              {formatarDataHora(audiencia.dataInicio)}
            </span>
            {audiencia.status && (
              <AudienciaStatusBadge status={audiencia.status} />
            )}
          </div>
        );
      },
      enableSorting: true,
    },
    // Coluna composta: Processo (igual ao padrão de Expedientes)
    {
      id: 'processo',
      accessorKey: 'numeroProcesso',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Processo" />
      ),
      meta: {
        align: 'left' as const,
        headerLabel: 'Processo',
      },
      size: 260,
      cell: ({ row }) => {
        const a = row.original;
        return (
          <div className="flex flex-col gap-0.5 items-start leading-relaxed">
            {/* Linha 1: Badge Tribunal + Grau */}
            <TribunalGrauBadge trt={a.trt} grau={a.grau} />

            {/* Linha 2: Número do processo */}
            <span className="text-xs font-bold leading-relaxed" title={a.numeroProcesso}>
              {a.numeroProcesso}
            </span>

            {/* Linha 3: Tipo de audiência (se disponível) */}
            {a.tipoDescricao && (
              <span className="text-xs text-muted-foreground leading-relaxed" title={a.tipoDescricao}>
                {a.tipoDescricao}
              </span>
            )}

            {/* Partes com badges de polo (nome dentro do badge) */}
            {/* FONTE DA VERDADE: Usar nomes do 1º grau para evitar inversão por recursos */}
            <div className="flex flex-col gap-0.5">
              {/* Polo Ativo (Autor) - nome dentro do badge */}
              <div className="flex items-center gap-1 text-xs leading-relaxed">
                <ParteBadge polo="ATIVO" className="text-xs px-1.5 py-0.5">
                  {a.poloAtivoOrigem || a.poloAtivoNome || '-'}
                </ParteBadge>
              </div>
              {/* Polo Passivo (Réu) - nome dentro do badge */}
              <div className="flex items-center gap-1 text-xs leading-relaxed">
                <ParteBadge polo="PASSIVO" className="text-xs px-1.5 py-0.5">
                  {a.poloPassivoOrigem || a.poloPassivoNome || '-'}
                </ParteBadge>
              </div>
            </div>
          </div>
        );
      },
      enableSorting: true,
    },
    {
      accessorKey: 'tipoDescricao',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Tipo" />
      ),
      meta: {
        align: 'left' as const,
        headerLabel: 'Tipo',
      },
      size: 180,
      cell: ({ row }) => {
        const audiencia = row.original;
        return (
          <span className="text-sm">
            {audiencia.tipoDescricao || 'Não informado'}
          </span>
        );
      },
      enableSorting: true,
    },
    {
      accessorKey: 'modalidade',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Modalidade" />
      ),
      meta: {
        align: 'center' as const,
        headerLabel: 'Modalidade',
      },
      size: 120,
      cell: ({ row }) => {
        const audiencia = row.original;
        return audiencia.modalidade ? (
          <div className="flex justify-center">
            <AudienciaModalidadeBadge modalidade={audiencia.modalidade} />
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">-</span>
        );
      },
      enableSorting: true,
    },
    {
      id: 'responsavel',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Responsável" />
      ),
      meta: {
        align: 'left' as const,
        headerLabel: 'Responsável',
      },
      size: 180,
      cell: ({ row, table }) => {
        const audiencia = row.original;
        const meta = table.options.meta as { usuarios?: Usuario[]; onSuccess?: () => void } | undefined;
        const usuarios = meta?.usuarios || [];
        const onSuccess = meta?.onSuccess;

        return (
          <ResponsavelCell
            audiencia={audiencia}
            usuarios={usuarios}
            onSuccess={onSuccess}
          />
        );
      },
      enableSorting: false,
    },
    {
      id: 'actions',
      header: 'Ações',
      meta: {
        align: 'center' as const,
        headerLabel: 'Ações',
      },
      size: 100,
      cell: ({ row }) => (
        <div className="flex items-center justify-center">
          <AudienciaActions
            audiencia={row.original}
            onView={onView}
            onEdit={onEdit}
          />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
    },
  ];
}
