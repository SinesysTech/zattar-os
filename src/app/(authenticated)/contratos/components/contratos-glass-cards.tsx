'use client';

/**
 * ContratosGlassCards — Grid view de contratos (estética "EntityCard").
 * ============================================================================
 * Complementa `ContratosGlassList` com uma visualização em cartões, seguindo
 * o padrão de partes/entity-card. Cada card condensa: estágio (status), tipo
 * e cobrança, cliente × parte contrária, segmento, processos vinculados,
 * responsável e data — com 4 ações no hover + seleção em massa.
 *
 * Clicar no card navega para `/app/contratos/[id]`.
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { SemanticBadge } from '@/components/ui/semantic-badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { GlassPanel } from '@/components/shared/glass-panel';
import { timeAgo } from '@/components/dashboard/entity-card';

import type { Contrato, StatusContrato } from '../domain';
import {
  TIPO_CONTRATO_LABELS,
  TIPO_COBRANCA_LABELS,
  STATUS_CONTRATO_LABELS,
} from '../domain';
import type { ClienteInfo } from '../types';
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

const STATUS_DOT_COLOR: Record<StatusContrato, string> = {
  em_contratacao: 'bg-warning',
  contratado: 'bg-success',
  distribuido: 'bg-info',
  desistencia: 'bg-destructive',
};

function getInitials(name: string): string {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/).filter((p) => p.length > 1);
  if (parts.length === 0) return name.slice(0, 2).toUpperCase();
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
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
        className="inline-flex items-center gap-1.5 min-w-0 rounded-lg -mx-1 px-1 py-0.5 transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
        title={nome ? `Alterar responsável: ${nome}` : 'Atribuir responsável'}
      >
        {nome ? (
          <>
            <Avatar className="size-5 shrink-0">
              <AvatarImage src={usuario?.avatarUrl || undefined} alt={nome} />
              <AvatarFallback className="text-[9px] font-semibold">
                {getInitials(nome)}
              </AvatarFallback>
            </Avatar>
            <span className="text-[11px] text-muted-foreground/80 truncate">{nome}</span>
          </>
        ) : (
          <span className="text-[11px] text-destructive/70 italic">Sem responsável</span>
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
      className="flex items-center gap-0.5"
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

  // Parte contrária (primeira + contador)
  const partesContrarias = (contrato.partes ?? []).filter(
    (p) => p.tipoEntidade === 'parte_contraria',
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
        'group relative p-4 cursor-pointer transition-all duration-180',
        'hover:border-border/40 hover:shadow-[0_4px_14px_color-mix(in_oklch,var(--foreground)_6%,transparent)] hover:-translate-y-px',
        isSelected && 'border-primary/40 ring-1 ring-primary/20',
      )}
    >
      {/* Clickable overlay */}
      <button
        type="button"
        onClick={handleClick}
        aria-label={`Ver contrato de ${clienteNome}`}
        className="absolute inset-0 rounded-[inherit] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />

      {/* Header: checkbox + avatar + cliente + status */}
      <div className="relative flex items-start gap-2.5">
        <div
          className="pt-0.5"
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

        <div className="size-9 rounded-xl bg-primary/8 flex items-center justify-center shrink-0">
          <span className="text-[10px] font-bold text-primary/70">
            {getInitials(clienteNome)}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className={cn('size-2 rounded-full shrink-0 opacity-80', STATUS_DOT_COLOR[contrato.status])}
            />
            <h3 className="text-[13px] font-semibold text-foreground truncate leading-tight flex-1">
              {clienteNome}
            </h3>
          </div>

          {parteContrariaNome && (
            <p className="text-[11px] text-muted-foreground/70 truncate mt-0.5">
              <span className="text-muted-foreground/50">vs. </span>
              {parteContrariaNome}
              {partesContrarias.length > 1 && (
                <span className="text-muted-foreground/50">
                  {' '}e outros ({partesContrarias.length})
                </span>
              )}
            </p>
          )}

          <div className="mt-1.5 flex items-center gap-1 flex-wrap">
            <SemanticBadge
              category="status_contrato"
              value={contrato.status}
              className="text-[9.5px] px-1.5 py-0"
            >
              {STATUS_CONTRATO_LABELS[contrato.status]}
            </SemanticBadge>
            {contrato.papelClienteNoContrato === 'autora' ? (
              <span className="inline-flex items-center bg-primary/10 border border-primary/20 text-primary rounded px-1 py-px text-[9px] font-semibold">
                Cliente é autor
              </span>
            ) : (
              <span className="inline-flex items-center bg-warning/10 border border-warning/20 text-warning rounded px-1 py-px text-[9px] font-semibold">
                Cliente é réu
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tipo + cobrança + segmento */}
      <div className="relative mt-3 flex flex-wrap items-center gap-1">
        <SemanticBadge
          category="tipo_contrato"
          value={contrato.tipoContrato}
          className="text-[9.5px]"
        >
          {TIPO_CONTRATO_LABELS[contrato.tipoContrato]}
        </SemanticBadge>
        <SemanticBadge
          category="tipo_cobranca"
          value={contrato.tipoCobranca}
          className="text-[9.5px]"
        >
          {TIPO_COBRANCA_LABELS[contrato.tipoCobranca]}
        </SemanticBadge>
        {segmentoNome && (
          <span className="inline-flex items-center text-[9.5px] font-medium text-muted-foreground/70 bg-muted/50 border border-border/30 rounded px-1.5 py-0.5">
            {segmentoNome}
          </span>
        )}
      </div>

      {/* Processos vinculados */}
      <div className="relative mt-3 pt-3 border-t border-border/20">
        <div className="flex items-center gap-1.5 mb-1.5">
          <Scale className="size-3 text-muted-foreground/50" />
          <span className="text-[10px] font-medium text-muted-foreground/70">
            {processos.length === 0
              ? 'Sem processos vinculados'
              : `${processos.length} ${processos.length === 1 ? 'processo' : 'processos'}`}
          </span>
        </div>
        {firstProcesso && firstProcesso.processo && (
          <div className="flex flex-wrap items-center gap-1">
            <Link
              href={`/app/processos/${firstProcesso.processoId}`}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 text-[10px] tabular-nums px-1.5 py-0.5 rounded bg-primary/5 text-primary border border-primary/15 hover:bg-primary/10 transition-colors"
            >
              {firstProcesso.processo.numeroProcesso ??
                `Processo #${firstProcesso.processoId}`}
            </Link>
            {processosRestantes > 0 && (
              <span className="text-[10px] text-muted-foreground/60">
                +{processosRestantes}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Rodapé: responsável + cadastro + ações */}
      <div className="relative mt-3 pt-3 border-t border-border/20 flex items-center justify-between gap-2">
        <ResponsavelChip
          contrato={contrato}
          usuariosMap={usuariosMap}
          usuarios={usuarios}
          onChanged={onResponsavelChanged}
        />
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground/60">
            <Clock className="size-2.5" />
            {timeAgo(contrato.cadastradoEm)}
          </span>
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
    <GlassPanel className="p-4">
      <div className="flex items-start gap-2.5">
        <Skeleton className="size-3.5 rounded" />
        <Skeleton className="size-9 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-3/4" />
          <Skeleton className="h-2.5 w-1/2" />
          <Skeleton className="h-4 w-24 rounded" />
        </div>
      </div>
      <div className="flex gap-1 mt-3">
        <Skeleton className="h-4 w-16 rounded" />
        <Skeleton className="h-4 w-14 rounded" />
        <Skeleton className="h-4 w-20 rounded" />
      </div>
      <div className="mt-3 pt-3 border-t border-border/20 space-y-2">
        <Skeleton className="h-2 w-32" />
        <Skeleton className="h-4 w-40 rounded" />
      </div>
      <div className="mt-3 pt-3 border-t border-border/20 flex justify-between">
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
    <div className="col-span-full flex flex-col items-center justify-center py-16 opacity-60">
      <FileText className="w-10 h-10 text-muted-foreground/30 mb-4" />
      <p className="text-sm font-medium text-muted-foreground/60">
        Nenhum contrato encontrado
      </p>
      <p className="text-xs text-muted-foreground/40 mt-1">
        Tente ajustar os filtros ou cadastre um novo contrato
      </p>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
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
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
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
