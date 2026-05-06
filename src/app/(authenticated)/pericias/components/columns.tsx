'use client';

import * as React from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Eye, MessageSquareText } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import { AppBadge } from '@/components/ui/app-badge';
import { ParteBadge } from '@/components/ui/parte-badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { DataTableColumnHeader } from '@/components/shared/data-shell/data-table-column-header';
import { cn } from '@/lib/utils';
import { getSemanticBadgeVariant } from '@/lib/design-system';

import type { GrauTribunal, Pericia, UsuarioOption } from '../domain';
import { SITUACAO_PERICIA_LABELS } from '../domain';
import { GRAU_TRIBUNAL_LABELS } from '@/app/(authenticated)/expedientes';
import { PericiaDetalhesDialog } from './pericia-detalhes-dialog';
import { PericiaAtribuirResponsavelDialog } from './pericia-atribuir-responsavel-dialog';
import { PericiaObservacoesDialog } from './pericia-observacoes-dialog';
import { Text } from '@/components/ui/typography';

export interface PericiasTableMeta {
  usuarios: UsuarioOption[];
  onSuccess?: () => void;
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
    primeiro_grau: 'bg-success/15 text-success',
    segundo_grau: 'bg-warning/15 text-warning',
    tribunal_superior: 'bg-primary/15 text-primary',
  };

  return (
    <Text variant="caption" className="inline-flex items-center font-medium shrink-0">
      {/* Tribunal (lado esquerdo - azul, arredondado à esquerda) */}
      <span className={cn(/* design-system-escape: px-2 padding direcional sem Inset equiv.; py-0.5 padding direcional sem Inset equiv. */ "bg-info/15 text-info px-2 py-0.5 rounded-l-full")}>
        {trt}
      </span>
      {/* Grau (lado direito - cor baseada no grau, arredondado à direita) */}
      <span className={cn(
        /* design-system-escape: px-2 padding direcional sem Inset equiv.; py-0.5 padding direcional sem Inset equiv. */ 'px-2 py-0.5 border-l border-background/50 rounded-r-full',
        grauColorClasses[grau] || 'bg-muted text-muted-foreground'
      )}>
        {grauLabel}
      </span>
    </Text>
  );
}

function getInitials(name: string | null | undefined): string {
  if (!name) return 'SR';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function ResponsavelCell({
  pericia,
  usuarios = [],
  onSuccess,
}: {
  pericia: Pericia;
  usuarios?: UsuarioOption[];
  onSuccess?: () => void;
}) {
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const responsavel = usuarios.find((u) => u.id === pericia.responsavelId);
  const nomeExibicao = responsavel
    ? (responsavel.nomeExibicao || responsavel.nome_exibicao || responsavel.nome || `Usuário ${responsavel.id}`)
    : pericia.responsavel?.nomeExibicao || '-';

  return (
    <>
      <button
        type="button"
        onClick={() => setIsDialogOpen(true)}
        className={cn(/* design-system-escape: px-1 padding direcional sem Inset equiv.; -mx-1 sem equivalente DS */ "flex items-center justify-start inline-tight text-body-sm w-full min-w-0 hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 rounded px-1 -mx-1 cursor-pointer")}
        title={nomeExibicao !== '-' ? `Clique para alterar responsável: ${nomeExibicao}` : 'Clique para atribuir responsável'}
      >
        {responsavel || pericia.responsavelId ? (
          <>
            <Avatar size="sm">
              <AvatarImage src={responsavel?.avatarUrl || undefined} alt={nomeExibicao} />
              <AvatarFallback className={cn( "text-[10px] font-medium")}>
                {getInitials(nomeExibicao)}
              </AvatarFallback>
            </Avatar>
            <span className="truncate">{nomeExibicao}</span>
          </>
        ) : (
          <span className="text-muted-foreground">Sem responsável</span>
        )}
      </button>

      <PericiaAtribuirResponsavelDialog
        pericia={pericia}
        usuarios={usuarios}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSuccess={onSuccess}
      />
    </>
  );
}

function ActionsCell({
  pericia,
  onSuccess,
}: {
  pericia: Pericia;
  onSuccess?: () => void;
}) {
  const [showDetalhes, setShowDetalhes] = React.useState(false);
  const [showObs, setShowObs] = React.useState(false);

  return (
    <>
      <ButtonGroup>
        {/* Visualizar */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon" aria-label="Ver detalhes"
              className="h-8 w-8"
              onClick={() => setShowDetalhes(true)}
            >
              <Eye className="h-4 w-4" />
              <span className="sr-only">Ver detalhes</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Ver detalhes</TooltipContent>
        </Tooltip>

        {/* Observações */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon" aria-label="Observações"
              className="h-8 w-8"
              onClick={() => setShowObs(true)}
            >
              <MessageSquareText className="h-4 w-4" />
              <span className="sr-only">Observações</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Observações</TooltipContent>
        </Tooltip>
      </ButtonGroup>

      <PericiaDetalhesDialog
        pericia={pericia}
        open={showDetalhes}
        onOpenChange={setShowDetalhes}
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
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Prazo" />
    ),
    meta: {
      align: 'left' as const,
      headerLabel: 'Prazo',
    },
    cell: ({ row }) => {
      const p = row.original;
      const prazo = p.prazoEntrega;
      const situacao = p.situacaoCodigo;
      const vencido = prazo && isVencido(prazo) && !p.laudoJuntado;

      return (
        <div className={cn(/* design-system-escape: py-2 padding direcional sem Inset equiv. */ "flex flex-col inline-micro items-start py-2")}>
          {/* Data do prazo */}
          <span className={cn(
             'text-body-sm font-medium',
            vencido &&  'text-destructive font-semibold'
          )}>
            {prazo ? formatarDataCurta(prazo) : '-'}
          </span>
          {/* Status/Situação */}
          <AppBadge variant={getSemanticBadgeVariant('pericia_situacao', situacao)}>
            {SITUACAO_PERICIA_LABELS[situacao]}
          </AppBadge>
        </div>
      );
    },
    size: 140,
    enableSorting: true,
  },
  // Coluna 2: Processo (padrão consistente com audiências/expedientes)
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
    cell: ({ row }) => {
      const p = row.original;
      const nomeParteAutora = p.processo?.nomeParteAutora || '-';
      const nomeParteRe = p.processo?.nomeParteRe || '-';

      return (
        <div className={cn(/* design-system-escape: py-2 padding direcional sem Inset equiv. */ "flex flex-col inline-snug items-start py-2 max-w-[min(92vw,20rem)] min-w-0")}>
          {/* Linha 1: Badge Tribunal + Grau */}
          <div className={cn("flex items-center inline-snug flex-wrap")}>
            <TribunalGrauBadge trt={p.trt} grau={p.grau} />
          </div>

          {/* Linha 2: Número do processo */}
          <span className={cn( "text-caption font-mono font-medium text-foreground break-all")} title={p.numeroProcesso}>
            {p.numeroProcesso}
          </span>

          {/* Partes com badges de polo */}
          <div className={cn("flex flex-col inline-nano")}>
            <ParteBadge
              polo="ATIVO"
              className={cn("flex whitespace-normal wrap-break-word text-left font-normal text-caption")}
            >
              {nomeParteAutora}
            </ParteBadge>
            <ParteBadge
              polo="PASSIVO"
              className={cn("flex whitespace-normal wrap-break-word text-left font-normal text-caption")}
            >
              {nomeParteRe}
            </ParteBadge>
          </div>
        </div>
      );
    },
    size: 300,
    enableSorting: true,
  },
  // Coluna 3: Especialidade
  {
    accessorKey: 'especialidade',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Especialidade" />
    ),
    meta: {
      align: 'left' as const,
      headerLabel: 'Especialidade',
    },
    cell: ({ row }) => (
      <div className={cn(/* design-system-escape: py-2 padding direcional sem Inset equiv. */ "flex items-center py-2")}>
        <span className="max-w-60 truncate">
          {row.original.especialidade?.descricao || '-'}
        </span>
      </div>
    ),
    size: 200,
    enableSorting: true,
  },
  // Coluna 4: Perito
  {
    accessorKey: 'perito',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Perito" />
    ),
    meta: {
      align: 'left' as const,
      headerLabel: 'Perito',
    },
    cell: ({ row }) => (
      <div className={cn(/* design-system-escape: py-2 padding direcional sem Inset equiv. */ "flex items-center py-2")}>
        <span className="max-w-50 truncate">{row.original.perito?.nome || '-'}</span>
      </div>
    ),
    size: 180,
    enableSorting: true,
  },
  // Coluna 5: Responsável
  {
    id: 'responsavel',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Responsável" />
    ),
    meta: {
      align: 'left' as const,
      headerLabel: 'Responsável',
    },
    cell: ({ row, table }) => {
      const meta = table.options.meta as PericiasTableMeta | undefined;
      return (
        <div className={cn(/* design-system-escape: py-2 padding direcional sem Inset equiv. */ "flex items-center py-2")}>
          <ResponsavelCell
            pericia={row.original}
            usuarios={meta?.usuarios}
            onSuccess={meta?.onSuccess}
          />
        </div>
      );
    },
    size: 200,
    enableSorting: false,
  },
  // Coluna 6: Ações
  {
    id: 'actions',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Ações" />
    ),
    meta: {
      align: 'left' as const,
      headerLabel: 'Ações',
    },
    cell: ({ row, table }) => {
      const meta = table.options.meta as PericiasTableMeta | undefined;
      return (
        <div className={cn(/* design-system-escape: py-2 padding direcional sem Inset equiv. */ "flex items-center py-2")}>
          <ActionsCell
            pericia={row.original}
            onSuccess={meta?.onSuccess}
          />
        </div>
      );
    },
    size: 100,
    enableSorting: false,
    enableHiding: false,
  },
];


