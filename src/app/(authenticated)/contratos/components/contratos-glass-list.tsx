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
import type { Contrato, StatusContrato } from '../domain';
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

const STATUS_DOT_COLOR: Record<StatusContrato, string> = {
  em_contratacao: 'bg-warning',
  contratado: 'bg-success',
  distribuido: 'bg-info',
  desistencia: 'bg-destructive',
};

const GRID_TEMPLATE =
  'grid-cols-[28px_10px_minmax(0,2.2fr)_minmax(0,0.9fr)_minmax(0,1fr)_minmax(0,0.9fr)_minmax(0,0.9fr)_90px_140px]';

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
    <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight">; px-4 padding direcional sem Inset equiv.; pb-2 padding direcional sem Inset equiv. */ "flex items-center gap-2 px-4 pb-2 text-muted-foreground/50")}>
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
          <Avatar className="size-6">
            <AvatarImage src={usuario?.avatarUrl || undefined} alt={nome} />
            <AvatarFallback>
              <Text variant="micro-badge">{generateAvatarFallback(nome)}</Text>
            </AvatarFallback>
          </Avatar>
          <Text variant="caption" className="truncate">
            {nome}
          </Text>
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
          className={cn(/* design-system-escape: gap-1.5 gap sem token DS; px-2 padding direcional sem Inset equiv.; py-1 padding direcional sem Inset equiv. */ "inline-flex items-center gap-1.5 rounded-lg border border-dashed border-border/30 px-2 py-1 text-muted-foreground/60 hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition-colors cursor-pointer disabled:opacity-50 w-fit")}
        >
          <Plus className="size-3" aria-hidden="true" />
          <Text variant="caption" className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "font-medium")}>
            Adicionar responsável
          </Text>
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={6}
        className={cn(/* design-system-escape: p-0 → usar <Inset> */ "w-56 rounded-2xl glass-dropdown overflow-hidden p-0")}
        onClick={(e) => e.stopPropagation()}
      >
        <Command>
          <CommandInput placeholder="Buscar usuário..." className={cn(/* design-system-escape: text-xs → migrar para <Text variant="caption"> */ "h-8 text-xs rounded-lg")} />
          <CommandList className="max-h-52">
            <CommandEmpty>
              <Text variant="caption" className="text-muted-foreground/40">
                Nenhum usuário encontrado
              </Text>
            </CommandEmpty>
            <CommandGroup>
              {usuarios.map((usuario) => (
                <CommandItem
                  key={usuario.id}
                  value={usuario.nome}
                  onSelect={() => handleSelect(usuario.id)}
                  className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight">; text-xs → migrar para <Text variant="caption">; px-2 padding direcional sem Inset equiv.; py-1.5 padding direcional sem Inset equiv. */ "gap-2 rounded-lg text-xs px-2 py-1.5 cursor-pointer")}
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
        /* design-system-escape: p-3 → usar <Inset> */ 'group w-full text-left rounded-2xl border p-3 cursor-pointer',
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
      <div className={cn(/* design-system-escape: gap-3 gap sem token DS */ 'grid items-center gap-3', GRID_TEMPLATE)}>
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

        {/* 2. Status dot */}
        <div className="flex items-center justify-center">
          <span
            className={cn('size-2 rounded-full shrink-0 opacity-80', STATUS_DOT_COLOR[contrato.status])}
            aria-hidden="true"
          />
        </div>

        {/* 3. Cliente / Parte */}
        <div className="min-w-0">
          <div className={cn(/* design-system-escape: gap-1.5 gap sem token DS */ "flex items-center gap-1.5")}>
            <Text variant="label" className={cn(/* design-system-escape: font-semibold → className de <Text>/<Heading>; leading-tight sem token DS */ "font-semibold text-foreground truncate leading-tight")}>
              {autoraNome || clienteNome}
              {partesAutoras.length > 1 && (
                <span className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "text-muted-foreground/60 font-medium")}> e outros</span>
              )}
            </Text>
            {contrato.papelClienteNoContrato === 'autora' && (
              <Text
                variant="micro-badge"
                className={cn(/* design-system-escape: px-1 padding direcional sem Inset equiv.; font-semibold → className de <Text>/<Heading> */ "inline-flex items-center bg-primary/10 border border-primary/20 text-primary rounded px-1 py-px font-semibold shrink-0")}
              >
                Cliente
              </Text>
            )}
          </div>
          {reNome && (
            <Text variant="caption" className="truncate mt-0.5 block">
              <span className="text-muted-foreground/50">vs. </span>
              {reNome}
              {partesRe.length > 1 && (
                <span className="text-muted-foreground/50"> e outros</span>
              )}
              {contrato.papelClienteNoContrato === 're' && (
                <Text
                  variant="micro-badge"
                  className={cn(/* design-system-escape: px-1 padding direcional sem Inset equiv.; font-semibold → className de <Text>/<Heading> */ "ml-1.5 inline-flex items-center bg-primary/10 border border-primary/20 text-primary rounded px-1 py-px font-semibold")}
                >
                  Cliente
                </Text>
              )}
            </Text>
          )}
          {segmentoNome && (
            <Text variant="micro-caption" className="mt-0.5 truncate block text-muted-foreground/50">
              {segmentoNome}
            </Text>
          )}
        </div>

        {/* 4. Tipo / Cobrança */}
        <div className={cn(/* design-system-escape: gap-1 gap sem token DS */ "flex flex-col gap-1 min-w-0")}>
          <SemanticBadge category="tipo_contrato" value={contrato.tipoContrato} className="w-fit">
            {TIPO_CONTRATO_LABELS[contrato.tipoContrato]}
          </SemanticBadge>
          <SemanticBadge category="tipo_cobranca" value={contrato.tipoCobranca} className="w-fit">
            {TIPO_COBRANCA_LABELS[contrato.tipoCobranca]}
          </SemanticBadge>
        </div>

        {/* 5. Processos vinculados */}
        <div className={cn(/* design-system-escape: gap-0.5 gap sem token DS */ "flex flex-col gap-0.5 min-w-0")}>
          {firstProcesso ? (
            <>
              <Link
                href={`/app/processos/${firstProcesso.processoId}`}
                onClick={(e) => e.stopPropagation()}
                className={cn(/* design-system-escape: gap-1 gap sem token DS */ "inline-flex items-center gap-1 min-w-0 text-primary hover:underline")}
              >
                <Scale className="size-2.5 shrink-0" />
                <Text variant="caption" className="tabular-nums truncate text-primary">
                  {firstProcesso.processo?.numeroProcesso ?? `Processo #${firstProcesso.processoId}`}
                </Text>
              </Link>
              {processosRestantes > 0 && (
                <Text variant="micro-caption" className="text-muted-foreground/50">
                  +{processosRestantes} vinculado{processosRestantes > 1 ? 's' : ''}
                </Text>
              )}
            </>
          ) : (
            <Text variant="caption" className="text-muted-foreground/40">—</Text>
          )}
        </div>

        {/* 6. Estágio (status) */}
        <div>
          <SemanticBadge category="status_contrato" value={contrato.status}>
            {STATUS_CONTRATO_LABELS[contrato.status]}
          </SemanticBadge>
        </div>

        {/* 7. Responsável */}
        <ResponsavelCell
          contrato={contrato}
          usuariosMap={usuariosMap}
          usuarios={usuarios}
          onChanged={onResponsavelChanged}
        />

        {/* 8. Data de cadastro */}
        <Text variant="caption" className="tabular-nums">
          {formatarData(contrato.cadastradoEm)}
        </Text>

        {/* 9. Ações */}
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
    <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "flex flex-col gap-2")}>
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className={cn(/* design-system-escape: p-3 → usar <Inset> */ "rounded-2xl border border-border/40 bg-card p-3")}>
          <div className={cn(/* design-system-escape: gap-3 gap sem token DS */ 'grid items-center gap-3', GRID_TEMPLATE)}>
            <Skeleton className="size-3.5 rounded" />
            <Skeleton className="size-2 rounded-full" />
            <div className={cn(/* design-system-escape: space-y-1.5 sem token DS */ "space-y-1.5")}>
              <Skeleton className="h-3.5 w-48" />
              <Skeleton className="h-2.5 w-36" />
            </div>
            <div className={cn(/* design-system-escape: space-y-1 sem token DS */ "space-y-1")}>
              <Skeleton className="h-4 w-16 rounded-md" />
              <Skeleton className="h-4 w-14 rounded-md" />
            </div>
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-4 w-20 rounded-md" />
            <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "flex items-center gap-2")}>
              <Skeleton className="size-5 rounded-full" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-3 w-14" />
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
      <FileText className="w-10 h-10 text-muted-foreground/30 mb-4" />
      <Text variant="label" className="text-muted-foreground/60">
        Nenhum contrato encontrado
      </Text>
      <Text variant="caption" className="text-muted-foreground/40 mt-1">
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
        <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "flex flex-col gap-2")}>
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
