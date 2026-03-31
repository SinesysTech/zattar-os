/**
 * WIDGET GALLERY — Seção: Processos
 * ============================================================================
 * Widgets de visualização do módulo de Processos (causas jurídicas).
 * Estética "Glass Briefing" — painel escuro, bordas sutis, dados compactos.
 *
 * USO: import { ProcessosWidgets } from './section-processos'
 * ============================================================================
 */

'use client';

import { BarChart3, PieChart, Scale, TrendingUp, LayoutGrid, Activity } from 'lucide-react';
import {
  GallerySection,
  WidgetContainer,
  Sparkline,
  MiniDonut,
  StackedBar,
  Stat,
  ProgressRing,
  UrgencyDot,
  ListItem,
  MiniArea,
  fmtNum,
} from './primitives';

// ─── Mock Data ──────────────────────────────────────────────────────────────

const STATUS_SEGMENTS = [
  { value: 89, color: 'hsl(var(--primary))',       label: 'Ativos' },
  { value: 7,  color: 'hsl(var(--warning))',        label: 'Suspensos' },
  { value: 31, color: 'hsl(var(--muted-foreground) / 0.3)', label: 'Arquivados' },
  { value: 12, color: 'hsl(220 70% 60%)',           label: 'Em Recurso' },
];

const TRT_DATA = [
  { label: 'TRT1 — RJ',         value: 34 },
  { label: 'TRT2 — SP',         value: 28 },
  { label: 'TRT3 — MG',         value: 19 },
  { label: 'TRT15 — Campinas',  value: 15 },
  { label: 'TRT4 — RS',         value: 11 },
];

// últimos 8 meses: Jul → Fev
const MONTHLY_TREND = [8, 11, 9, 14, 12, 17, 13, 16];
const MONTH_LABELS  = ['Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez', 'Jan', 'Fev'];

const AGING_SEGMENTS = [
  { value: 45, color: 'hsl(142 60% 45%)',  label: '< 1 ano' },
  { value: 32, color: 'hsl(60  70% 50%)',  label: '1–2 anos' },
  { value: 28, color: 'hsl(30  80% 52%)',  label: '2–5 anos' },
  { value: 22, color: 'hsl(0   70% 55%)',  label: '> 5 anos' },
];

const SEGMENTO_SEGMENTS = [
  { value: 68, color: 'hsl(var(--primary))',  label: 'Trabalhista' },
  { value: 31, color: 'hsl(220 70% 60%)',     label: 'Cível' },
  { value: 15, color: 'hsl(280 60% 60%)',     label: 'Previdenciário' },
  { value: 8,  color: 'hsl(var(--warning))',  label: 'Empresarial' },
  { value: 5,  color: 'hsl(var(--destructive))', label: 'Criminal' },
];

const TOTAL_PROCESSOS  = 139;
const ATIVOS_COUNT     = 89;
const RESOLVIDOS_MES   = 13;
const NOVOS_MES        = 16;
const TAXA_RESOLUCAO   = Math.round((RESOLVIDOS_MES / (RESOLVIDOS_MES + NOVOS_MES)) * 100);

const TRT_MAX = TRT_DATA[0].value;

// ─── Widget 1: Distribuição por Status ──────────────────────────────────────

function WidgetStatusDistribuicao() {
  const total = STATUS_SEGMENTS.reduce((s, seg) => s + seg.value, 0);

  return (
    <WidgetContainer
      title="Distribuição por Status"
      icon={PieChart}
      subtitle="Total de processos ativos"
      depth={1}
    >
      <div className="flex items-center gap-5">
        <MiniDonut
          segments={STATUS_SEGMENTS}
          size={88}
          strokeWidth={11}
          centerLabel={fmtNum(total)}
        />
        <div className="flex flex-col gap-2 flex-1 min-w-0">
          {STATUS_SEGMENTS.map((seg) => (
            <div key={seg.label} className="flex items-center gap-2">
              <span
                className="size-2 rounded-full shrink-0"
                style={{ backgroundColor: seg.color }}
              />
              <span className="text-[10px] text-muted-foreground/60 truncate flex-1">
                {seg.label}
              </span>
              <span className="text-[10px] font-medium tabular-nums">
                {fmtNum(seg.value)}
              </span>
              <span className="text-[9px] text-muted-foreground/40 w-7 text-right tabular-nums">
                {Math.round((seg.value / total) * 100)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </WidgetContainer>
  );
}

// ─── Widget 2: Casos por Tribunal (TRT) ─────────────────────────────────────

function WidgetCasosTribunal() {
  return (
    <WidgetContainer
      title="Casos por Tribunal"
      icon={Scale}
      subtitle="Top 5 TRTs — volume atual"
      depth={1}
    >
      <div className="flex flex-col gap-2.5">
        {TRT_DATA.map((trt) => {
          const pct = Math.round((trt.value / TRT_MAX) * 100);
          return (
            <div key={trt.label}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-muted-foreground/70 truncate leading-none">
                  {trt.label}
                </span>
                <span className="text-[10px] font-semibold tabular-nums ml-2 shrink-0">
                  {trt.value}
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-border/15 overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary/50 transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </WidgetContainer>
  );
}

// ─── Widget 3: Tendência de Novos Processos ──────────────────────────────────

function WidgetTendenciaNovos() {
  const current = MONTHLY_TREND[MONTHLY_TREND.length - 1];
  const prev    = MONTHLY_TREND[MONTHLY_TREND.length - 2];
  const delta   = current - prev;
  const deltaLabel = `${delta >= 0 ? '+' : ''}${delta} vs. mês anterior`;

  return (
    <WidgetContainer
      title="Novos Processos"
      icon={TrendingUp}
      subtitle="Tendência — últimos 8 meses"
      depth={1}
    >
      <div className="flex items-end justify-between gap-3 mb-3">
        <Stat
          label="Este mês"
          value={fmtNum(current)}
          delta={deltaLabel}
          deltaType={delta > 0 ? 'negative' : 'positive'}
        />
        <MiniArea
          data={MONTHLY_TREND}
          width={110}
          height={44}
          color="hsl(var(--primary))"
        />
      </div>
      <div className="flex items-end justify-between pt-2 border-t border-border/10">
        {MONTHLY_TREND.map((v, i) => (
          <div key={i} className="flex flex-col items-center gap-0.5">
            <span className="text-[9px] text-muted-foreground/40 tabular-nums">{v}</span>
            <span className="text-[8px] text-muted-foreground/30">{MONTH_LABELS[i]}</span>
          </div>
        ))}
      </div>
    </WidgetContainer>
  );
}

// ─── Widget 4: Análise de Aging ──────────────────────────────────────────────

function WidgetAging() {
  const total = AGING_SEGMENTS.reduce((s, seg) => s + seg.value, 0);

  return (
    <WidgetContainer
      title="Aging dos Processos"
      icon={BarChart3}
      subtitle="Distribuição por tempo de duração"
      depth={1}
    >
      <StackedBar segments={AGING_SEGMENTS} height={10} />
      <div className="flex flex-col gap-2.5 mt-4">
        {AGING_SEGMENTS.map((seg) => {
          const pct = Math.round((seg.value / total) * 100);
          return (
            <div key={seg.label} className="flex items-center gap-2">
              <span
                className="size-2 rounded-sm shrink-0"
                style={{ backgroundColor: seg.color }}
              />
              <span className="text-[10px] text-muted-foreground/60 flex-1 truncate">
                {seg.label}
              </span>
              <div className="flex items-center gap-1.5">
                <div className="w-12 h-1 rounded-full bg-border/15 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, backgroundColor: seg.color }}
                  />
                </div>
                <span className="text-[10px] font-medium tabular-nums w-6 text-right">
                  {seg.value}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </WidgetContainer>
  );
}

// ─── Widget 5: Processos por Segmento ───────────────────────────────────────

function WidgetSegmento() {
  const total = SEGMENTO_SEGMENTS.reduce((s, seg) => s + seg.value, 0);
  const dominant = SEGMENTO_SEGMENTS[0];

  return (
    <WidgetContainer
      title="Por Segmento"
      icon={LayoutGrid}
      subtitle="Distribuição por área jurídica"
      depth={1}
    >
      <div className="flex items-center gap-4">
        <MiniDonut
          segments={SEGMENTO_SEGMENTS}
          size={76}
          strokeWidth={10}
          centerLabel={`${Math.round((dominant.value / total) * 100)}%`}
        />
        <div className="flex flex-col gap-1.5 flex-1 min-w-0">
          {SEGMENTO_SEGMENTS.map((seg) => {
            const pct = Math.round((seg.value / total) * 100);
            return (
              <div key={seg.label} className="flex items-center gap-2">
                <span
                  className="size-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: seg.color }}
                />
                <span className="text-[10px] text-muted-foreground/60 flex-1 truncate">
                  {seg.label}
                </span>
                <span className="text-[10px] tabular-nums text-muted-foreground/50">
                  {pct}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-border/10">
        <StackedBar segments={SEGMENTO_SEGMENTS} height={6} />
      </div>
    </WidgetContainer>
  );
}

// ─── Widget 6: KPI Pulse ─────────────────────────────────────────────────────

function WidgetKpiPulse() {
  return (
    <WidgetContainer
      title="Painel KPI"
      icon={Activity}
      subtitle="Resumo operacional — março 2026"
      depth={2}
    >
      <div className="grid grid-cols-2 gap-x-4 gap-y-3 mb-4">
        <Stat
          label="Total"
          value={fmtNum(TOTAL_PROCESSOS)}
          delta="carteira ativa"
          deltaType="neutral"
        />
        <Stat
          label="Ativos"
          value={fmtNum(ATIVOS_COUNT)}
          delta={`${Math.round((ATIVOS_COUNT / TOTAL_PROCESSOS) * 100)}% do total`}
          deltaType="neutral"
        />
        <Stat
          label="Novos / mês"
          value={fmtNum(NOVOS_MES)}
          delta="+3 vs. jan"
          deltaType="alert"
          small
        />
        <Stat
          label="Resolvidos / mês"
          value={fmtNum(RESOLVIDOS_MES)}
          delta="+1 vs. jan"
          deltaType="positive"
          small
        />
      </div>

      <div className="flex items-center gap-4 pt-3 border-t border-border/10">
        <div className="flex items-center gap-3">
          <ProgressRing
            percent={TAXA_RESOLUCAO}
            size={48}
            color="hsl(142 60% 45%)"
          />
          <div>
            <p className="text-[10px] text-muted-foreground/50 uppercase tracking-wider">
              Taxa de Resolucao
            </p>
            <p className="text-[10px] text-muted-foreground/40 mt-0.5">
              encerrados / (enc. + novos)
            </p>
          </div>
        </div>
        <div className="flex-1 flex flex-col items-end gap-1">
          <p className="text-[9px] text-muted-foreground/40 uppercase tracking-wider">
            Tendencia 8m
          </p>
          <Sparkline
            data={MONTHLY_TREND}
            width={72}
            height={24}
            color="hsl(142 60% 45%)"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1 mt-3 pt-3 border-t border-border/10">
        {[
          { label: 'Prazo vencendo esta semana', count: 4, level: 'alto' as const },
          { label: 'Audiencias no mes',           count: 9, level: 'medio' as const },
          { label: 'Aguardando documentos',       count: 6, level: 'baixo' as const },
        ].map((item) => (
          <ListItem key={item.label}>
            <UrgencyDot level={item.level} />
            <span className="text-[10px] text-muted-foreground/70 flex-1 truncate">
              {item.label}
            </span>
            <span className="text-[10px] font-semibold tabular-nums">{item.count}</span>
          </ListItem>
        ))}
      </div>
    </WidgetContainer>
  );
}

// ─── Export principal ────────────────────────────────────────────────────────

export function ProcessosWidgets() {
  return (
    <GallerySection
      title="Processos"
      description="Visualizacoes do modulo de causas juridicas — distribuicao, tendencias e indicadores operacionais."
    >
      <WidgetStatusDistribuicao />
      <WidgetCasosTribunal />
      <WidgetTendenciaNovos />
      <WidgetAging />
      <WidgetSegmento />
      <WidgetKpiPulse />
    </GallerySection>
  );
}
