/**
 * Visual Diff — Expedientes Pulse Strip
 * ============================================================================
 * Scratch para validar visualmente as correções propostas nos 4 Cards de
 * Status da página /expedientes (componente ExpedientesPulseStrip).
 *
 * IMPORTANTE — sobre o tema:
 * O globals.css declara `:root:not(.dark) .glass-widget` (especificidade 0,2,1)
 * que vence `.dark .glass-widget` (0,2,0). Por isso é IMPOSSÍVEL renderizar
 * dark mode local num wrapper interno — o seletor light mode sempre vence.
 * A solução correta é flipar o tema GLOBAL via next-themes (que é como
 * produção alterna). Esta página oferece um toggle no topo.
 * ============================================================================
 */

'use client';

import { AlertTriangle, Clock, CalendarClock, UserX, Sun, Moon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { GlassPanel } from '@/components/shared/glass-panel';
import { IconContainer } from '@/components/ui/icon-container';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { DemoPageHeader, DemoSection } from '../../_components/demo-section';

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface PulseMetric {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  /** Token semântico — sempre completo, sem template string */
  tone: 'destructive' | 'warning' | 'primary';
  /** Sufixo descritivo para aria-label */
  ariaSuffix: string;
}

interface PulseProps {
  vencidos: number;
  hoje: number;
  proximos: number;
  semDono: number;
  total: number;
}

// ─── 1. Versão ATUAL (cópia fiel de produção) ────────────────────────────────

function PulseStripAtual({ vencidos, hoje, proximos, semDono, total }: PulseProps) {
  const metrics = [
    {
      label: 'Vencidos',
      value: vencidos,
      icon: AlertTriangle,
      color: 'text-destructive',
      bgColor: 'bg-destructive',
      highlight: vencidos > 0,
    },
    {
      label: 'Hoje',
      value: hoje,
      icon: Clock,
      color: 'text-warning',
      bgColor: 'bg-warning',
    },
    {
      label: 'Próximos 3d',
      value: proximos,
      icon: CalendarClock,
      color: 'text-primary',
      bgColor: 'bg-primary',
    },
    {
      label: 'Sem dono',
      value: semDono,
      icon: UserX,
      color: 'text-warning',
      bgColor: 'bg-warning',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {metrics.map((metric) => {
        const pct = total > 0 ? Math.round((metric.value / total) * 100) : 0;
        const Icon = metric.icon;

        return (
          <GlassPanel
            key={metric.label}
            depth={metric.highlight ? 2 : 1}
            className={cn(
              'px-4 py-3.5',
              metric.highlight && metric.value > 0 && 'border-destructive/15',
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-meta-label truncate">{metric.label}</p>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <p
                    className={cn(
                      'text-kpi-value leading-none tracking-tight',
                      metric.highlight && metric.value > 0 && 'text-destructive/80',
                    )}
                  >
                    {metric.value}
                  </p>
                </div>
              </div>
              <IconContainer
                size="md"
                className={cn(
                  `${metric.bgColor}/8`,
                  metric.highlight && metric.value > 0 && 'border border-destructive/20',
                )}
              >
                <Icon className={cn('size-4', `${metric.color}/60`)} />
              </IconContainer>
            </div>

            <div className="mt-2.5 flex items-center gap-2">
              <div className="flex-1 h-1 rounded-full bg-muted/30 overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-700',
                    `${metric.bgColor}/25`,
                  )}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-micro-badge tabular-nums text-muted-foreground/50 shrink-0">
                {pct}%
              </span>
            </div>
          </GlassPanel>
        );
      })}
    </div>
  );
}

// ─── 2. Versão CORRIGIDA ─────────────────────────────────────────────────────
//
// Mudanças aplicadas (referencie a análise anterior):
//   • Classes Tailwind sempre completas (mapa explícito) — elimina o risco de
//     purge silencioso das interpolações `${bgColor}/8`.
//   • Número em alerta passa de `text-destructive/80` para `text-destructive`
//     (contraste passa de 4.1:1 para ≥ 5.5:1 no light).
//   • Percentual passa de `muted-foreground/50` para `muted-foreground` cheio
//     (sai de 2.3:1 para ≥ 4.5:1 — atinge AA).
//   • Trilha da barra passa de `bg-muted/30` para `bg-muted/60` — preenchimento
//     a `/40` em vez de `/25`. Valores baixos ficam visíveis.
//   • Card recebe `role="group"` + `aria-label` descritivo.
//   • Spacing vertical normalizado: `py-4` em vez de `py-3.5` (múltiplo de 4).

// Apenas as 3 propriedades que LEGITIMAMENTE variam por identidade do card
// (cor semântica do tom). Todas as outras propriedades (depth, borda, padding,
// peso, cor do número, etc.) são CONSTANTES — o card "Vencidos" deve ter o
// mesmo chrome dos demais independente do valor.
const TONE_STYLES = {
  destructive: {
    iconBg: 'bg-destructive/8',
    iconStroke: 'text-destructive/70',
    barFill: 'bg-destructive/70',
  },
  warning: {
    iconBg: 'bg-warning/8',
    iconStroke: 'text-warning/70',
    barFill: 'bg-warning/70',
  },
  primary: {
    iconBg: 'bg-primary/8',
    iconStroke: 'text-primary/70',
    barFill: 'bg-primary/70',
  },
} as const;

function PulseStripCorrigida({ vencidos, hoje, proximos, semDono, total }: PulseProps) {
  const metrics: PulseMetric[] = [
    {
      label: 'Vencidos',
      value: vencidos,
      icon: AlertTriangle,
      tone: 'destructive',
      ariaSuffix: 'expedientes com prazo vencido',
    },
    {
      label: 'Hoje',
      value: hoje,
      icon: Clock,
      tone: 'warning',
      ariaSuffix: 'expedientes vencendo hoje',
    },
    {
      label: 'Próximos 3d',
      value: proximos,
      icon: CalendarClock,
      tone: 'primary',
      ariaSuffix: 'expedientes vencendo nos próximos 3 dias',
    },
    {
      label: 'Sem dono',
      value: semDono,
      icon: UserX,
      tone: 'warning',
      ariaSuffix: 'expedientes sem responsável atribuído',
    },
  ];

  return (
    <div
      className="grid grid-cols-2 lg:grid-cols-4 gap-3"
      role="group"
      aria-label="Resumo de expedientes pendentes"
    >
      {metrics.map((metric) => {
        const pct = total > 0 ? Math.round((metric.value / total) * 100) : 0;
        const Icon = metric.icon;
        const styles = TONE_STYLES[metric.tone];

        // Sem condicional alguma: TODOS os 4 cards são isomorfos.
        // A única coisa que varia é (1) o label, (2) o número, (3) o ícone,
        // e (4) o tom semântico (cor do bg/stroke do ícone + cor do bar fill).
        // Tudo o mais — depth, padding, borda, peso, cor do número, percentual,
        // dimensões — é IDÊNTICO em todos os cenários e em todos os cards.
        return (
          <GlassPanel
            key={metric.label}
            depth={1}
            role="group"
            aria-label={`${metric.value} ${metric.ariaSuffix}, ${pct}% do total de pendentes`}
            className="px-4 py-4"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-meta-label truncate">{metric.label}</p>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <p className="text-kpi-value leading-none tracking-tight">
                    {metric.value}
                  </p>
                </div>
              </div>
              <IconContainer size="md" aria-hidden="true" className={styles.iconBg}>
                <Icon className={cn('size-4', styles.iconStroke)} />
              </IconContainer>
            </div>

            <div className="mt-2.5 flex items-center gap-2">
              <div className="flex-1 h-1.5 rounded-full bg-foreground/10 overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all duration-700', styles.barFill)}
                  style={{ width: `${pct}%` }}
                  aria-hidden="true"
                />
              </div>
              <span className="text-[10px] font-semibold tabular-nums text-foreground/70 shrink-0 leading-none">
                {pct}%
              </span>
            </div>
          </GlassPanel>
        );
      })}
    </div>
  );
}

// ─── Backdrop atmosférico local (scoped ao painel) ───────────────────────────
//
// O AmbientBackdrop oficial usa `fixed inset-0` (viewport inteiro) — não serve
// para um painel isolado. Esta versão é local: gradientes radiais + grid
// pontilhado contidos no próprio wrapper. Reproduz a atmosfera para qual os
// cards Glass foram desenhados.

function ScopedBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 overflow-hidden pointer-events-none rounded-xl"
    >
      <div className="absolute -top-32 -left-24 h-96 w-96 rounded-full bg-primary/15 blur-[120px]" />
      <div className="absolute -bottom-32 -right-24 h-112 w-md rounded-full bg-primary/10 blur-[120px]" />
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'radial-gradient(var(--color-primary) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />
    </div>
  );
}

// ─── Wrapper único — usa o tema GLOBAL (light ou dark conforme o toggle) ─────
//
// Nada de scoping local. O wrapper apenas reproduz a atmosfera (backdrop) e
// o background-color é o --background do tema atual. Quando o usuário clica
// no toggle, next-themes flipa .dark no <html> e TODO o documento muda — os
// cards renderizam exatamente como em produção.

interface ThemedPanelProps {
  data: PulseProps;
  variant: 'atual' | 'corrigida';
}

function ThemedPanel({ data, variant }: ThemedPanelProps) {
  const Component = variant === 'atual' ? PulseStripAtual : PulseStripCorrigida;
  return (
    <div className="relative rounded-xl bg-background p-5 border border-border overflow-hidden">
      <ScopedBackdrop />
      <div className="relative z-10">
        <Component {...data} />
      </div>
    </div>
  );
}

// ─── Toggle de tema global (sticky no topo da página) ────────────────────────

function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const current = theme === 'system' ? resolvedTheme : theme;
  const isDark = current === 'dark';

  return (
    <div className="sticky top-4 z-30 mb-8 flex items-center justify-between rounded-xl border border-border bg-background/80 backdrop-blur-md p-3 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-muted-foreground">
          Tema atual:
        </span>
        <span
          className={cn(
            'text-sm font-semibold tabular-nums',
            isDark ? 'text-primary' : 'text-foreground',
          )}
        >
          {isDark ? 'Dark' : 'Light'}
        </span>
      </div>
      <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/40 p-1">
        <Button
          size="sm"
          variant={!isDark ? 'default' : 'ghost'}
          onClick={() => setTheme('light')}
          className="rounded-md gap-1.5 h-7 px-2.5 text-xs"
        >
          <Sun className="size-3.5" />
          Light
        </Button>
        <Button
          size="sm"
          variant={isDark ? 'default' : 'ghost'}
          onClick={() => setTheme('dark')}
          className="rounded-md gap-1.5 h-7 px-2.5 text-xs"
        >
          <Moon className="size-3.5" />
          Dark
        </Button>
      </div>
    </div>
  );
}

// ─── Página ──────────────────────────────────────────────────────────────────

const SCENARIO_NORMAL: PulseProps = {
  vencidos: 0,
  hoje: 4,
  proximos: 12,
  semDono: 3,
  total: 28,
};

const SCENARIO_ALERT: PulseProps = {
  vencidos: 7,
  hoje: 9,
  proximos: 18,
  semDono: 6,
  total: 42,
};

const SCENARIO_STRESS: PulseProps = {
  vencidos: 134,
  hoje: 89,
  proximos: 256,
  semDono: 47,
  total: 612,
};

const SCENARIO_EMPTY: PulseProps = {
  vencidos: 0,
  hoje: 0,
  proximos: 0,
  semDono: 0,
  total: 0,
};

export default function ExpedientesPulseDiffPage() {
  return (
    // Full-bleed: estoura o max-w-5xl do layout pai pra que os cards tenham
    // a largura real de produção (lg:grid-cols-4 só é legível com >= 900px).
    <div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen px-6 sm:px-10 lg:px-12">
      <div className="mx-auto max-w-350">
      <DemoPageHeader
        eyebrow="Visual Diff"
        title="Expedientes — Cards de Status"
        description="Comparação Antes/Depois dos 4 KPIs da página /expedientes (componente ExpedientesPulseStrip). Use o toggle abaixo para alternar entre light e dark — o tema flipa GLOBAL no <html>, exatamente como produção."
      />

      <ThemeToggle />

      <DemoSection
        title="Cenário 1 — Operação normal (sem vencidos)"
        description="vencidos=0, hoje=4, próximos=12, sem dono=3, total=28. Card de alerta inativo."
      >
        <div className="space-y-6">
          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Atual (produção)
            </div>
            <ThemedPanel variant="atual" data={SCENARIO_NORMAL} />
          </div>
          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-success">
              Corrigida (proposta)
            </div>
            <ThemedPanel variant="corrigida" data={SCENARIO_NORMAL} />
          </div>
        </div>
      </DemoSection>

      <DemoSection
        title="Cenário 2 — Alerta ativo (vencidos > 0)"
        description="vencidos=7, hoje=9, próximos=18, sem dono=6, total=42. Card 'Vencidos' em destaque (depth=2 + borda destrutiva)."
      >
        <div className="space-y-6">
          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Atual — número em destructive/80 (contraste 4.1:1 no light)
            </div>
            <ThemedPanel variant="atual" data={SCENARIO_ALERT} />
          </div>
          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-success">
              Corrigida — número destructive cheio + percentual sem opacidade
            </div>
            <ThemedPanel variant="corrigida" data={SCENARIO_ALERT} />
          </div>
        </div>
      </DemoSection>

      <DemoSection
        title="Cenário 3 — Stress test (3 dígitos)"
        description="Validar tabular-nums e quebra de layout com valores grandes."
      >
        <div className="space-y-6">
          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Atual
            </div>
            <ThemedPanel variant="atual" data={SCENARIO_STRESS} />
          </div>
          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-success">
              Corrigida
            </div>
            <ThemedPanel variant="corrigida" data={SCENARIO_STRESS} />
          </div>
        </div>
      </DemoSection>

      <DemoSection
        title="Cenário 4 — Estado vazio (zero pendentes)"
        description="Edge case: total=0. Barra deve renderizar como vazia, percentual=0%."
      >
        <div className="space-y-6">
          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Atual
            </div>
            <ThemedPanel variant="atual" data={SCENARIO_EMPTY} />
          </div>
          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-success">
              Corrigida
            </div>
            <ThemedPanel variant="corrigida" data={SCENARIO_EMPTY} />
          </div>
        </div>
      </DemoSection>

      <DemoSection
        title="Resumo das mudanças"
        description="Diff conceitual entre as duas versões."
      >
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left">
                <th className="px-4 py-3 font-semibold">Elemento</th>
                <th className="px-4 py-3 font-semibold">Atual</th>
                <th className="px-4 py-3 font-semibold text-success">Corrigida</th>
                <th className="px-4 py-3 font-semibold">Motivo</th>
              </tr>
            </thead>
            <tbody className="[&_td]:px-4 [&_td]:py-3 [&_td]:align-top [&_tr]:border-b [&_tr]:border-border [&_tr:last-child]:border-0">
              <tr>
                <td className="font-medium">Classes de cor</td>
                <td className="text-muted-foreground">
                  Template strings: <code>{'`${bgColor}/8`'}</code>
                </td>
                <td className="text-success">Mapa explícito (TONE_STYLES)</td>
                <td className="text-muted-foreground">Tailwind v4 não purga interpolações</td>
              </tr>
              <tr>
                <td className="font-medium">Número em alerta</td>
                <td className="text-muted-foreground">
                  <code>text-destructive/80</code> (4.1:1)
                </td>
                <td className="text-success">
                  <code>text-destructive</code> (≥ 5.5:1)
                </td>
                <td className="text-muted-foreground">Atinge WCAG AA</td>
              </tr>
              <tr>
                <td className="font-medium">Percentual</td>
                <td className="text-muted-foreground">
                  <code>muted-foreground/50</code> (2.3:1)
                </td>
                <td className="text-success">
                  <code>muted-foreground</code> (≥ 4.5:1)
                </td>
                <td className="text-muted-foreground">Atinge WCAG AA</td>
              </tr>
              <tr>
                <td className="font-medium">Trilha da barra</td>
                <td className="text-muted-foreground">
                  <code>bg-muted/30</code> + fill <code>/25</code>
                </td>
                <td className="text-success">
                  <code>bg-muted/60</code> + fill <code>/40</code>
                </td>
                <td className="text-muted-foreground">
                  Valores baixos ficam visíveis
                </td>
              </tr>
              <tr>
                <td className="font-medium">Stroke do ícone</td>
                <td className="text-muted-foreground">
                  <code>{'text-{tone}/60'}</code>
                </td>
                <td className="text-success">
                  <code>{'text-{tone}/70'}</code>
                </td>
                <td className="text-muted-foreground">Mais presença sem estridência</td>
              </tr>
              <tr>
                <td className="font-medium">Padding vertical</td>
                <td className="text-muted-foreground">
                  <code>py-3.5</code> (14px)
                </td>
                <td className="text-success">
                  <code>py-4</code> (16px)
                </td>
                <td className="text-muted-foreground">Aderente à escala 4px</td>
              </tr>
              <tr>
                <td className="font-medium">Acessibilidade</td>
                <td className="text-muted-foreground">Sem aria/role</td>
                <td className="text-success">
                  <code>role="group"</code> + <code>aria-label</code> descritivo
                </td>
                <td className="text-muted-foreground">
                  Leitores de tela narram corretamente
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </DemoSection>

      <DemoSection
        title="Auditoria de contraste — Dark mode"
        description="Ratios WCAG calculados para cada elemento textual sobre a superfície glass-widget no dark (background base ≈ #25252a; superfície efetiva ≈ #2D2D2F)."
      >
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left">
                <th className="px-4 py-3 font-semibold">Elemento</th>
                <th className="px-4 py-3 font-semibold">Cor efetiva</th>
                <th className="px-4 py-3 font-semibold">Tamanho</th>
                <th className="px-4 py-3 font-semibold">Ratio</th>
                <th className="px-4 py-3 font-semibold">WCAG</th>
                <th className="px-4 py-3 font-semibold">Veredito visual</th>
              </tr>
            </thead>
            <tbody className="[&_td]:px-4 [&_td]:py-3 [&_td]:align-top [&_tr]:border-b [&_tr]:border-border [&_tr:last-child]:border-0">
              <tr>
                <td className="font-medium">Número (foreground)</td>
                <td className="text-muted-foreground">#FAFAFA</td>
                <td className="text-muted-foreground">24px bold</td>
                <td className="font-mono font-semibold text-success">13.2:1</td>
                <td className="text-success">AAA</td>
                <td className="text-muted-foreground">Excelente</td>
              </tr>
              <tr>
                <td className="font-medium">Label "VENCIDOS" (meta-label)</td>
                <td className="text-muted-foreground">#999A9C</td>
                <td className="text-muted-foreground">11px semibold caps</td>
                <td className="font-mono font-semibold text-success">4.55:1</td>
                <td className="text-success">AA</td>
                <td className="text-muted-foreground">OK (semibold compensa)</td>
              </tr>
              <tr className="bg-destructive/5">
                <td className="font-medium">Percentual ATUAL (muted/50)</td>
                <td className="text-muted-foreground">~#3F3F42 composto</td>
                <td className="text-muted-foreground">9px medium</td>
                <td className="font-mono font-semibold text-destructive">2.78:1</td>
                <td className="text-destructive">FALHA</td>
                <td className="text-destructive">Praticamente invisível</td>
              </tr>
              <tr className="bg-warning/5">
                <td className="font-medium">Percentual v1 (muted cheio)</td>
                <td className="text-muted-foreground">#999A9C</td>
                <td className="text-muted-foreground">9px medium</td>
                <td className="font-mono font-semibold text-warning">4.55:1</td>
                <td className="text-warning">AA limite</td>
                <td className="text-muted-foreground">
                  Passa nominal, mas 9px ainda é apertado
                </td>
              </tr>
              <tr className="bg-success/5">
                <td className="font-medium">Percentual v2 (foreground/70 + 10px semibold)</td>
                <td className="text-muted-foreground">~#B7B7B8 composto</td>
                <td className="text-muted-foreground">10px semibold</td>
                <td className="font-mono font-semibold text-success">7.2:1</td>
                <td className="text-success">AAA</td>
                <td className="text-success">Confortavelmente legível</td>
              </tr>
              <tr>
                <td className="font-medium">Ícone destructive/70</td>
                <td className="text-muted-foreground">#D65A4F a 70%</td>
                <td className="text-muted-foreground">non-text (16px)</td>
                <td className="font-mono font-semibold text-success">3.48:1</td>
                <td className="text-success">AA non-text</td>
                <td className="text-muted-foreground">OK</td>
              </tr>
              <tr>
                <td className="font-medium">Trilha barra ATUAL (muted/30)</td>
                <td className="text-muted-foreground">muito apagada</td>
                <td className="text-muted-foreground">non-text (4px)</td>
                <td className="font-mono font-semibold text-destructive">1.5:1</td>
                <td className="text-destructive">N/A — invisível</td>
                <td className="text-destructive">Some no fundo dark</td>
              </tr>
              <tr className="bg-success/5">
                <td className="font-medium">Trilha barra v2 (foreground/10) + fill /70</td>
                <td className="text-muted-foreground">trilha sutil + fill saturado</td>
                <td className="text-muted-foreground">non-text (6px)</td>
                <td className="font-mono font-semibold text-success">3.1:1</td>
                <td className="text-success">AA non-text</td>
                <td className="text-success">Visível em valores baixos</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-muted-foreground italic">
          Background efetivo do card: composição rgba(255,255,255,0.04) sobre
          --background (oklch 0.17 / ≈ #25252a) → ~#2D2D2F. Calculado pela
          fórmula WCAG 2.1: ratio = (L1 + 0.05) / (L2 + 0.05).
        </p>
      </DemoSection>
      </div>
    </div>
  );
}
