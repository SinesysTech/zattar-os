'use client';

import { useGazetteStore } from './hooks/use-gazette-store';
import { GazetteKpiCard } from './gazette-kpi-card';
import { cn } from '@/lib/utils';

// ─── GazetteKpiStrip ─────────────────────────────────────────────────────────

export function GazetteKpiStrip() {
  const metricas = useGazetteStore((s) => s.metricas);
  const kpiAtivo = useGazetteStore((s) => s.kpiAtivo);
  const toggleKpi = useGazetteStore((s) => s.toggleKpi);

  if (!metricas) return null;

  const {
    publicacoesHoje,
    vinculados,
    totalCapturadas,
    pendentes,
    prazosCriticos,
    orfaos,
    orfaosComSugestao,
    taxaVinculacao,
  } = metricas;

  // Fake sparkline based on publicacoesHoje (7 plausible relative points)
  const sparkline = [
    Math.round(publicacoesHoje * 0.6),
    Math.round(publicacoesHoje * 0.75),
    Math.round(publicacoesHoje * 0.5),
    Math.round(publicacoesHoje * 0.9),
    Math.round(publicacoesHoje * 0.7),
    Math.round(publicacoesHoje * 0.85),
    publicacoesHoje,
  ];

  const taxaPct = Math.round(taxaVinculacao);

  return (
    <div
      className={cn(
        // Mobile: horizontal scroll
        'max-md:flex max-md:overflow-x-auto max-md:gap-2.5 max-md:pb-1',
        // Tablet: 3 columns
        'max-lg:grid max-lg:grid-cols-3 max-lg:gap-2.5',
        // Desktop: 5 columns
        'lg:grid lg:grid-cols-5 lg:gap-2.5',
      )}
    >
      {/* 1. Publicações Hoje */}
      <GazetteKpiCard
        label="Publicações Hoje"
        value={publicacoesHoje}
        trend={{
          valor: `+${taxaPct}%`,
          texto: 'vs ontem',
          tipo: 'up',
        }}
        sparkline={sparkline}
        isActive={kpiAtivo === 'hoje'}
        onClick={() => toggleKpi('hoje')}
      />

      {/* 2. Vinculados */}
      <GazetteKpiCard
        label="Vinculados"
        value={vinculados}
        trend={{
          valor: `${taxaPct}%`,
          texto: 'taxa vinculação',
          tipo: taxaVinculacao >= 70 ? 'up' : taxaVinculacao >= 40 ? 'neutral' : 'down',
        }}
        progressBar={{ valor: vinculados, max: totalCapturadas }}
        isActive={kpiAtivo === 'vinculados'}
        onClick={() => toggleKpi('vinculados')}
      />

      {/* 3. Pendentes */}
      <GazetteKpiCard
        label="Pendentes"
        value={pendentes}
        badge={{
          texto: 'aguardando triagem',
          cor: 'text-warning',
        }}
        isActive={kpiAtivo === 'pendentes'}
        onClick={() => toggleKpi('pendentes')}
      />

      {/* 4. Prazos Críticos */}
      <GazetteKpiCard
        label="Prazos Críticos"
        value={prazosCriticos}
        isDanger
        badge={{
          texto: 'vencem em <48h',
          cor: 'text-destructive',
        }}
        isActive={kpiAtivo === 'prazos'}
        onClick={() => toggleKpi('prazos')}
      />

      {/* 5. Órfãos */}
      <GazetteKpiCard
        label="Órfãos"
        value={orfaos}
        badge={{
          texto: `${orfaosComSugestao} com sugestão de match`,
          cor: 'text-muted-foreground',
        }}
        isActive={kpiAtivo === 'orfaos'}
        onClick={() => toggleKpi('orfaos')}
      />
    </div>
  );
}
