'use client';

import { useMemo } from 'react';
import { CalendarClock, Clock, Link2, AlertTriangle } from 'lucide-react';
import { GlassPanel } from '@/components/shared/glass-panel';
import { IconContainer } from '@/components/ui/icon-container';
import {
  Sparkline,
  AnimatedNumber,
} from '@/app/(authenticated)/dashboard/widgets/primitives';
import type {
  ComunicacaoCNJEnriquecida,
  GazetteMetrics,
} from '@/app/(authenticated)/comunica-cnj/domain';

export interface GazetteMissionKpiStripProps {
  metricas: GazetteMetrics | null;
  comunicacoes: ComunicacaoCNJEnriquecida[];
  className?: string;
}

function nextDeadlineLabel(dias: number): string {
  if (dias <= 0) return 'Vencido';
  if (dias === 1) return 'Amanhã';
  return `${dias}d`;
}

export function GazetteMissionKpiStrip({
  metricas,
  comunicacoes,
  className,
}: GazetteMissionKpiStripProps) {
  const stats = useMemo(() => {
    const total = metricas?.totalCapturadas ?? comunicacoes.length;
    const vinculados =
      metricas?.vinculados ??
      comunicacoes.filter((c) => c.statusVinculacao === 'vinculado').length;
    const orfaos =
      metricas?.orfaos ??
      comunicacoes.filter((c) => c.statusVinculacao === 'orfao').length;
    const prazosCriticos =
      metricas?.prazosCriticos ??
      comunicacoes.filter(
        (c) => c.diasParaPrazo !== null && c.diasParaPrazo <= 3,
      ).length;

    const taxaVinculacao =
      total > 0 ? Math.round((vinculados / total) * 100) : 0;

    // Sparkline dos últimos 7 dias (publicações por dia de disponibilização)
    const now = new Date();
    const trend: number[] = [];
    for (let i = 6; i >= 0; i--) {
      const dia = new Date(now);
      dia.setDate(now.getDate() - i);
      const chave = dia.toISOString().slice(0, 10);
      const count = comunicacoes.filter((c) =>
        c.dataDisponibilizacao?.startsWith(chave),
      ).length;
      trend.push(count);
    }

    const publicacoesHoje = metricas?.publicacoesHoje ?? trend[trend.length - 1] ?? 0;

    // Próximo prazo dentre órfãos com prazo em aberto
    const proximo = comunicacoes
      .filter(
        (c) =>
          c.statusVinculacao === 'orfao' &&
          c.diasParaPrazo !== null &&
          c.diasParaPrazo >= 0,
      )
      .sort((a, b) => (a.diasParaPrazo ?? 0) - (b.diasParaPrazo ?? 0))[0];

    const proximoLabel = proximo && proximo.diasParaPrazo !== null
      ? nextDeadlineLabel(proximo.diasParaPrazo)
      : '—';
    const proximoDetail = proximo
      ? `${proximo.siglaTribunal ?? '—'} · ${proximo.tipoComunicacao ?? 'comunicação'}`
      : 'Sem prazos em aberto';

    return {
      total,
      vinculados,
      orfaos,
      prazosCriticos,
      taxaVinculacao,
      trend,
      publicacoesHoje,
      proximoLabel,
      proximoDetail,
    };
  }, [metricas, comunicacoes]);

  return (
    <div className={`grid grid-cols-2 lg:grid-cols-4 gap-3 ${className ?? ''}`}>
      {/* ── Publicações hoje ───────────────────────────── */}
      <GlassPanel className="px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">
              Publicações hoje
            </p>
            <div className="flex items-baseline gap-1.5 mt-1">
              <p className="font-display text-xl font-bold tabular-nums leading-none">
                <AnimatedNumber value={stats.publicacoesHoje} />
              </p>
              <span className="text-[10px] text-muted-foreground/40">
                / {stats.total.toLocaleString('pt-BR')} total
              </span>
            </div>
          </div>
          <IconContainer size="md" className="bg-primary/8">
            <CalendarClock className="size-4 text-primary/50" />
          </IconContainer>
        </div>
        {/* Sparkline 7 dias */}
        <div className="mt-2.5 flex items-center gap-2">
          <Sparkline
            data={stats.trend.length >= 2 ? stats.trend : [0, 0]}
            width={80}
            height={16}
          />
          {stats.trend.length >= 2 && stats.trend[0] > 0 && (
            <span
              className={`text-[9px] font-medium tabular-nums ${
                stats.trend[stats.trend.length - 1] >= stats.trend[0]
                  ? 'text-success/60'
                  : 'text-destructive/60'
              }`}
            >
              {`${stats.trend[stats.trend.length - 1] >= stats.trend[0] ? '+' : ''}${Math.round(
                ((stats.trend[stats.trend.length - 1] - stats.trend[0]) /
                  stats.trend[0]) *
                  100,
              )}%`}
            </span>
          )}
        </div>
      </GlassPanel>

      {/* ── Próximo prazo ──────────────────────────────── */}
      <GlassPanel className="px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">
              Próximo prazo
            </p>
            <div className="flex items-baseline gap-1.5 mt-1">
              <p className="font-display text-xl font-bold tabular-nums leading-none">
                {stats.proximoLabel}
              </p>
            </div>
          </div>
          <IconContainer size="md" className="bg-warning/8">
            <Clock className="size-4 text-warning/50" />
          </IconContainer>
        </div>
        <div className="mt-2.5">
          <span className="text-[9px] text-muted-foreground/50 truncate block">
            {stats.proximoDetail}
          </span>
        </div>
      </GlassPanel>

      {/* ── Vinculação ─────────────────────────────────── */}
      <GlassPanel className="px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">
              Vinculadas
            </p>
            <div className="flex items-baseline gap-1.5 mt-1">
              <p className="font-display text-xl font-bold tabular-nums leading-none">
                <AnimatedNumber value={stats.vinculados} />
              </p>
              <span className="text-[10px] text-muted-foreground/40">
                / {stats.total.toLocaleString('pt-BR')}
              </span>
            </div>
          </div>
          <IconContainer size="md" className="bg-success/8">
            <Link2 className="size-4 text-success/50" />
          </IconContainer>
        </div>
        {/* Barra de taxa de vinculação */}
        <div className="mt-2.5 flex items-center gap-2">
          <div className="flex-1 h-1 rounded-full bg-muted/30 overflow-hidden">
            <div
              className="h-full rounded-full bg-success/25 transition-all duration-500"
              style={{ width: `${stats.taxaVinculacao}%` }}
            />
          </div>
          <span className="text-[9px] tabular-nums text-muted-foreground/50 shrink-0">
            {stats.taxaVinculacao}%
          </span>
        </div>
      </GlassPanel>

      {/* ── Prazos críticos ────────────────────────────── */}
      <GlassPanel className="px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">
              Prazos críticos
            </p>
            <div className="flex items-baseline gap-1.5 mt-1">
              <p className="font-display text-xl font-bold tabular-nums leading-none">
                <AnimatedNumber value={stats.prazosCriticos} />
              </p>
              <span className="text-[10px] text-muted-foreground/40">
                {stats.orfaos} órfã{stats.orfaos === 1 ? '' : 's'}
              </span>
            </div>
          </div>
          <IconContainer size="md" className="bg-destructive/8">
            <AlertTriangle className="size-4 text-destructive/50" />
          </IconContainer>
        </div>
        {/* Barra dos prazos críticos no universo de órfãos */}
        <div className="mt-2.5 flex items-center gap-2">
          <div className="flex-1 h-1 rounded-full bg-muted/30 overflow-hidden">
            <div
              className="h-full rounded-full bg-destructive/30 transition-all duration-500"
              style={{
                width: `${
                  stats.orfaos > 0
                    ? Math.min(100, Math.round((stats.prazosCriticos / stats.orfaos) * 100))
                    : 0
                }%`,
              }}
            />
          </div>
          <span className="text-[9px] tabular-nums text-muted-foreground/50 shrink-0">
            {stats.orfaos > 0
              ? Math.round((stats.prazosCriticos / stats.orfaos) * 100)
              : 0}
            %
          </span>
        </div>
      </GlassPanel>
    </div>
  );
}
