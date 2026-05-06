'use client';

/**
 * ContratosGlassCards — Grid view de contratos (estética "EntityCard").
 * ============================================================================
 * Tipografia via classes canônicas (.text-label, .text-caption, .text-meta-label,
 * .text-micro-badge, .text-micro-caption). Avatar fallback via
 * `generateAvatarFallback` (src/lib/utils.ts).
 * ============================================================================
 */

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Scale,
  Clock,
  Eye,
  Pencil,
  Trash2,
  FileSignature,
  FileText,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { generateAvatarFallback } from '@/lib/avatar-url';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { SemanticBadge } from '@/components/ui/semantic-badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/typography';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { GlassPanel } from '@/components/shared/glass-panel';
import { timeAgo } from '@/components/dashboard/entity-card';

import type { Contrato } from '../domain';
import {
  TIPO_CONTRATO_LABELS,
  TIPO_COBRANCA_LABELS,
  STATUS_CONTRATO_LABELS,
  isTipoParteContraria,
} from '../domain';
import type { ClienteInfo } from '../types';
import { formatarData } from '../utils';
import { ContratoAlterarResponsavelDialog } from './contrato-alterar-responsavel-dialog';

// =============================================================================
// TYPES
// =============================================================================

export interface ContratosGlassCardsProps {
  contratos: Contrato[];
  isLoading: boolean;
  clientesMap: Map<number, ClienteInfo>;
  partesContrariasMap: Map<number, ClienteInfo>;
  usuariosMap: Map<number, ClienteInfo>;
  segmentosMap: Map<number, { nome: string }>;
  usuarios: ClienteInfo[];
  selectedIds: Set<number>;
  onToggleSelect: (id: number) => void;
  onEdit: (contrato: Contrato) => void;
  onDelete: (contrato: Contrato) => void;
  onGerarPeca: (contrato: Contrato) => void;
  onResponsavelChanged: () => void;
}

// =============================================================================
// HELPERS
// =============================================================================


// =============================================================================
// HELPERS
// =============================================================================

function getStatusDate(contrato: Contrato): string {
  const historico = contrato.statusHistorico ?? [];
  const entry = [...historico]
    .filter((h) => h.toStatus === contrato.status)
    .sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime())[0];
  return entry?.changedAt ?? contrato.cadastradoEm ?? '';
}

// =============================================================================
// RESPONSÁVEL
// =============================================================================

function ResponsavelChip({
  contrato,
  usuariosMap,
  usuarios,
  onChanged,
}: {
  contrato: Contrato;
  usuariosMap: Map<number, ClienteInfo>;
  usuarios: ClienteInfo[];
  onChanged: () => void;
}) {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const usuario = contrato.responsavelId ? usuariosMap.get(contrato.responsavelId) ?? null : null;
  const nome = usuario?.nome ?? null;

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setDialogOpen(true);
        }}
        className={cn(/* design-system-escape: -mx-1 sem equivalente DS; px-1 padding direcional sem Inset equiv.; py-0.5 padding direcional sem Inset equiv. */ "inline-flex items-center inline-snug min-w-0 rounded-lg -mx-1 px-1 py-0.5 transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer")}
        title={nome ? `Alterar responsável: ${nome}` : 'Atribuir responsável'}
      >
        {nome ? (
          <>
            <Avatar className="size-5 shrink-0">
              <AvatarImage src={usuario?.avatarUrl || undefined} alt={nome} />
              <AvatarFallback>
                <Text variant="micro-badge">{generateAvatarFallback(nome)}</Text>
              </AvatarFallback>
            </Avatar>
            <span className="text-micro-caption text-muted-foreground/80 truncate">
              {nome}
            </span>
          </>
        ) : (
          <span className="text-micro-caption text-destructive/70 italic">
            Sem responsável
          </span>
        )}
      </button>
      <ContratoAlterarResponsavelDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        contrato={contrato}
        usuarios={usuarios}
        onSuccess={onChanged}
      />
    </>
  );
}

// =============================================================================
// ACTIONS (hover)
// =============================================================================

function CardActions({
  contrato,
  onEdit,
  onDelete,
  onGerarPeca,
}: {
  contrato: Contrato;
  onEdit: (c: Contrato) => void;
  onDelete: (c: Contrato) => void;
  onGerarPeca: (c: Contrato) => void;
}) {
  return (
    <div
      className={cn("flex items-center inline-nano")}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Visualizar" className="size-6" asChild>
            <Link href={`/app/contratos/${contrato.id}`}>
              <Eye className="size-3" />
            </Link>
          </Button>
        </TooltipTrigger>
        <TooltipContent>Visualizar</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Editar"
            className="size-6"
            onClick={() => onEdit(contrato)}
          >
            <Pencil className="size-3" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Editar</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Gerar peça"
            className="size-6"
            onClick={() => onGerarPeca(contrato)}
          >
            <FileSignature className="size-3" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Gerar peça</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Excluir"
            className="size-6 text-muted-foreground hover:text-destructive"
            onClick={() => onDelete(contrato)}
          >
            <Trash2 className="size-3" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Excluir</TooltipContent>
      </Tooltip>
    </div>
  );
}

// =============================================================================
// GLASS CARD (individual)
// =============================================================================

function GlassCard({
  contrato,
  clientesMap,
  partesContrariasMap,
  usuariosMap,
  segmentosMap,
  usuarios,
  isSelected,
  onToggleSelect,
  onEdit,
  onDelete,
  onGerarPeca,
  onResponsavelChanged,
}: {
  contrato: Contrato;
  clientesMap: Map<number, ClienteInfo>;
  partesContrariasMap: Map<number, ClienteInfo>;
  usuariosMap: Map<number, ClienteInfo>;
  segmentosMap: Map<number, { nome: string }>;
  usuarios: ClienteInfo[];
  isSelected: boolean;
  onToggleSelect: () => void;
  onEdit: (c: Contrato) => void;
  onDelete: (c: Contrato) => void;
  onGerarPeca: (c: Contrato) => void;
  onResponsavelChanged: () => void;
}) {
  const router = useRouter();

  const clienteInfo = clientesMap.get(contrato.clienteId);
  const clienteNome = clienteInfo?.nome ?? `Cliente #${contrato.clienteId}`;

  const partesContrarias = (contrato.partes ?? []).filter(
    (p) => isTipoParteContraria(p.tipoEntidade),
  );
  const parteContrariaNome = (() => {
    if (partesContrarias.length === 0) return null;
    const p = partesContrarias[0];
    return (
      p.nomeSnapshot ||
      partesContrariasMap.get(p.entidadeId)?.nome ||
      `Parte Contrária #${p.entidadeId}`
    );
  })();

  const segmentoNome = contrato.segmentoId
    ? segmentosMap.get(contrato.segmentoId)?.nome ?? null
    : null;

  const processos = contrato.processos ?? [];
  const firstProcesso = processos[0];
  const processosRestantes = Math.max(0, processos.length - 1);

  const handleClick = () => router.push(`/app/contratos/${contrato.id}`);

  return (
    <GlassPanel
      className={cn(
        'group relative inset-card-compact cursor-pointer transition-all duration-180',
        'hover:border-border/40 hover:shadow-[0_4px_14px_color-mix(in_oklch,var(--foreground)_6%,transparent)] hover:-translate-y-px',
        isSelected && 'border-primary/40 ring-1 ring-primary/20',
      )}
    >
      <button
        type="button"
        onClick={handleClick}
        aria-label={`Ver contrato de ${clienteNome}`}
        className="absolute inset-0 rounded-[inherit] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />

      {/* Header: checkbox + nomes + badges tipo (top-right) */}
      <div className="relative flex items-start gap-2.5">
        <div
          className="pt-1"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <Checkbox
            checked={isSelected}
            onCheckedChange={onToggleSelect}
            aria-label={`Selecionar contrato ${contrato.id}`}
            className="size-3.5"
          />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-semibold text-foreground truncate leading-tight">
            {clienteNome}
          </p>
          {parteContrariaNome && (
            <p className="truncate mt-0.5 text-micro-caption text-muted-foreground/55">
              <span className="text-muted-foreground/40">vs. </span>
              {parteContrariaNome}
              {partesContrarias.length > 1 && (
                <span className="text-muted-foreground/40"> e outros</span>
              )}
            </p>
          )}
        </div>

        {/* Tipo + cobrança — canto superior direito */}
        <div className="flex flex-col items-end gap-1 shrink-0">
          <SemanticBadge category="tipo_contrato" value={contrato.tipoContrato}>
            {TIPO_CONTRATO_LABELS[contrato.tipoContrato]}
          </SemanticBadge>
          <SemanticBadge category="tipo_cobranca" value={contrato.tipoCobranca}>
            {TIPO_COBRANCA_LABELS[contrato.tipoCobranca]}
          </SemanticBadge>
        </div>
      </div>

      {/* Status + data + segmento */}
      <div className="relative mt-2.5 flex items-start justify-between gap-2">
        <div className="flex flex-col items-start gap-0.5">
          <SemanticBadge category="status_contrato" value={contrato.status}>
            {STATUS_CONTRATO_LABELS[contrato.status]}
          </SemanticBadge>
          <span className="text-micro-caption tabular-nums text-muted-foreground/60 px-0.5">
            {formatarData(getStatusDate(contrato))}
          </span>
        </div>
        {segmentoNome && (
          <Text
            variant="micro-badge"
            className="inline-flex items-center font-medium text-muted-foreground/65 bg-muted/50 border border-border/50 rounded px-1.5 py-0.5 mt-0.5"
          >
            {segmentoNome}
          </Text>
        )}
      </div>

      {/* Processos vinculados */}
      <div className={cn(/* design-system-escape: pt-3 padding direcional sem Inset equiv. */ "relative mt-3 pt-3 border-t border-border/20")}>
        <div className={cn("flex items-center inline-snug mb-1.5")}>
          <Scale className="size-3 text-muted-foreground/70" />
          <Text variant="micro-caption" className={cn( "font-medium text-muted-foreground/70")}>
            {processos.length === 0
              ? 'Sem processos vinculados'
              : `${processos.length} ${processos.length === 1 ? 'processo' : 'processos'}`}
          </Text>
        </div>
        {firstProcesso && firstProcesso.processo && (
          <div className={cn("flex flex-wrap items-center inline-micro")}>
            <Link
              href={`/app/processos/${firstProcesso.processoId}`}
              onClick={(e) => e.stopPropagation()}
              className={cn(/* design-system-escape: px-1.5 padding direcional sem Inset equiv.; py-0.5 padding direcional sem Inset equiv. */ "inline-flex items-center inline-micro px-1.5 py-0.5 rounded bg-primary/5 text-primary border border-primary/15 hover:bg-primary/10 transition-colors")}
            >
              <Text variant="micro-caption" className="tabular-nums text-primary">
                {firstProcesso.processo.numeroProcesso ??
                  `Processo #${firstProcesso.processoId}`}
              </Text>
            </Link>
            {processosRestantes > 0 && (
              <Text variant="micro-caption">+{processosRestantes}</Text>
            )}
          </div>
        )}
      </div>

      {/* Rodapé: responsável + cadastro + ações */}
      <div className={cn(/* design-system-escape: pt-3 padding direcional sem Inset equiv. */ "relative mt-3 pt-3 border-t border-border/20 flex items-center justify-between inline-tight")}>
        <ResponsavelChip
          contrato={contrato}
          usuariosMap={usuariosMap}
          usuarios={usuarios}
          onChanged={onResponsavelChanged}
        />
        <div className={cn("flex items-center inline-snug")}>
          <div className={cn("inline-flex items-center inline-micro text-muted-foreground/60")}>
            <Clock className="size-2.5" />
            <Text variant="micro-caption">{timeAgo(contrato.cadastradoEm)}</Text>
          </div>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <CardActions
              contrato={contrato}
              onEdit={onEdit}
              onDelete={onDelete}
              onGerarPeca={onGerarPeca}
            />
          </div>
        </div>
      </div>
    </GlassPanel>
  );
}

// =============================================================================
// SKELETON
// =============================================================================

function CardSkeleton() {
  return (
    <GlassPanel className={cn("inset-card-compact")}>
      <div className={cn(/* design-system-escape: gap-2.5 gap sem token DS */ "flex items-start gap-2.5")}>
        <Skeleton className="size-3.5 rounded" />
        <Skeleton className="size-9 rounded-xl" />
        <div className={cn("flex-1 stack-tight")}>
          <Skeleton className="h-3 w-3/4" />
          <Skeleton className="h-2.5 w-1/2" />
          <Skeleton className="h-4 w-24 rounded" />
        </div>
      </div>
      <div className={cn("flex inline-micro mt-3")}>
        <Skeleton className="h-4 w-16 rounded" />
        <Skeleton className="h-4 w-14 rounded" />
        <Skeleton className="h-4 w-20 rounded" />
      </div>
      <div className={cn(/* design-system-escape: pt-3 padding direcional sem Inset equiv. */ "mt-3 pt-3 border-t border-border/20 stack-tight")}>
        <Skeleton className="h-2 w-32" />
        <Skeleton className="h-4 w-40 rounded" />
      </div>
      <div className={cn(/* design-system-escape: pt-3 padding direcional sem Inset equiv. */ "mt-3 pt-3 border-t border-border/20 flex justify-between")}>
        <Skeleton className="h-4 w-24 rounded" />
        <Skeleton className="h-3 w-12" />
      </div>
    </GlassPanel>
  );
}

// =============================================================================
// EMPTY STATE
// =============================================================================

function EmptyState() {
  return (
    <div className={cn(/* design-system-escape: py-16 padding direcional sem Inset equiv. */ "col-span-full flex flex-col items-center justify-center py-16 opacity-60")}>
      <FileText className="w-10 h-10 text-muted-foreground/55 mb-4" />
      <Text variant="label" className="text-muted-foreground/60">
        Nenhum contrato encontrado
      </Text>
      <Text variant="caption" className="text-muted-foreground/65 mt-1">
        Tente ajustar os filtros ou cadastre um novo contrato
      </Text>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function ContratosGlassCards({
  contratos,
  isLoading,
  clientesMap,
  partesContrariasMap,
  usuariosMap,
  segmentosMap,
  usuarios,
  selectedIds,
  onToggleSelect,
  onEdit,
  onDelete,
  onGerarPeca,
  onResponsavelChanged,
}: ContratosGlassCardsProps) {
  if (isLoading) {
    return (
      <div className={cn("grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 inline-medium")}>
        {Array.from({ length: 6 }, (_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (contratos.length === 0) {
    return (
      <div className="grid grid-cols-1">
        <EmptyState />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className={cn("grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 inline-medium")}>
        {contratos.map((contrato) => (
          <GlassCard
            key={contrato.id}
            contrato={contrato}
            clientesMap={clientesMap}
            partesContrariasMap={partesContrariasMap}
            usuariosMap={usuariosMap}
            segmentosMap={segmentosMap}
            usuarios={usuarios}
            isSelected={selectedIds.has(contrato.id)}
            onToggleSelect={() => onToggleSelect(contrato.id)}
            onEdit={onEdit}
            onDelete={onDelete}
            onGerarPeca={onGerarPeca}
            onResponsavelChanged={onResponsavelChanged}
          />
        ))}
      </div>
    </TooltipProvider>
  );
}
