'use client';

import * as React from 'react';
import { parseISO, format, formatDistanceToNow } from 'date-fns';
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
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { IconContainer } from '@/components/ui/icon-container';
import { cn } from '@/lib/utils';
import { getAvatarUrl } from '@/app/(authenticated)/usuarios';
import type { ItemDocumento } from '../domain';
import { normalizeCriador, type CriadorRaw } from '../lib/criador';
import { Text } from '@/components/ui/typography';

// =============================================================================
// TYPES
// =============================================================================

interface DocumentosGlassListProps {
  items: ItemDocumento[];
  isLoading: boolean;
  onItemClick: (item: ItemDocumento) => void;
  onDelete: (item: ItemDocumento, e: React.MouseEvent) => void;
  onShare: (item: ItemDocumento, e: React.MouseEvent) => void;
  onOpen: (item: ItemDocumento, e: React.MouseEvent) => void;
  selectedItemKey?: string | null;
}

// =============================================================================
// HELPERS
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

// Grid: [ícone | nome+meta | criado | criador | ações]
const GRID_COLS =
  'grid-cols-[40px_minmax(0,2.4fr)_minmax(0,1fr)_minmax(0,1.2fr)_96px]';

// =============================================================================
// GLASS ROW
// =============================================================================

function GlassRow({
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
  const criadorNome = criador.nome;
  const criadorAvatar = getAvatarUrl(criador.avatarUrl);

  const createdAt = parseISO(item.dados.created_at);
  const createdLabel = format(createdAt, 'dd MMM yyyy', { locale: ptBR });
  const createdRelative = formatDistanceToNow(createdAt, { locale: ptBR, addSuffix: true });

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onItemClick(item)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onItemClick(item);
        }
      }}
      className={cn(
        /* design-system-escape: p-4 → migrar para <Inset variant="card-compact"> */ 'group w-full text-left rounded-2xl border border-border/40 p-4 cursor-pointer bg-card',
        'transition-all duration-180 ease-out',
        'hover:border-border/60 hover:scale-[1.003] hover:-translate-y-px hover:shadow-lg',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        isSelected && 'border-primary/50 ring-1 ring-primary/25 bg-primary/3',
      )}
    >
      {/* ── Mobile (<lg): stacked ───────────────────────────── */}
      <div className={cn(/* design-system-escape: gap-3 gap sem token DS */ "flex items-center gap-3 lg:hidden")}>
        <IconContainer size="md" className={cn('rounded-xl', ACCENT_BG[accent])}>
          <Icon className={cn('size-4', ACCENT_TEXT[accent])} />
        </IconContainer>
        <div className="flex-1 min-w-0">
          <span className={cn(/* design-system-escape: font-semibold → className de <Text>/<Heading> */ "text-[13px] font-semibold text-foreground truncate block")}>{nome}</span>
          <div className="text-[11px] text-muted-foreground/60 mt-0.5 truncate">
            {meta ? `${meta} · ` : ''}
            {createdRelative}
          </div>
        </div>
        <div className={cn(/* design-system-escape: gap-0.5 gap sem token DS */ "flex items-center gap-0.5 shrink-0")}>
          {item.tipo === 'arquivo' && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={(e) => onOpen(item, e)}
              aria-label="Abrir"
            >
              <ExternalLink className="size-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={(e) => onShare(item, e)}
            aria-label="Compartilhar"
          >
            <Share2 className="size-4" />
          </Button>
          {item.tipo !== 'pasta' && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={(e) => onDelete(item, e)}
              aria-label="Excluir"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="size-4" />
            </Button>
          )}
        </div>
      </div>

      {/* ── Desktop (lg+): grid colunas ─────────────────────── */}
      <div className={cn(/* design-system-escape: gap-3 gap sem token DS */ 'hidden lg:grid gap-3 items-center', GRID_COLS)}>
        {/* 1. Ícone */}
        <IconContainer size="md" className={cn('rounded-xl size-10', ACCENT_BG[accent])}>
          <Icon className={cn('size-5', ACCENT_TEXT[accent])} />
        </IconContainer>

        {/* 2. Nome + meta */}
        <div className="min-w-0">
          <div className={cn(/* design-system-escape: font-semibold → className de <Text>/<Heading> */ "text-[13.5px] font-semibold text-foreground truncate")}>{nome}</div>
          {meta && (
            <div className="text-[11px] text-muted-foreground/60 mt-0.5 truncate">{meta}</div>
          )}
        </div>

        {/* 3. Criado em */}
        <div className="min-w-0">
          <div className="text-[11.5px] tabular-nums text-foreground/80">{createdLabel}</div>
          <div className="text-[10px] text-muted-foreground/50 mt-0.5 truncate">
            {createdRelative}
          </div>
        </div>

        {/* 4. Criador */}
        <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "flex items-center gap-2 min-w-0")}>
          <Avatar className="size-6">
            {criadorAvatar && <AvatarImage src={criadorAvatar} alt={criadorNome} />}
            <AvatarFallback className="text-[9px] bg-primary/10 text-primary">
              {criadorNome.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="text-[11.5px] text-foreground/80 truncate">{criadorNome}</span>
        </div>

        {/* 5. Ações */}
        <div className={cn(/* design-system-escape: gap-0.5 gap sem token DS */ "flex items-center justify-end gap-0.5")}>
          {item.tipo === 'arquivo' && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={(e) => onOpen(item, e)}
              aria-label="Abrir"
              className="opacity-60 group-hover:opacity-100 transition-opacity"
            >
              <ExternalLink className="size-3.5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={(e) => onShare(item, e)}
            aria-label="Compartilhar"
            className="opacity-60 group-hover:opacity-100 transition-opacity"
          >
            <Share2 className="size-3.5" />
          </Button>
          {item.tipo !== 'pasta' && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={(e) => onDelete(item, e)}
              aria-label="Excluir"
              className="text-destructive hover:text-destructive hover:bg-destructive/10 opacity-60 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 className="size-3.5" />
            </Button>
          )}
          <ChevronRight className="size-3.5 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
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
        <div key={i} className={cn(/* design-system-escape: p-4 → migrar para <Inset variant="card-compact"> */ "rounded-2xl border border-border/40 bg-card p-4")}>
          <div className={cn(/* design-system-escape: gap-3 gap sem token DS */ 'hidden lg:grid gap-3 items-center', GRID_COLS)}>
            <Skeleton className="size-10 rounded-xl" />
            <div className={cn(/* design-system-escape: space-y-1.5 sem token DS */ "space-y-1.5")}>
              <Skeleton className="h-3.5 w-52" />
              <Skeleton className="h-2.5 w-24" />
            </div>
            <div className={cn(/* design-system-escape: space-y-1 sem token DS */ "space-y-1")}>
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-2.5 w-16" />
            </div>
            <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "flex items-center gap-2")}>
              <Skeleton className="size-6 rounded-full" />
              <Skeleton className="h-3 w-20" />
            </div>
            <div className={cn(/* design-system-escape: gap-1 gap sem token DS */ "flex items-center justify-end gap-1")}>
              <Skeleton className="size-7 rounded-md" />
              <Skeleton className="size-7 rounded-md" />
            </div>
          </div>
          <div className={cn(/* design-system-escape: gap-3 gap sem token DS */ "flex items-center gap-3 lg:hidden")}>
            <Skeleton className="size-10 rounded-xl" />
            <div className={cn(/* design-system-escape: space-y-1.5 sem token DS */ "flex-1 space-y-1.5")}>
              <Skeleton className="h-3.5 w-44" />
              <Skeleton className="h-2.5 w-28" />
            </div>
            <Skeleton className="size-7 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// EMPTY STATE
// =============================================================================

function GlassEmptyState({ hasSearch }: { hasSearch: boolean }) {
  return (
    <div className={cn(/* design-system-escape: py-16 padding direcional sem Inset equiv. */ "flex flex-col items-center justify-center py-16 opacity-60")}>
      <FileSearch className="size-10 text-muted-foreground/30 mb-4" />
      <p className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "text-body-sm font-medium text-muted-foreground/60")}>
        {hasSearch ? 'Nenhum item encontrado' : 'Pasta vazia'}
      </p>
      <Text variant="caption" className="text-muted-foreground/40 mt-1">
        {hasSearch
          ? 'Ajuste os filtros ou o termo de busca'
          : 'Adicione uma pasta, documento ou faça upload'}
      </Text>
    </div>
  );
}

// =============================================================================
// MAIN EXPORT
// =============================================================================

export function DocumentosGlassList({
  items,
  isLoading,
  onItemClick,
  onDelete,
  onShare,
  onOpen,
  selectedItemKey,
}: DocumentosGlassListProps) {
  if (isLoading) return <ListSkeleton />;
  if (items.length === 0) return <GlassEmptyState hasSearch={false} />;

  return (
    <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "flex flex-col gap-2")}>
      {items.map((item) => {
        const key = `${item.tipo}-${item.dados.id}`;
        return (
          <GlassRow
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
