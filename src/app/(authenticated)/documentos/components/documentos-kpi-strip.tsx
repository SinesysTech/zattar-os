'use client';

import { cn } from '@/lib/utils';
import { useMemo } from 'react';
import { FolderClosed, FileText, HardDrive, Layers } from 'lucide-react';
import { GlassPanel } from '@/components/shared/glass-panel';
import { IconContainer } from '@/components/ui/icon-container';
import { AnimatedNumber } from '@/app/(authenticated)/dashboard/widgets/primitives';
import type { ItemDocumento } from '../domain';
import { Text } from '@/components/ui/typography';

export interface DocumentosKpiStripProps {
  items: ItemDocumento[];
  className?: string;
}

function formatBytes(bytes: number): { value: string; unit: string } {
  if (bytes < 1024) return { value: String(bytes), unit: 'B' };
  if (bytes < 1024 * 1024) return { value: (bytes / 1024).toFixed(1), unit: 'KB' };
  if (bytes < 1024 * 1024 * 1024)
    return { value: (bytes / (1024 * 1024)).toFixed(1), unit: 'MB' };
  return { value: (bytes / (1024 * 1024 * 1024)).toFixed(2), unit: 'GB' };
}

export function DocumentosKpiStrip({ items, className }: DocumentosKpiStripProps) {
  const stats = useMemo(() => {
    const pastas = items.filter((i) => i.tipo === 'pasta');
    const documentos = items.filter((i) => i.tipo === 'documento');
    const arquivos = items.filter((i) => i.tipo === 'arquivo');

    const totalBytes = arquivos.reduce(
      (acc, a) => acc + (a.tipo === 'arquivo' ? a.dados.tamanho_bytes : 0),
      0,
    );
    const { value: storageValue, unit: storageUnit } = formatBytes(totalBytes);

    // Distribuição dos arquivos por mime (para mostrar no card "Armazenamento")
    const mimeGroups = arquivos.reduce<Record<string, number>>((acc, a) => {
      if (a.tipo !== 'arquivo') return acc;
      const mime = a.dados.tipo_mime;
      let key: string;
      if (mime.startsWith('image/')) key = 'Imagens';
      else if (mime.startsWith('video/')) key = 'Vídeos';
      else if (mime.startsWith('audio/')) key = 'Áudios';
      else if (mime === 'application/pdf') key = 'PDFs';
      else key = 'Outros';
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});

    const topMime = Object.entries(mimeGroups).sort(
      ([, aCount], [, bCount]) => bCount - aCount,
    )[0];

    // Criados nos últimos 7 dias (trend para o card "Itens")
    const now = new Date();
    const trend: number[] = [];
    for (let i = 6; i >= 0; i--) {
      const day = new Date(now);
      day.setDate(now.getDate() - i);
      const key = day.toISOString().slice(0, 10);
      const count = items.filter((item) => item.dados.created_at?.startsWith(key)).length;
      trend.push(count);
    }
    const criadosHoje = trend[trend.length - 1] ?? 0;

    return {
      total: items.length,
      pastas: pastas.length,
      documentos: documentos.length,
      arquivos: arquivos.length,
      storageValue,
      storageUnit,
      totalBytes,
      topMimeLabel: topMime ? `${topMime[1]} ${topMime[0].toLowerCase()}` : 'Sem arquivos',
      criadosHoje,
      trend,
    };
  }, [items]);

  return (
    <div className={`grid grid-cols-2 lg:grid-cols-4 gap-3 ${className ?? ''}`}>
      {/* ── Itens ─────────────────────────────────────────── */}
      <GlassPanel className={cn(/* design-system-escape: px-4 padding direcional sem Inset equiv.; py-3 padding direcional sem Inset equiv. */ "px-4 py-3")}>
        <div className={cn("flex items-start justify-between inline-tight")}>
          <div className="min-w-0">
            <p className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading>; tracking-wider sem token DS */ "text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider")}>
              Itens
            </p>
            <div className={cn(/* design-system-escape: gap-1.5 gap sem token DS */ "flex items-baseline gap-1.5 mt-1")}>
              <Text variant="kpi-value">
                <AnimatedNumber value={stats.total} />
              </Text>
              <span className="text-[10px] text-muted-foreground/40">neste nível</span>
            </div>
          </div>
          <IconContainer size="md" className="bg-primary/8">
            <Layers className="size-4 text-primary/50" />
          </IconContainer>
        </div>
        <div className={cn("mt-2.5 flex items-center inline-tight")}>
          <span className="text-[9px] text-muted-foreground/50">
            {stats.criadosHoje > 0
              ? `${stats.criadosHoje} criado${stats.criadosHoje > 1 ? 's' : ''} hoje`
              : 'Nenhum criado hoje'}
          </span>
        </div>
      </GlassPanel>

      {/* ── Pastas ────────────────────────────────────────── */}
      <GlassPanel className={cn(/* design-system-escape: px-4 padding direcional sem Inset equiv.; py-3 padding direcional sem Inset equiv. */ "px-4 py-3")}>
        <div className={cn("flex items-start justify-between inline-tight")}>
          <div className="min-w-0">
            <p className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading>; tracking-wider sem token DS */ "text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider")}>
              Pastas
            </p>
            <div className={cn(/* design-system-escape: gap-1.5 gap sem token DS */ "flex items-baseline gap-1.5 mt-1")}>
              <Text variant="kpi-value">
                <AnimatedNumber value={stats.pastas} />
              </Text>
              <span className="text-[10px] text-muted-foreground/40">
                {stats.pastas === 1 ? 'pasta' : 'pastas'}
              </span>
            </div>
          </div>
          <IconContainer size="md" className="bg-warning/8">
            <FolderClosed className="size-4 text-warning/50" />
          </IconContainer>
        </div>
        <div className={cn("mt-2.5 flex items-center inline-tight")}>
          <div className="flex-1 h-1 rounded-full bg-muted/30 overflow-hidden">
            <div
              className="h-full rounded-full bg-warning/25 transition-all duration-500"
              style={{
                width: `${
                  stats.total > 0 ? Math.round((stats.pastas / stats.total) * 100) : 0
                }%`,
              }}
            />
          </div>
          <span className="text-[9px] tabular-nums text-muted-foreground/50 shrink-0">
            {stats.total > 0 ? Math.round((stats.pastas / stats.total) * 100) : 0}%
          </span>
        </div>
      </GlassPanel>

      {/* ── Documentos ───────────────────────────────────── */}
      <GlassPanel className={cn(/* design-system-escape: px-4 padding direcional sem Inset equiv.; py-3 padding direcional sem Inset equiv. */ "px-4 py-3")}>
        <div className={cn("flex items-start justify-between inline-tight")}>
          <div className="min-w-0">
            <p className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading>; tracking-wider sem token DS */ "text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider")}>
              Documentos
            </p>
            <div className={cn(/* design-system-escape: gap-1.5 gap sem token DS */ "flex items-baseline gap-1.5 mt-1")}>
              <Text variant="kpi-value">
                <AnimatedNumber value={stats.documentos} />
              </Text>
              <span className="text-[10px] text-muted-foreground/40">
                + {stats.arquivos} arquivo{stats.arquivos === 1 ? '' : 's'}
              </span>
            </div>
          </div>
          <IconContainer size="md" className="bg-info/8">
            <FileText className="size-4 text-info/50" />
          </IconContainer>
        </div>
        <div className={cn("mt-2.5 flex items-center inline-tight")}>
          <div className="flex-1 h-1 rounded-full bg-muted/30 overflow-hidden">
            <div
              className="h-full rounded-full bg-info/25 transition-all duration-500"
              style={{
                width: `${
                  stats.total > 0
                    ? Math.round(((stats.documentos + stats.arquivos) / stats.total) * 100)
                    : 0
                }%`,
              }}
            />
          </div>
          <span className="text-[9px] tabular-nums text-muted-foreground/50 shrink-0">
            {stats.total > 0
              ? Math.round(((stats.documentos + stats.arquivos) / stats.total) * 100)
              : 0}
            %
          </span>
        </div>
      </GlassPanel>

      {/* ── Armazenamento ─────────────────────────────────── */}
      <GlassPanel className={cn(/* design-system-escape: px-4 padding direcional sem Inset equiv.; py-3 padding direcional sem Inset equiv. */ "px-4 py-3")}>
        <div className={cn("flex items-start justify-between inline-tight")}>
          <div className="min-w-0">
            <p className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading>; tracking-wider sem token DS */ "text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider")}>
              Armazenamento
            </p>
            <div className={cn(/* design-system-escape: gap-1.5 gap sem token DS */ "flex items-baseline gap-1.5 mt-1")}>
              <Text variant="kpi-value">
                {stats.storageValue}
              </Text>
              <span className="text-[10px] text-muted-foreground/40">{stats.storageUnit}</span>
            </div>
          </div>
          <IconContainer size="md" className="bg-success/8">
            <HardDrive className="size-4 text-success/50" />
          </IconContainer>
        </div>
        <div className="mt-2.5">
          <span className="text-[9px] text-muted-foreground/50 truncate block">
            {stats.topMimeLabel}
          </span>
        </div>
      </GlassPanel>
    </div>
  );
}
