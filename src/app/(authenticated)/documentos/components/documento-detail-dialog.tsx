'use client';

import * as React from 'react';
import Image from 'next/image';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  ExternalLink,
  Share2,
  Trash2,
  Info,
  Folder,
  FileText,
  FileImage,
  FileVideo,
  FileAudio,
  File as FileIcon,
  Calendar,
  User as UserIcon,
  HardDrive,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { IconContainer } from '@/components/ui/icon-container';
import { cn } from '@/lib/utils';
import { getAvatarUrl } from '@/app/(authenticated)/usuarios';
import type { ItemDocumento } from '../domain';
import { normalizeCriador, type CriadorRaw } from '../lib/criador';

// =============================================================================
// HELPERS
// =============================================================================

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function getItemName(item: ItemDocumento): string {
  if (item.tipo === 'pasta') return item.dados.nome;
  if (item.tipo === 'documento') return item.dados.titulo;
  return item.dados.nome;
}

function getTipoLabel(item: ItemDocumento): string {
  if (item.tipo === 'pasta') return 'Pasta';
  if (item.tipo === 'documento') return 'Documento';

  const mime = item.dados.tipo_mime;
  if (mime.startsWith('image/')) return 'Imagem';
  if (mime.startsWith('video/')) return 'Vídeo';
  if (mime.startsWith('audio/')) return 'Áudio';
  if (mime === 'application/pdf') return 'PDF';
  return 'Arquivo';
}

type AccentTone = 'warning' | 'info' | 'success' | 'primary' | 'destructive' | 'muted';

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

const ACCENT_CLASSES: Record<AccentTone, { bg: string; text: string }> = {
  warning: { bg: 'bg-warning/8', text: 'text-warning' },
  info: { bg: 'bg-info/8', text: 'text-info' },
  success: { bg: 'bg-success/8', text: 'text-success' },
  primary: { bg: 'bg-primary/8', text: 'text-primary' },
  destructive: { bg: 'bg-destructive/8', text: 'text-destructive' },
  muted: { bg: 'bg-muted/40', text: 'text-muted-foreground' },
};

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

// =============================================================================
// SECTION PRIMITIVES
// =============================================================================

function SectionHeader({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <div className={cn("flex items-center inline-tight mb-2.5")}>
      <Icon className="size-3.5 text-primary" />
      <h4 className={cn(/* design-system-escape: font-semibold → className de <Text>/<Heading> */ "text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.08em]")}>
        {label}
      </h4>
    </div>
  );
}

function SectionCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'rounded-[14px] bg-muted/40 border border-border/30 p-[14px_16px]',
        className,
      )}
    >
      {children}
    </div>
  );
}

function MetaRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className={cn(/* design-system-escape: gap-3 gap sem token DS; py-1 padding direcional sem Inset equiv. */ "flex items-center justify-between gap-3 py-1")}>
      <span className="text-[11.5px] text-muted-foreground/70">{label}</span>
      <span className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "text-[12px] font-medium text-foreground text-right truncate")}>{value}</span>
    </div>
  );
}

// =============================================================================
// PROPS
// =============================================================================

export interface DocumentoDetailDialogProps {
  item: ItemDocumento | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete?: (item: ItemDocumento) => void;
  onShare?: (item: ItemDocumento) => void;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function DocumentoDetailDialog({
  item,
  open,
  onOpenChange,
  onDelete,
  onShare,
}: DocumentoDetailDialogProps) {
  if (!item) return null;

  const Icon = getItemIcon(item);
  const accent = getAccent(item);
  const accentClasses = ACCENT_CLASSES[accent];

  const isImage = item.tipo === 'arquivo' && item.dados.tipo_mime.startsWith('image/');
  const nome = getItemName(item);
  const tipoLabel = getTipoLabel(item);

  const criador = normalizeCriador(item.dados.criador as CriadorRaw);
  const criadorNome = criador.nome;
  const criadorAvatar = getAvatarUrl(criador.avatarUrl);
  const criadorNomeCompleto = criador.nomeCompleto;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(/* design-system-escape: gap-0 gap sem token DS; p-0 → usar <Inset> */ " max-w-md max-h-[90vh] overflow-hidden flex flex-col gap-0 p-0")}>
        <DialogHeader className="sr-only">
          <DialogTitle>{nome}</DialogTitle>
          <DialogDescription>
            Detalhes do item selecionado, incluindo informações, datas, autoria e ações disponíveis.
          </DialogDescription>
        </DialogHeader>

        {/* ── Hero preview ───────────────────────────────────── */}
        <div
          className={cn(
            /* design-system-escape: px-6 padding direcional sem Inset equiv.; py-8 padding direcional sem Inset equiv. */ 'relative flex flex-col items-center justify-center inline-default px-6 py-8',
            'border-b border-border/30',
            accentClasses.bg,
          )}
        >
          {isImage ? (
            <div className="relative h-40 w-full overflow-hidden rounded-2xl border border-border/30 bg-muted">
              <Image
                src={item.dados.b2_url}
                alt={nome}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          ) : (
            <IconContainer size="lg" className={cn('size-16 rounded-2xl', accentClasses.bg)}>
              <Icon className={cn('size-8', accentClasses.text)} />
            </IconContainer>
          )}
          <div className="text-center max-w-full">
            <h3 className={cn(/* design-system-escape: font-semibold → className de <Text>/<Heading>; leading-tight sem token DS */ "text-[15px] font-semibold text-foreground leading-tight wrap-break-word")}>
              {nome}
            </h3>
            <span
              className={cn(
                /* design-system-escape: px-1.5 padding direcional sem Inset equiv.; py-0.5 padding direcional sem Inset equiv.; font-semibold → className de <Text>/<Heading> */ 'inline-flex items-center rounded-md border px-1.5 py-0.5 mt-2 text-[10px] font-semibold tracking-[0.02em]',
                accentClasses.text,
                'border-current/20 bg-current/5',
              )}
            >
              {tipoLabel}
            </span>
          </div>
        </div>

        {/* ── Body ───────────────────────────────────────────── */}
        <div className={cn(/* design-system-escape: px-6 padding direcional sem Inset equiv.; py-5 padding direcional sem Inset equiv.; space-y-5 sem token DS */ "flex-1 overflow-y-auto px-6 py-5 space-y-5")}>
          {/* Informações gerais */}
          <div>
            <SectionHeader icon={Info} label="Informações" />
            <SectionCard className={cn(/* design-system-escape: space-y-0.5 sem token DS */ "space-y-0.5")}>
              <MetaRow label="Tipo" value={tipoLabel} />
              {item.tipo === 'arquivo' && (
                <MetaRow label="Tamanho" value={formatFileSize(item.dados.tamanho_bytes)} />
              )}
              {item.tipo === 'arquivo' && (
                <MetaRow
                  label="MIME"
                  value={
                    <span className="font-mono text-[11px] text-muted-foreground/80">
                      {item.dados.tipo_mime}
                    </span>
                  }
                />
              )}
              {item.tipo === 'pasta' && (
                <>
                  <MetaRow label="Documentos" value={item.dados.total_documentos} />
                  <MetaRow label="Subpastas" value={item.dados.total_subpastas} />
                </>
              )}
            </SectionCard>
          </div>

          {/* Timeline */}
          <div>
            <SectionHeader icon={Calendar} label="Datas" />
            <SectionCard className={cn(/* design-system-escape: space-y-0.5 sem token DS */ "space-y-0.5")}>
              <MetaRow
                label="Criado em"
                value={format(parseISO(item.dados.created_at), "dd 'de' MMM 'de' yyyy", {
                  locale: ptBR,
                })}
              />
              {item.dados.updated_at && item.dados.updated_at !== item.dados.created_at && (
                <MetaRow
                  label="Atualizado"
                  value={format(parseISO(item.dados.updated_at), 'dd MMM yyyy', {
                    locale: ptBR,
                  })}
                />
              )}
            </SectionCard>
          </div>

          {/* Criador */}
          <div>
            <SectionHeader icon={UserIcon} label="Criado por" />
            <SectionCard>
              <div className={cn(/* design-system-escape: gap-3 gap sem token DS */ "flex items-center gap-3")}>
                <Avatar className="size-8">
                  {criadorAvatar && <AvatarImage src={criadorAvatar} alt={criadorNome} />}
                  <AvatarFallback className={cn("text-caption bg-primary/10 text-primary")}>
                    {criadorNome.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "text-[12.5px] font-medium text-foreground truncate")}>{criadorNome}</p>
                  {criadorNomeCompleto && criadorNome !== criadorNomeCompleto && (
                    <p className="text-[11px] text-muted-foreground/60 truncate">
                      {criadorNomeCompleto}
                    </p>
                  )}
                </div>
              </div>
            </SectionCard>
          </div>

          {/* Storage info (só para arquivos) */}
          {item.tipo === 'arquivo' && (
            <div>
              <SectionHeader icon={HardDrive} label="Armazenamento" />
              <SectionCard className={cn(/* design-system-escape: space-y-0.5 sem token DS */ "space-y-0.5")}>
                <MetaRow
                  label="Chave"
                  value={
                    <span className="font-mono text-[10.5px] text-muted-foreground/70 truncate max-w-45 inline-block align-bottom">
                      {item.dados.b2_key}
                    </span>
                  }
                />
              </SectionCard>
            </div>
          )}
        </div>

        {/* ── Actions ────────────────────────────────────────── */}
        <DialogFooter className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight">; px-6 padding direcional sem Inset equiv.; py-4 padding direcional sem Inset equiv. */ "border-t border-border/30 px-6 py-4")}>
          {onShare && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="rounded-xl"
              onClick={() => onShare(item)}
            >
              <Share2 className="size-3.5" />
              Compartilhar
            </Button>
          )}
          {onDelete && item.tipo !== 'pasta' && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => onDelete(item)}
            >
              <Trash2 className="size-3.5" />
              Excluir
            </Button>
          )}
          {item.tipo === 'arquivo' && (
            <Button
              type="button"
              size="sm"
              className="rounded-xl"
              onClick={() => window.open(item.dados.b2_url, '_blank')}
            >
              <ExternalLink className="size-3.5" />
              Abrir arquivo
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
