'use client';

import { useState } from 'react';
import { CheckCircle2} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/typography';
import { cn } from '@/lib/utils';
import { GazetteTimeline } from './gazette-timeline';
import { useGazetteStore } from './hooks/use-gazette-store';
import type { SyncLogEntry } from '@/app/(authenticated)/comunica-cnj/domain';
import type { TimelineItem } from './gazette-timeline';

import { LoadingSpinner } from "@/components/ui/loading-state"
// ─── Types ───────────────────────────────────────────────────────────────────

interface GazetteSyncDialogProps {
  trigger: React.ReactNode;
}

type Section = 'sincronizar' | 'historico';

interface MockSyncResult {
  total: number;
  novos: number;
  duplicados: number;
  vinculados: number;
  orfaos: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatSyncDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function buildTimelineItems(logs: SyncLogEntry[]): TimelineItem[] {
  return logs.map((log) => {
    const tipoLabel = log.tipo === 'manual' ? 'Manual' : 'Auto';
    const statusColor =
      log.status === 'sucesso'
        ? 'bg-success/10 text-success border border-success/20'
        : log.status === 'erro'
          ? 'bg-destructive/10 text-destructive border border-destructive/20'
          : 'bg-info/10 text-info border border-info/20';
    const statusLabel =
      log.status === 'sucesso'
        ? 'Sucesso'
        : log.status === 'erro'
          ? 'Erro'
          : 'Em andamento';

    const badge = (
      <div className={cn(/* design-system-escape: gap-1 gap sem token DS */ "flex items-center gap-1")}>
        <span className={cn(/* design-system-escape: px-1.5 padding direcional sem Inset equiv.; py-0.5 padding direcional sem Inset equiv.; font-medium → className de <Text>/<Heading> */ "text-[9px] px-1.5 py-0.5 rounded bg-muted/40 text-muted-foreground border border-border/50 font-medium")}>
          {tipoLabel}
        </span>
        <span className={cn(/* design-system-escape: px-1.5 padding direcional sem Inset equiv.; py-0.5 padding direcional sem Inset equiv.; font-medium → className de <Text>/<Heading> */ 'text-[9px] px-1.5 py-0.5 rounded font-medium', statusColor)}>
          {statusLabel}
        </span>
      </div>
    );

    const text = `Total: ${log.totalProcessados} · Novos: ${log.novos} · Órfãos: ${log.orfaos}`;
    const firstError = log.erros?.[0]?.mensagem;
    const subtext =
      log.status === 'erro' && firstError ? firstError : undefined;

    return {
      id: log.id,
      badge,
      date: formatSyncDate(log.createdAt),
      text,
      subtext,
      isCurrent: log.status === 'em_andamento',
    };
  });
}

// ─── Result metrics mini-grid ─────────────────────────────────────────────────

function SyncResultGrid({ result }: { result: MockSyncResult }) {
  const items = [
    { label: 'Total', value: result.total, color: 'text-foreground' },
    { label: 'Novos', value: result.novos, color: 'text-success' },
    { label: 'Duplicados', value: result.duplicados, color: 'text-muted-foreground' },
    { label: 'Vinculados', value: result.vinculados, color: 'text-primary' },
    { label: 'Órfãos', value: result.orfaos, color: 'text-warning' },
  ] as const;

  return (
    <div className={cn(/* design-system-escape: gap-1.5 gap sem token DS; p-3 → usar <Inset> */ "grid grid-cols-5 gap-1.5 rounded-lg bg-muted/20 border border-border/30 p-3")}>
      {items.map(({ label, value, color }) => (
        <div key={label} className={cn(/* design-system-escape: gap-0.5 gap sem token DS */ "flex flex-col items-center gap-0.5")}>
          <span className={cn(/* design-system-escape: font-semibold → className de <Text>/<Heading> */ 'text-body font-semibold tabular-nums', color)}>
            {value}
          </span>
          <span className="text-[9px] text-muted-foreground">{label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── GazetteSyncDialog ───────────────────────────────────────────────────────

export function GazetteSyncDialog({ trigger }: GazetteSyncDialogProps) {
  const [open, setOpen] = useState(false);
  const [section, setSection] = useState<Section>('sincronizar');
  const [result, setResult] = useState<MockSyncResult | null>(null);

  const syncLogs = useGazetteStore((s) => s.syncLogs);
  const isSyncing = useGazetteStore((s) => s.isSyncing);
  const setIsSyncing = useGazetteStore((s) => s.setIsSyncing);

  const handleSync = () => {
    setResult(null);
    setIsSyncing(true);

    setTimeout(() => {
      setIsSyncing(false);
      setResult({
        total: 48,
        novos: 12,
        duplicados: 30,
        vinculados: 9,
        orfaos: 3,
      });
    }, 2000);
  };

  const timelineItems = buildTimelineItems(syncLogs);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>

      <DialogContent className=" max-w-md">
        <DialogHeader>
          <DialogTitle>Sincronização</DialogTitle>
        </DialogHeader>

        {/* Section toggle */}
        <div className={cn(/* design-system-escape: p-0.5 → usar <Inset> */ "flex items-center p-0.5 bg-muted/30 rounded-md w-fit")}>
          <button
            type="button"
            onClick={() => setSection('sincronizar')}
            className={cn(
              /* design-system-escape: px-3 padding direcional sem Inset equiv.; py-1.5 padding direcional sem Inset equiv.; text-xs → migrar para <Text variant="caption" as="div">; font-medium → className de <Text>/<Heading> */ /* design-system-escape: px-3 padding direcional sem Inset equiv.; py-1.5 padding direcional sem Inset equiv.; font-medium → className de <Text>/<Heading> */ 'px-3 py-1.5 rounded-sm text-caption font-medium transition-all',
              section === 'sincronizar'
                ? 'bg-background shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            Sincronizar
          </button>
          <button
            type="button"
            onClick={() => setSection('historico')}
            className={cn(
              /* design-system-escape: px-3 padding direcional sem Inset equiv.; py-1.5 padding direcional sem Inset equiv.; text-xs → migrar para <Text variant="caption">; font-medium → className de <Text>/<Heading> */ /* design-system-escape: px-3 padding direcional sem Inset equiv.; py-1.5 padding direcional sem Inset equiv.; font-medium → className de <Text>/<Heading> */ 'px-3 py-1.5 rounded-sm text-caption font-medium transition-all',
              section === 'historico'
                ? 'bg-background shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            Histórico
          </button>
        </div>

        {/* ── Section: Sincronizar ── */}
        {section === 'sincronizar' && (
          <div className={cn(/* design-system-escape: pt-1 padding direcional sem Inset equiv. */ "flex flex-col inline-default pt-1")}>
            <Text variant="caption" className={cn(/* design-system-escape: leading-relaxed sem token DS */ "text-muted-foreground leading-relaxed")}>
              Dispare uma sincronização manual para buscar novas publicações
              do Comunicação CNJ.
            </Text>

            {/* CTA button */}
            <Button
              onClick={handleSync}
              disabled={isSyncing}
              className="w-full"
            >
              {isSyncing ? (
                <span className={cn("flex items-center inline-tight")}>
                  <LoadingSpinner />
                  Sincronizando...
                </span>
              ) : result ? (
                <span className={cn("flex items-center inline-tight")}>
                  <CheckCircle2 className="size-4 text-success" />
                  Sincronizar novamente
                </span>
              ) : (
                'Iniciar Sincronização'
              )}
            </Button>

            {/* Results grid */}
            {result && !isSyncing && (
              <div className={cn("flex flex-col inline-tight")}>
                <Text variant="caption" className="font-medium">
                  Resultado da sincronização
                </Text>
                <SyncResultGrid result={result} />
              </div>
            )}
          </div>
        )}

        {/* ── Section: Histórico ── */}
        {section === 'historico' && (
          <div className={cn(/* design-system-escape: gap-3 gap sem token DS; pt-1 padding direcional sem Inset equiv. */ "flex flex-col gap-3 pt-1")}>
            {syncLogs.length === 0 ? (
              <p className={cn(/* design-system-escape: py-4 padding direcional sem Inset equiv. */ "text-body-sm text-muted-foreground py-4 text-center")}>
                Nenhuma sincronização registrada
              </p>
            ) : (
              <div className={cn(/* design-system-escape: pr-1 padding direcional sem Inset equiv. */ "max-h-80 overflow-y-auto pr-1")}>
                <GazetteTimeline items={timelineItems} />
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
