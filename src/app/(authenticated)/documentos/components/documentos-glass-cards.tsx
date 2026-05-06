'use client';

import * as React from 'react';
import { parseISO, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Folder,
  FileText,
  FileImage,
  FileVideo,
  FileAudio,
  File as FileIcon,
  FileSearch,
  ExternalLink,
  Share2,
  Trash2,
  MoreHorizontal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { IconContainer } from '@/components/ui/icon-container';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { getAvatarUrl } from '@/app/(authenticated)/usuarios';
import type { ItemDocumento } from '../domain';
import { normalizeCriador, type CriadorRaw } from '../lib/criador';
import { Text } from '@/components/ui/typography';

// =============================================================================
// TYPES
// =============================================================================

interface DocumentosGlassCardsProps {
  items: ItemDocumento[];
  isLoading: boolean;
  onItemClick: (item: ItemDocumento) => void;
  onDelete: (item: ItemDocumento, e: React.MouseEvent) => void;
  onShare: (item: ItemDocumento, e: React.MouseEvent) => void;
  onOpen: (item: ItemDocumento, e: React.MouseEvent) => void;
  selectedItemKey?: string | null;
}

// =============================================================================
// HELPERS (reaproveitados da glass-list)
// =============================================================================

type AccentTone = 'warning' | 'info' | 'success' | 'primary' | 'destructive' | 'muted';

const ACCENT_BG: Record<AccentTone, string> = {
  warning: 'bg-warning/10',
  info: 'bg-info/10',
  success: 'bg-success/10',
  primary: 'bg-primary/10',
  destructive: 'bg-destructive/10',
  muted: 'bg-muted/60',
};

const ACCENT_TEXT: Record<AccentTone, string> = {
  warning: 'text-warning',
  info: 'text-info',
  success: 'text-success',
  primary: 'text-primary',
  destructive: 'text-destructive',
  muted: 'text-muted-foreground/70',
};

const ACCENT_GLOW: Record<AccentTone, string> = {
  warning: 'from-warning/10',
  info: 'from-info/10',
  success: 'from-success/10',
  primary: 'from-primary/10',
  destructive: 'from-destructive/10',
  muted: 'from-muted/30',
};

function getAccent(item: ItemDocumento): AccentTone {
  if (item.tipo === 'pasta') return 'warning';
  if (item.tipo === 'documento') return 'info';

  const mime = item.dados.tipo_mime;
  if (mime.startsWith('image/')) return 'success';
  if (mime.startsWith('video/')) return 'primary';
  if (mime.startsWith('audio/')) return 'warning';
  if (mime === 'application/pdf') return 'destructive';
  return 'muted';
}

function getItemIcon(item: ItemDocumento): React.ComponentType<{ className?: string }> {
  if (item.tipo === 'pasta') return Folder;
  if (item.tipo === 'documento') return FileText;

  const mime = item.dados.tipo_mime;
  if (mime.startsWith('image/')) return FileImage;
  if (mime.startsWith('video/')) return FileVideo;
  if (mime.startsWith('audio/')) return FileAudio;
  if (mime === 'application/pdf') return FileText;
  return FileIcon;
}

function getItemName(item: ItemDocumento): string {
  if (item.tipo === 'pasta') return item.dados.nome;
  if (item.tipo === 'documento') return item.dados.titulo;
  return item.dados.nome;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function getItemMeta(item: ItemDocumento): string | null {
  if (item.tipo === 'pasta') {
    const d = item.dados.total_documentos;
    const s = item.dados.total_subpastas;
    const parts: string[] = [];
    if (d > 0) parts.push(`${d} documento${d === 1 ? '' : 's'}`);
    if (s > 0) parts.push(`${s} subpasta${s === 1 ? '' : 's'}`);
    return parts.length > 0 ? parts.join(' · ') : 'Vazia';
  }
  if (item.tipo === 'arquivo') {
    return formatFileSize(item.dados.tamanho_bytes);
  }
  return null;
}

// =============================================================================
// CARD
// =============================================================================

function GlassCard({
  item,
  onItemClick,
  onDelete,
  onShare,
  onOpen,
  isSelected,
}: {
  item: ItemDocumento;
  onItemClick: (item: ItemDocumento) => void;
  onDelete: (item: ItemDocumento, e: React.MouseEvent) => void;
  onShare: (item: ItemDocumento, e: React.MouseEvent) => void;
  onOpen: (item: ItemDocumento, e: React.MouseEvent) => void;
  isSelected: boolean;
}) {
  const Icon = getItemIcon(item);
  const accent = getAccent(item);
  const nome = getItemName(item);
  const meta = getItemMeta(item);

  const criador = normalizeCriador(item.dados.criador as CriadorRaw);
  const criadorAvatar = getAvatarUrl(criador.avatarUrl);

  const createdAt = parseISO(item.dados.created_at);
  const createdRelative = formatDistanceToNow(createdAt, { locale: ptBR, addSuffix: true });

  return (
    <button
      type="button"
      onClick={() => onItemClick(item)}
      className={cn(
        /* design-system-escape: p-4 → migrar para <Inset variant="card-compact"> */ 'group relative overflow-hidden rounded-2xl border border-border/40 bg-card p-4 text-left cursor-pointer',
        'transition-all duration-200 ease-out',
        'hover:border-border/70 hover:-translate-y-0.5 hover:shadow-lg',
        isSelected && 'border-primary/50 ring-1 ring-primary/25 bg-primary/[0.03]',
      )}
    >
      {/* Glow de fundo (gradient top-right sutil) */}
      <div
        className={cn(
          'pointer-events-none absolute -right-8 -top-8 size-24 rounded-full bg-gradient-to-br to-transparent blur-2xl opacity-60',
          ACCENT_GLOW[accent],
        )}
      />

      {/* Header: ícone + menu */}
      <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "relative flex items-start justify-between gap-2")}>
        <IconContainer size="lg" className={cn('rounded-2xl', ACCENT_BG[accent])}>
          <Icon className={cn('size-5', ACCENT_TEXT[accent])} />
        </IconContainer>
        <div onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Ações"
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="size-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl">
              {item.tipo === 'arquivo' && (
                <DropdownMenuItem
                  onClick={(e) => onOpen(item, e)}
                  className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight">; text-xs → migrar para <Text variant="caption"> */ "gap-2 text-xs cursor-pointer")}
                >
                  <ExternalLink className="size-3.5" />
                  Abrir
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={(e) => onShare(item, e)}
                className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight">; text-xs → migrar para <Text variant="caption"> */ "gap-2 text-xs cursor-pointer")}
              >
                <Share2 className="size-3.5" />
                Compartilhar
              </DropdownMenuItem>
              {item.tipo !== 'pasta' && (
                <DropdownMenuItem
                  onClick={(e) => onDelete(item, e)}
                  className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight">; text-xs → migrar para <Text variant="caption"> */ "gap-2 text-xs cursor-pointer text-destructive focus:text-destructive")}
                >
                  <Trash2 className="size-3.5" />
                  Excluir
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Body: nome + meta */}
      <div className="relative mt-3.5 min-h-[52px]">
        <h3 className={cn(/* design-system-escape: font-semibold → className de <Text>/<Heading>; leading-snug sem token DS */ "text-[13.5px] font-semibold text-foreground line-clamp-2 leading-snug")}>
          {nome}
        </h3>
        {meta && (
          <p className="text-[11px] text-muted-foreground/60 mt-1 truncate">{meta}</p>
        )}
      </div>

      {/* Footer: criador + data */}
      <div className={cn(/* design-system-escape: pt-3 padding direcional sem Inset equiv.; gap-2 → migrar para <Inline gap="tight"> */ "relative mt-4 pt-3 border-t border-border/30 flex items-center justify-between gap-2")}>
        <div className={cn(/* design-system-escape: gap-1.5 gap sem token DS */ "flex items-center gap-1.5 min-w-0")}>
          <Avatar className="size-5">
            {criadorAvatar && <AvatarImage src={criadorAvatar} alt={criador.nome} />}
            <AvatarFallback className="text-[8px] bg-primary/10 text-primary">
              {criador.nome.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="text-[10.5px] text-muted-foreground/70 truncate">
            {criador.nome}
          </span>
        </div>
        <span className="text-[10px] text-muted-foreground/50 tabular-nums shrink-0">
          {createdRelative}
        </span>
      </div>
    </button>
  );
}

// =============================================================================
// SKELETON
// =============================================================================

function CardsSkeleton() {
  return (
    <div className={cn(/* design-system-escape: gap-3 gap sem token DS */ "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3")}>
      {Array.from({ length: 10 }, (_, i) => (
        <div key={i} className={cn(/* design-system-escape: p-4 → migrar para <Inset variant="card-compact"> */ "rounded-2xl border border-border/40 bg-card p-4")}>
          <Skeleton className="size-10 rounded-2xl" />
          <Skeleton className="h-3.5 w-full mt-3.5" />
          <Skeleton className="h-3 w-20 mt-2" />
          <div className={cn(/* design-system-escape: pt-3 padding direcional sem Inset equiv.; gap-1.5 gap sem token DS */ "mt-4 pt-3 border-t border-border/30 flex items-center gap-1.5")}>
            <Skeleton className="size-5 rounded-full" />
            <Skeleton className="h-2.5 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// EMPTY STATE
// =============================================================================

function CardsEmptyState() {
  return (
    <div className={cn(/* design-system-escape: py-16 padding direcional sem Inset equiv. */ "flex flex-col items-center justify-center py-16 opacity-60")}>
      <FileSearch className="size-10 text-muted-foreground/30 mb-4" />
      <p className={cn(/* design-system-escape: text-sm → migrar para <Text variant="body-sm">; font-medium → className de <Text>/<Heading> */ "text-sm font-medium text-muted-foreground/60")}>Pasta vazia</p>
      <Text variant="caption" className="text-muted-foreground/40 mt-1">
        Adicione uma pasta, documento ou faça upload
      </Text>
    </div>
  );
}

// =============================================================================
// MAIN EXPORT
// =============================================================================

export function DocumentosGlassCards({
  items,
  isLoading,
  onItemClick,
  onDelete,
  onShare,
  onOpen,
  selectedItemKey,
}: DocumentosGlassCardsProps) {
  if (isLoading) return <CardsSkeleton />;
  if (items.length === 0) return <CardsEmptyState />;

  return (
    <div className={cn(/* design-system-escape: gap-3 gap sem token DS */ "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3")}>
      {items.map((item) => {
        const key = `${item.tipo}-${item.dados.id}`;
        return (
          <GlassCard
            key={key}
            item={item}
            onItemClick={onItemClick}
            onDelete={onDelete}
            onShare={onShare}
            onOpen={onOpen}
            isSelected={selectedItemKey === key}
          />
        );
      })}
    </div>
  );
}
