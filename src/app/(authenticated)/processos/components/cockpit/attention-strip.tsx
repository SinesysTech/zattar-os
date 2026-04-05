'use client';

import { useMemo } from 'react';
import { Calendar, FileText, Microscope, ChevronRight, Clock, AlertTriangle } from 'lucide-react';
import { format, differenceInDays, differenceInHours, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { GlassPanel } from '@/app/(authenticated)/dashboard/mock/widgets/primitives';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Audiencia } from '@/app/(authenticated)/audiencias';
import type { Expediente } from '@/app/(authenticated)/expedientes';
import type { Pericia } from '@/app/(authenticated)/pericias';

interface AttentionStripProps {
  audiencias: Audiencia[];
  expedientes: Expediente[];
  pericias: Pericia[];
  onOpenAllDetails: () => void;
  onOpenAudiencia?: (audiencia: Audiencia) => void;
}

function formatCountdown(dataInicio: string): { label: string; urgency: 'low' | 'medium' | 'high' } {
  const target = new Date(dataInicio);
  const now = new Date();
  if (isPast(target)) return { label: 'Em andamento', urgency: 'high' };

  const days = differenceInDays(target, now);
  const hours = differenceInHours(target, now) % 24;

  if (days > 3) return { label: `em ${days}d`, urgency: 'low' };
  if (days > 0) return { label: `em ${days}d ${hours}h`, urgency: 'medium' };
  return { label: `em ${hours}h`, urgency: 'high' };
}

const URGENCY_STYLES = {
  low: 'text-primary/70',
  medium: 'text-warning',
  high: 'text-destructive',
};

export function AttentionStrip({
  audiencias,
  expedientes,
  pericias,
  onOpenAllDetails,
  onOpenAudiencia,
}: AttentionStripProps) {
  const proximaAudiencia = useMemo(() => {
    const now = new Date();
    const futuras = audiencias
      .filter((a) => {
        const status = (a.status || '').toUpperCase();
        return status === 'MARCADA';
      })
      .filter((a) => new Date(a.dataFim || a.dataInicio) >= now)
      .sort((a, b) => new Date(a.dataInicio).getTime() - new Date(b.dataInicio).getTime());
    return futuras[0] || null;
  }, [audiencias]);

  const expedientesUrgentes = useMemo(() => {
    const vencidos = expedientes.filter((e) => e.prazoVencido && !e.baixadoEm);
    const vencendo = expedientes.filter(
      (e) => !e.prazoVencido && !e.baixadoEm && e.dataPrazoLegalParte && differenceInDays(new Date(e.dataPrazoLegalParte), new Date()) <= 5
    );
    return { vencidos, vencendo, total: vencidos.length + vencendo.length };
  }, [expedientes]);

  const periciasPendentes = useMemo(
    () => pericias.filter((p) => !p.laudoJuntado),
    [pericias]
  );

  const hasUrgency = proximaAudiencia || expedientesUrgentes.total > 0 || periciasPendentes.length > 0;
  if (!hasUrgency) return null;

  return (
    <GlassPanel depth={2} className="mx-4 mt-2 shrink-0">
      <div className="flex items-stretch overflow-x-auto">
        {proximaAudiencia && (() => {
          const countdown = formatCountdown(proximaAudiencia.dataInicio);
          return (
            <div className="flex-1 min-w-[200px] px-4 py-3">
              <div className="flex items-center gap-2 mb-1.5">
                <Calendar className="size-3.5 text-primary/40" />
                <span className="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-wider">
                  Próxima Audiência
                </span>
                <span className={cn('text-[10px] font-bold tabular-nums ml-auto', URGENCY_STYLES[countdown.urgency])}>
                  {countdown.label}
                </span>
              </div>
              <p className="text-xs font-medium truncate">
                {proximaAudiencia.tipoDescricao || 'Audiência'}
              </p>
              <p className="text-[10px] text-muted-foreground/50 mt-0.5">
                {format(new Date(proximaAudiencia.dataInicio), "dd/MM 'às' HH:mm", { locale: ptBR })}
              </p>
              {onOpenAudiencia && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-1.5 h-6 px-2 text-[10px]"
                  onClick={() => onOpenAudiencia(proximaAudiencia)}
                >
                  Ver detalhes <ChevronRight className="size-3 ml-0.5" />
                </Button>
              )}
            </div>
          );
        })()}

        {proximaAudiencia && expedientesUrgentes.total > 0 && (
          <div className="w-px bg-border/10 shrink-0" />
        )}

        {expedientesUrgentes.total > 0 && (
          <div className="flex-1 min-w-[180px] px-4 py-3">
            <div className="flex items-center gap-2 mb-1.5">
              <FileText className="size-3.5 text-warning/40" />
              <span className="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-wider">
                Prazos
              </span>
            </div>
            {expedientesUrgentes.vencidos.length > 0 && (
              <div className="flex items-center gap-1.5 mb-1">
                <AlertTriangle className="size-3 text-destructive/70" />
                <span className="text-[10px] font-medium text-destructive/70">
                  {expedientesUrgentes.vencidos.length} vencido{expedientesUrgentes.vencidos.length > 1 ? 's' : ''}
                </span>
              </div>
            )}
            {expedientesUrgentes.vencendo.length > 0 && (
              <div className="flex items-center gap-1.5">
                <Clock className="size-3 text-warning/70" />
                <span className="text-[10px] font-medium text-warning/70">
                  {expedientesUrgentes.vencendo.length} vencendo
                </span>
              </div>
            )}
          </div>
        )}

        {(proximaAudiencia || expedientesUrgentes.total > 0) && periciasPendentes.length > 0 && (
          <div className="w-px bg-border/10 shrink-0" />
        )}

        {periciasPendentes.length > 0 && (
          <div className="flex-1 min-w-[160px] px-4 py-3">
            <div className="flex items-center gap-2 mb-1.5">
              <Microscope className="size-3.5 text-info/40" />
              <span className="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-wider">
                Perícias
              </span>
            </div>
            <span className="text-[10px] font-medium text-info/70">
              {periciasPendentes.length} pendente{periciasPendentes.length > 1 ? 's' : ''}
            </span>
          </div>
        )}

        <div className="flex items-center px-3 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2.5 text-[10px] text-muted-foreground/50"
            onClick={onOpenAllDetails}
          >
            Ver todos <ChevronRight className="size-3 ml-0.5" />
          </Button>
        </div>
      </div>
    </GlassPanel>
  );
}
