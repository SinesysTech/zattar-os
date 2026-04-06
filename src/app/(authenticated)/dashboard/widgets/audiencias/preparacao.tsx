'use client';

/**
 * Widget: Preparação para Audiências
 * ============================================================================
 * Conectado ao hook useDashboard() → proximasAudiencias (AudienciaProxima[]).
 * Calcula score de preparação baseado nos campos disponíveis: responsável,
 * tipo de audiência, URL virtual e local presencial.
 *
 * Uso:
 *   import { WidgetPreparacao } from '@/app/(authenticated)/dashboard/widgets/audiencias/preparacao'
 * ============================================================================
 */

import { Calendar, Clock, FileText, Video } from 'lucide-react';
import {
  ProgressRing,
  InsightBanner,
  WidgetContainer,
} from '../../mock/widgets/primitives';
import { WidgetSkeleton } from '../shared/widget-skeleton';
import { formatarPartes, obterContextoProcesso } from '../shared/processo-display';
import { useDashboard } from '../../hooks/use-dashboard';
import type { AudienciaProxima } from '../../domain';

// Formatar data de audiência para exibição amigável
function formatarDataAudiencia(dateStr: string): string {
  try {
    // Suporta tanto "2025-04-06" quanto "2025-04-06T00:00:00.000Z"
    const d = new Date(dateStr.includes('T') ? dateStr : dateStr + 'T00:00:00');
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  } catch {
    return dateStr;
  }
}

/**
 * Calcula score de preparação baseado nos campos disponíveis em AudienciaProxima.
 * Pesos: responsável (30%), tipo definido (20%), URL virtual (25%), local (25%).
 */
function calcPrepScoreFromProxima(a: AudienciaProxima): number {
  const items = [
    { done: !!a.responsavel_id, weight: 30 },
    { done: !!a.tipo_audiencia, weight: 20 },
    { done: !!a.url_audiencia_virtual, weight: 25 },
    { done: !!a.local || !!a.sala, weight: 25 },
  ];
  const totalWeight = items.reduce((acc, i) => acc + i.weight, 0);
  const doneWeight = items.filter((i) => i.done).reduce((acc, i) => acc + i.weight, 0);
  return totalWeight > 0 ? Math.round((doneWeight / totalWeight) * 100) : 0;
}

function scoreColor(score: number): string {
  if (score >= 80) return 'var(--success)';
  if (score >= 50) return 'var(--warning)';
  return 'var(--destructive)';
}

export function WidgetPreparacao() {
  const { data, isLoading, error } = useDashboard();

  if (isLoading) return <WidgetSkeleton size="md" />;

  if (error || !data) {
    return <WidgetSkeleton size="md" />;
  }

  const audiencias = data.proximasAudiencias.slice(0, 3);

  // Calcular média de preparação
  const mediaPrep = audiencias.length > 0
    ? Math.round(audiencias.reduce((acc, a) => acc + calcPrepScoreFromProxima(a), 0) / audiencias.length)
    : 0;

  return (
    <WidgetContainer
      title="Preparação para Audiências"
      icon={FileText}
      subtitle="Próximas 3 audiências"
      depth={1}
    >
      {audiencias.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 gap-2">
          <p className="text-[11px] text-muted-foreground/60">
            Nenhuma audiência próxima registrada.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {audiencias.map((audiencia) => {
            const prepScore = calcPrepScoreFromProxima(audiencia);
            const ringColor = scoreColor(prepScore);
            const partesTexto = formatarPartes(audiencia.polo_ativo_nome, audiencia.polo_passivo_nome);
            const contextoProcesso = obterContextoProcesso(audiencia);
            return (
              <div
                key={audiencia.id}
                className="flex items-center gap-3 px-2 py-2 -mx-2 rounded-xl hover:bg-white/4 transition-colors duration-150"
              >
                <ProgressRing
                  percent={prepScore}
                  size={40}
                  color={ringColor}
                />

                {/* Informações da audiência */}
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium leading-tight">
                    {audiencia.tipo_audiencia ?? 'Audiência'}
                  </p>
                  {partesTexto && (
                    <p className="text-[10px] text-foreground/65 mt-0.5 leading-tight">
                      {partesTexto}
                    </p>
                  )}
                  {contextoProcesso && (
                    <p className="text-[9px] text-foreground/55 mt-0.5 leading-tight">
                      {contextoProcesso}
                    </p>
                  )}
                  <p className="text-[9px] text-muted-foreground/60 font-mono break-all leading-relaxed mt-0.5">
                    {audiencia.numero_processo}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex items-center gap-1 text-[9px] text-muted-foreground/50">
                      <Calendar className="size-2.5" />
                      <span>{formatarDataAudiencia(audiencia.data_audiencia)}</span>
                    </div>
                    {audiencia.hora_audiencia && (
                      <div className="flex items-center gap-1 text-[9px] text-muted-foreground/50">
                        <Clock className="size-2.5" />
                        <span>{audiencia.hora_audiencia}</span>
                      </div>
                    )}
                    {audiencia.url_audiencia_virtual && (
                      <div className="flex items-center gap-1 text-[9px] text-muted-foreground/60">
                        <Video className="size-2.5 shrink-0" />
                        <span>Ambiente virtual</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {audiencias.length > 0 && mediaPrep < 80 && (
        <div className="mt-4">
          <InsightBanner type="alert">
            Preparação média de {mediaPrep}% — revise responsáveis, links e locais das próximas audiências.
          </InsightBanner>
        </div>
      )}

      {audiencias.length > 0 && mediaPrep >= 80 && (
        <div className="mt-4">
          <InsightBanner type="success">
            Preparação média de {mediaPrep}% — audiências bem encaminhadas.
          </InsightBanner>
        </div>
      )}
    </WidgetContainer>
  );
}
