'use client';

/**
 * ContratosGlassList — Lista Glass Briefing de contratos.
 * ============================================================================
 * Grid CSS + rows rounded-2xl. Tipografia via classes canônicas (.text-label,
 * .text-caption, .text-meta-label, .text-micro-badge). Avatar fallback via
 * `generateAvatarFallback` (src/lib/utils.ts).
 * ============================================================================
 */

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FileText, Scale, Eye, Pencil, Trash2, FileSignature, Plus } from 'lucide-react';
import { toast } from 'sonner';

import { cn } from '@/lib/utils';
import { generateAvatarFallback } from '@/lib/avatar-url';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { SemanticBadge } from '@/components/ui/semantic-badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/typography';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';

import { actionAlterarResponsavelContrato } from '../actions';
import type { Contrato } from '../domain';
import { TIPO_CONTRATO_LABELS, TIPO_COBRANCA_LABELS, STATUS_CONTRATO_LABELS } from '../domain';
import type { ClienteInfo } from '../types';
import { formatarData } from '../utils';
import { ContratoAlterarResponsavelDialog } from './contrato-alterar-responsavel-dialog';

// =============================================================================
// TYPES
// =============================================================================

export interface ContratosGlassListProps {
  contratos: Contrato[];
  isLoading: boolean;
  clientesMap: Map<number, ClienteInfo>;
  partesContrariasMap: Map<number, ClienteInfo>;
  usuariosMap: Map<number, ClienteInfo>;
  segmentosMap: Map<number, { nome: string }>;
  usuarios: ClienteInfo[];
  selectedIds: Set<number>;
  onToggleSelect: (id: number) => void;
  onToggleSelectAll: () => void;
  onEdit: (contrato: Contrato) => void;
  onDelete: (contrato: Contrato) => void;
  onGerarPeca: (contrato: Contrato) => void;
  onResponsavelChanged: () => void;
}

// =============================================================================
// HELPERS
// =============================================================================

// Extrai a data de entrada no status atual via statusHistorico (audit log).
// Fallback: cadastradoEm quando não há histórico (contrato nunca mudou de status).
function getStatusDate(contrato: Contrato): string {
  const historico = contrato.statusHistorico ?? [];
  const entry = [...historico]
    .filter((h) => h.toStatus === contrato.status)
    .sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime())[0];
  return entry?.changedAt ?? contrato.cadastradoEm ?? '';
}

// 112px para col de status+data: comporta "Em Contratação" (o label mais longo) com folga.
// Valor fixo é obrigatório — cada row é um grid container independente, e `auto`
// resolve para a largura do próprio conteúdo, quebrando o alinhamento entre rows.
// Mobile (4 cols): checkbox | badge-status+data | cliente | ações
// SM     (6 cols): + tipo/cobrança + responsável
// LG     (7 cols): + processos
const GRID_TEMPLATE = cn(
  'grid-cols-[28px_112px_minmax(0,1fr)_88px]',
  'sm:grid-cols-[28px_112px_minmax(0,2fr)_minmax(0,0.9fr)_minmax(0,0.9fr)_100px]',
  'lg:grid-cols-[28px_112px_minmax(0,2.2fr)_minmax(0,0.9fr)_minmax(0,1fr)_minmax(0,0.9fr)_140px]',
);

// =============================================================================
// SELECT-ALL RAIL
// =============================================================================

function SelectAllRail({
  allSelected,
  someSelected,
  onToggleSelectAll,
  visibleCount,
}: {
  allSelected: boolean;
  someSelected: boolean;
  onToggleSelectAll: () => void;
  visibleCount: number;
}) {
  return (
    <div className={cn(/* design-system-escape: px-4 padding direcional sem Inset equiv.; pb-2 padding direcional sem Inset equiv. */ "flex items-center inline-tight px-4 pb-2 text-muted-foreground/70")}>
      <Checkbox
        checked={allSelected ? true : someSelected ? 'indeterminate' : false}
        onCheckedChange={onToggleSelectAll}
        aria-label="Selecionar todos da página"
        className="size-3.5"
      />
      <Text variant="meta-label">Selecionar {visibleCount}</Text>
    </div>
  );
}

// =============================================================================
// ACTIONS CELL
// =============================================================================

function RowActions({
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
      className={cn(/* design-system-escape: gap-0.5 gap sem token DS */ "flex items-center justify-end gap-0.5")}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Visualizar" className="size-7" asChild>
            <Link href={`/app/contratos/${contrato.id}`}>
              <Eye className="size-3.5" />
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
            className="size-7"
            onClick={() => onEdit(contrato)}
          >
            <Pencil className="size-3.5" />
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
            className="size-7"
            onClick={() => onGerarPeca(contrato)}
          >
            <FileSignature className="size-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Gerar Peça</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Excluir"
            className="size-7 text-muted-foreground hover:text-destructive"
            onClick={() => onDelete(contrato)}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Excluir</TooltipContent>
      </Tooltip>
    </div>
  );
}

// =============================================================================
// RESPONSÁVEL CELL
// =============================================================================

function ResponsavelCell({
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

  // Quando já tem responsável: botão abre dialog completo (edit/remover).
  if (nome) {
    return (
      <>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setDialogOpen(true);
          }}
          className={cn(/* design-system-escape: gap-1.5 gap sem token DS; px-1 padding direcional sem Inset equiv.; -mx-1 sem equivalente DS; py-1 padding direcional sem Inset equiv. */ "flex items-center gap-1.5 min-w-0 rounded-lg px-1 -mx-1 py-1 text-left transition-colors hover:bg-muted/40 focus:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer")}
          title={`Alterar responsável: ${nome}`}
        >
          <Avatar className="size-5">
            <AvatarImage src={usuario?.avatarUrl || undefined} alt={nome} />
            <AvatarFallback>
              <Text variant="micro-badge">{generateAvatarFallback(nome)}</Text>
            </AvatarFallback>
          </Avatar>
          <span className="truncate text-micro-caption text-muted-foreground/80">
            {nome}
          </span>
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

  // Sem responsável: botão `+` compacto que abre popover inline com lista de usuários.
  return (
    <ResponsavelAssignPopover
      contratoId={contrato.id}
      usuarios={usuarios}
      onChanged={onChanged}
    />
  );
}

function ResponsavelAssignPopover({
  contratoId,
  usuarios,
  onChanged,
}: {
  contratoId: number;
  usuarios: ClienteInfo[];
  onChanged: () => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();

  const handleSelect = (usuarioId: number) => {
    startTransition(async () => {
      try {
        const result = await actionAlterarResponsavelContrato(contratoId, usuarioId);
        if (result.success) {
          toast.success('Responsável atribuído');
          setOpen(false);
          onChanged();
        } else {
          toast.error(result.message || 'Erro ao atribuir responsável');
        }
      } catch {
        toast.error('Erro ao atribuir responsável');
      }
    });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          aria-label="Adicionar responsável"
          disabled={isPending}
          className={cn(/* design-system-escape: gap-1.5 gap sem token DS; px-2 padding direcional sem Inset equiv.; py-1 padding direcional sem Inset equiv. */ "inline-flex items-center gap-1.5 rounded-lg border border-dashed border-border/50 px-2 py-1 text-muted-foreground/60 hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition-colors cursor-pointer disabled:opacity-50 w-fit")}
        >
          <Plus className="size-3" aria-hidden="true" />
          <span className="text-micro-caption font-medium">Adicionar responsável</span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={6}
        className={cn(/* design-system-escape: p-0 → usar <Inset> */ "w-56 rounded-2xl glass-dropdown overflow-hidden p-0")}
        onClick={(e) => e.stopPropagation()}
      >
        <Command>
          <CommandInput placeholder="Buscar usuário..." className={cn("h-8 text-caption rounded-lg")} />
          <CommandList className="max-h-52">
            <CommandEmpty>
              <Text variant="caption" className="text-muted-foreground/65">
                Nenhum usuário encontrado
              </Text>
            </CommandEmpty>
            <CommandGroup>
              {usuarios.map((usuario) => (
                <CommandItem
                  key={usuario.id}
                  value={usuario.nome}
                  onSelect={() => handleSelect(usuario.id)}
                  className={cn(/* design-system-escape: px-2 padding direcional sem Inset equiv.; py-1.5 padding direcional sem Inset equiv. */ "inline-tight rounded-lg text-caption px-2 py-1.5 cursor-pointer")}
                >
                  <Avatar className="size-5">
                    <AvatarImage src={usuario.avatarUrl || undefined} alt={usuario.nome} />
                    <AvatarFallback>
                      <Text variant="micro-badge">
                        {generateAvatarFallback(usuario.nome)}
                      </Text>
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate">{usuario.nome}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// =============================================================================
// GLASS ROW
// =============================================================================

function GlassRow({
  contrato,
  clientesMap,
  partesContrariasMap,
  usuariosMap,
  segmentosMap,
  usuarios,
  isSelected,
  isAlt,
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
  isAlt: boolean;
  onToggleSelect: () => void;
  onEdit: (c: Contrato) => void;
  onDelete: (c: Contrato) => void;
  onGerarPeca: (c: Contrato) => void;
  onResponsavelChanged: () => void;
}) {
  const router = useRouter();

  const clienteNome = clientesMap.get(contrato.clienteId)?.nome || `Cliente #${contrato.clienteId}`;
  const partesAutoras = (contrato.partes ?? []).filter((p) => p.papelContratual === 'autora');
  const partesRe = (contrato.partes ?? []).filter((p) => p.papelContratual === 're');

  const getParteNome = (parte: { tipoEntidade: string; entidadeId: number; nomeSnapshot?: string | null }) => {
    if (parte.nomeSnapshot) return parte.nomeSnapshot;
    if (parte.tipoEntidade === 'cliente') {
      return clientesMap.get(parte.entidadeId)?.nome || `Cliente #${parte.entidadeId}`;
    }
    if (parte.tipoEntidade === 'parte_contraria') {
      return partesContrariasMap.get(parte.entidadeId)?.nome || `Parte Contrária #${parte.entidadeId}`;
    }
    return `Entidade #${parte.entidadeId}`;
  };

  const autoraNome = (() => {
    if (contrato.papelClienteNoContrato === 'autora') {
      return partesAutoras.length > 0 ? getParteNome(partesAutoras[0]) : clienteNome;
    }
    return partesAutoras.length > 0 ? getParteNome(partesAutoras[0]) : null;
  })();

  const reNome = (() => {
    if (contrato.papelClienteNoContrato === 're') {
      return partesRe.length > 0 ? getParteNome(partesRe[0]) : clienteNome;
    }
    return partesRe.length > 0 ? getParteNome(partesRe[0]) : null;
  })();

  const segmentoNome = contrato.segmentoId ? segmentosMap.get(contrato.segmentoId)?.nome ?? null : null;
  const processos = contrato.processos ?? [];
  const firstProcesso = processos[0];
  const processosRestantes = processos.length > 1 ? processos.length - 1 : 0;

  const handleRowClick = () => {
    router.push(`/app/contratos/${contrato.id}`);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleRowClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleRowClick();
        }
      }}
      className={cn(
        /* design-system-escape: p-3.5 → usar <Inset> */ 'group w-full text-left rounded-2xl border p-3.5 cursor-pointer',
        'transition-all duration-180 ease-out',
        'hover:border-border hover:shadow-[0_4px_14px_color-mix(in_oklch,var(--foreground)_6%,transparent)] hover:-translate-y-px',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        isSelected
          ? 'border-primary/40 bg-primary/4'
          : isAlt
            ? 'border-border/30 bg-card/60'
            : 'border-border/40 bg-card',
      )}
    >
      <div className={cn(/* design-system-escape: gap-4 gap sem token DS */ 'grid items-center gap-4', GRID_TEMPLATE)}>
        {/* 1. Checkbox */}
        <div
          className="flex items-center justify-center"
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

        {/* 2. Badge status + data — SemanticBadge existente + data abaixo */}
        <div className="flex flex-col items-start gap-1 shrink-0">
          <SemanticBadge category="status_contrato" value={contrato.status}>
            {STATUS_CONTRATO_LABELS[contrato.status]}
          </SemanticBadge>
          <span className="text-micro-caption tabular-nums text-muted-foreground/60 px-0.5">
            {formatarData(getStatusDate(contrato))}
          </span>
        </div>

        {/* 3. Cliente / Parte */}
        <div className="min-w-0">
          {/* text-[13px] — ligeiramente acima de text-xs (12px) para equilibrar peso visual com badges */}
          <p className="truncate text-[13px] font-semibold leading-tight text-foreground">
            {autoraNome || clienteNome}
            {partesAutoras.length > 1 && (
              <span className="font-normal text-muted-foreground/50"> e outros</span>
            )}
          </p>
          {reNome && (
            <p className="truncate mt-0.5 text-micro-caption text-muted-foreground/55">
              <span className="text-muted-foreground/40">vs. </span>
              {reNome}
              {partesRe.length > 1 && (
                <span className="text-muted-foreground/40"> e outros</span>
              )}
            </p>
          )}
          {segmentoNome && (
            <p className="mt-0.5 truncate text-micro-caption text-muted-foreground/45">
              {segmentoNome}
            </p>
          )}
        </div>

        {/* 4. Tipo / Cobrança — oculto em mobile, visível a partir de sm */}
        <div className={cn(/* design-system-escape: gap-1 gap sem token DS */ "hidden sm:flex flex-col gap-1 min-w-0")}>
          <SemanticBadge category="tipo_contrato" value={contrato.tipoContrato} className="w-fit">
            {TIPO_CONTRATO_LABELS[contrato.tipoContrato]}
          </SemanticBadge>
          <SemanticBadge category="tipo_cobranca" value={contrato.tipoCobranca} className="w-fit">
            {TIPO_COBRANCA_LABELS[contrato.tipoCobranca]}
          </SemanticBadge>
        </div>

        {/* 5. Processos vinculados — oculto até lg */}
        <div className={cn(/* design-system-escape: gap-0.5 gap sem token DS */ "hidden lg:flex flex-col gap-0.5 min-w-0")}>
          {firstProcesso ? (
            <>
              <Link
                href={`/app/processos/${firstProcesso.processoId}`}
                onClick={(e) => e.stopPropagation()}
                className={cn(/* design-system-escape: gap-1 gap sem token DS */ "inline-flex items-center gap-1 min-w-0 text-primary hover:underline")}
              >
                <Scale className="size-2.5 shrink-0" />
                <span className="text-micro-caption font-mono font-medium tabular-nums truncate text-primary">
                  {firstProcesso.processo?.numeroProcesso ?? `Processo #${firstProcesso.processoId}`}
                </span>
              </Link>
              {processosRestantes > 0 && (
                <Text variant="micro-caption" className="text-muted-foreground/70">
                  +{processosRestantes} vinculado{processosRestantes > 1 ? 's' : ''}
                </Text>
              )}
            </>
          ) : (
            <span className="text-micro-caption text-muted-foreground/50">—</span>
          )}
        </div>

        {/* 6. Responsável — oculto em mobile, visível a partir de sm */}
        <div className="hidden sm:block min-w-0">
          <ResponsavelCell
            contrato={contrato}
            usuariosMap={usuariosMap}
            usuarios={usuarios}
            onChanged={onResponsavelChanged}
          />
        </div>

        {/* 7. Ações */}
        <RowActions contrato={contrato} onEdit={onEdit} onDelete={onDelete} onGerarPeca={onGerarPeca} />
      </div>
    </div>
  );
}

// =============================================================================
// SKELETON
// =============================================================================

function ListSkeleton() {
  return (
    <div className={cn("flex flex-col inline-tight")}>
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className={cn(/* design-system-escape: p-3.5 → usar <Inset> */ "rounded-2xl border border-border/40 bg-card p-3.5")}>
          <div className={cn(/* design-system-escape: gap-4 gap sem token DS */ 'grid items-center gap-4', GRID_TEMPLATE)}>
            {/* 1. Checkbox */}
            <Skeleton className="size-3.5 rounded" />
            {/* 2. Badge status + data — largura espelha os 112px fixos da coluna */}
            <div className="flex flex-col items-start gap-1">
              <Skeleton className="h-5 w-20 rounded-3xl" />
              <Skeleton className="h-2.5 w-14 rounded" />
            </div>
            {/* 3. Cliente/Parte */}
            <div className={cn(/* design-system-escape: space-y-1.5 sem token DS */ "space-y-1.5")}>
              <Skeleton className="h-3.5 w-44" />
              <Skeleton className="h-2.5 w-32" />
            </div>
            {/* 4. Tipo/Cobrança — espelha visibilidade sm */}
            <div className={cn(/* design-system-escape: space-y-1 sem token DS */ "hidden sm:block space-y-1")}>
              <Skeleton className="h-4 w-16 rounded-md" />
              <Skeleton className="h-4 w-14 rounded-md" />
            </div>
            {/* 5. Processos — espelha visibilidade lg */}
            <Skeleton className="hidden lg:block h-3 w-28" />
            {/* 6. Responsável — espelha visibilidade sm */}
            <div className={cn("hidden sm:flex items-center inline-tight")}>
              <Skeleton className="size-5 rounded-full" />
              <Skeleton className="h-2.5 w-16" />
            </div>
            {/* 7. Ações */}
            <div className={cn(/* design-system-escape: gap-0.5 gap sem token DS */ "flex items-center justify-end gap-0.5")}>
              {[0, 1, 2, 3].map((j) => (
                <Skeleton key={j} className="size-7 rounded-md" />
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// EMPTY STATE
// =============================================================================

function EmptyState() {
  return (
    <div className={cn(/* design-system-escape: py-16 padding direcional sem Inset equiv. */ "flex flex-col items-center justify-center py-16 opacity-60")}>
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

export function ContratosGlassList({
  contratos,
  isLoading,
  clientesMap,
  partesContrariasMap,
  usuariosMap,
  segmentosMap,
  usuarios,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onEdit,
  onDelete,
  onGerarPeca,
  onResponsavelChanged,
}: ContratosGlassListProps) {
  if (isLoading) return <ListSkeleton />;
  if (contratos.length === 0) return <EmptyState />;

  const allSelected = contratos.length > 0 && contratos.every((c) => selectedIds.has(c.id));
  const someSelected = !allSelected && contratos.some((c) => selectedIds.has(c.id));

  return (
    <TooltipProvider>
      <div>
        <SelectAllRail
          allSelected={allSelected}
          someSelected={someSelected}
          onToggleSelectAll={onToggleSelectAll}
          visibleCount={contratos.length}
        />
        <div className={cn("flex flex-col inline-tight")}>
          {contratos.map((contrato, i) => (
            <GlassRow
              key={contrato.id}
              contrato={contrato}
              clientesMap={clientesMap}
              partesContrariasMap={partesContrariasMap}
              usuariosMap={usuariosMap}
              segmentosMap={segmentosMap}
              usuarios={usuarios}
              isSelected={selectedIds.has(contrato.id)}
              isAlt={i % 2 === 1}
              onToggleSelect={() => onToggleSelect(contrato.id)}
              onEdit={onEdit}
              onDelete={onDelete}
              onGerarPeca={onGerarPeca}
              onResponsavelChanged={onResponsavelChanged}
            />
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
}
