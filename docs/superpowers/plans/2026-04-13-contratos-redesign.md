# Contratos Module — Glass Briefing Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refatorar todo o modulo de contratos para o design system Glass Briefing, adicionando KPI strip, pipeline stepper, insight banners na main page, e migrando todos os Card→GlassPanel na detail page e sub-paginas.

**Architecture:** Layout hibrido na main page (KPIs + pipeline stepper + tabela), tabs na detail page com 7 tabs (incluindo Entrevista). Todos os containers migrados de Card shadcn para GlassPanel/WidgetContainer. Novos endpoints de stats no repository/actions.

**Tech Stack:** Next.js 16, React 19, TypeScript 5, Tailwind CSS 4, shadcn/ui, GlassPanel/WidgetContainer/Heading/Text do design system Glass Briefing.

**Spec:** `docs/superpowers/specs/2026-04-13-contratos-redesign-design.md`

---

## File Map

### New Files
- `src/app/(authenticated)/contratos/components/contratos-pulse-strip.tsx` — KPI strip (4 cards)
- `src/app/(authenticated)/contratos/components/contratos-pipeline-stepper.tsx` — Mini pipeline horizontal
- `src/app/(authenticated)/contratos/components/contratos-content.tsx` — Main page client orchestrator

### Modified Files (by phase)
**Phase 1:** `repository.ts`, `actions/contratos-actions.ts`, `page.tsx`, `index.ts`
**Phase 2:** `[id]/contrato-detalhes-client.tsx`, `[id]/components/contrato-detalhes-header.tsx`
**Phase 3:** `[id]/components/contrato-detalhes-card.tsx`, `contrato-resumo-card.tsx`, `contrato-partes-card.tsx`, `contrato-processos-card.tsx`, `contrato-financeiro-card.tsx`, `contrato-documentos-card.tsx`, `contrato-tags-card.tsx`, `contrato-timeline.tsx`
**Phase 4:** `pipelines/page-client.tsx`, `tipos/page-client.tsx`, `tipos-cobranca/page-client.tsx`
**Phase 5:** `components/kanban-column.tsx`, `components/pipeline-funnel.tsx`, `components/financial-strip.tsx`, `components/contrato-view-sheet.tsx`
**Phase 6:** `entrevistas-trabalhistas/components/entrevista-tab.tsx`, `no-zero-selector.tsx`, `entrevista-wizard.tsx`, `entrevista-resumo.tsx`, `modulo-consolidacao-final.tsx`, 12x `modulo-*.tsx`, `testemunhas-toggle.tsx`, `anexo-upload-zone.tsx`

---

## Phase 1 — Main Page (maior impacto visual)

### Task 1.1: New repository endpoints for pulse stats

**Files:**
- Modify: `src/app/(authenticated)/contratos/repository.ts`

- [ ] **Step 1: Add `sumValorContratosAtivos` function**

Add after the existing `countContratosNovosMes` function:

```typescript
export async function sumValorContratosAtivos(): Promise<Result<number>> {
  const supabase = await getClient();
  const { data, error } = await supabase
    .from('contratos')
    .select('valor_causa')
    .in('status', ['contratado', 'distribuido']);

  if (error) {
    return contratoDatabaseError('sumValorContratosAtivos', error);
  }

  const total = (data ?? []).reduce((acc, row) => acc + (row.valor_causa ?? 0), 0);
  return { success: true, data: total };
}
```

- [ ] **Step 2: Add `countContratosVencendo` function**

```typescript
export async function countContratosVencendo(dias: number): Promise<Result<number>> {
  const supabase = await getClient();
  const now = new Date().toISOString();
  const futureDate = new Date(Date.now() + dias * 24 * 60 * 60 * 1000).toISOString();

  const { count, error } = await supabase
    .from('contratos')
    .select('*', { count: 'exact', head: true })
    .in('status', ['contratado', 'distribuido'])
    .gte('data_vencimento', now)
    .lte('data_vencimento', futureDate);

  if (error) {
    return contratoDatabaseError('countContratosVencendo', error);
  }

  return { success: true, data: count ?? 0 };
}
```

- [ ] **Step 3: Add `countContratosSemResponsavel` function**

```typescript
export async function countContratosSemResponsavel(): Promise<Result<number>> {
  const supabase = await getClient();
  const { count, error } = await supabase
    .from('contratos')
    .select('*', { count: 'exact', head: true })
    .in('status', ['em_contratacao', 'contratado', 'distribuido'])
    .is('responsavel_id', null);

  if (error) {
    return contratoDatabaseError('countContratosSemResponsavel', error);
  }

  return { success: true, data: count ?? 0 };
}
```

- [ ] **Step 4: Run type-check**

Run: `npm run type-check`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/\(authenticated\)/contratos/repository.ts
git commit -m "feat(contratos): add pulse stats repository functions

Add sumValorContratosAtivos, countContratosVencendo, and
countContratosSemResponsavel for the new KPI strip.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 1.2: New server action for pulse stats

**Files:**
- Modify: `src/app/(authenticated)/contratos/actions/contratos-actions.ts`

- [ ] **Step 1: Add `actionContratosPulseStats` function**

Add at the end of the file, before the last export block. Import the new repo functions at the top alongside existing repo imports:

```typescript
import {
  // ...existing imports...
  sumValorContratosAtivos,
  countContratosVencendo,
  countContratosSemResponsavel,
  countContratosNovosMes,
  countContratosTrendMensal,
} from '../repository';
```

```typescript
export interface ContratosPulseStats {
  ativos: number;
  valorTotal: number;
  vencendo30d: number;
  novosMes: number;
  semResponsavel: number;
  porStatus: Record<string, number>;
  trendMensal: number[];
}

export async function actionContratosPulseStats(): Promise<ActionResult<ContratosPulseStats>> {
  'use server';

  const [statusResult, valorResult, vencendoResult, novosResult, semRespResult, trendResult] =
    await Promise.all([
      contarContratosPorStatus(),
      sumValorContratosAtivos(),
      countContratosVencendo(30),
      countContratosNovosMes(),
      countContratosTrendMensal(6),
    ]);

  if (!statusResult.success) {
    return { success: false, error: statusResult.error.message, message: 'Erro ao carregar estatísticas' };
  }

  const porStatus = statusResult.data;
  const ativos = (porStatus.contratado ?? 0) + (porStatus.distribuido ?? 0);

  return {
    success: true,
    data: {
      ativos,
      valorTotal: valorResult.success ? valorResult.data : 0,
      vencendo30d: vencendoResult.success ? vencendoResult.data : 0,
      novosMes: novosResult.success ? novosResult.data : 0,
      semResponsavel: semRespResult.success ? semRespResult.data : 0,
      porStatus: porStatus as Record<string, number>,
      trendMensal: trendResult.success ? trendResult.data.map((t) => t.count) : [],
    },
    message: 'Estatísticas carregadas',
  };
}
```

- [ ] **Step 2: Export from barrel**

In `src/app/(authenticated)/contratos/index.ts`, add to the actions re-exports:

```typescript
export { actionContratosPulseStats, type ContratosPulseStats } from './actions/contratos-actions';
```

- [ ] **Step 3: Run type-check**

Run: `npm run type-check`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/app/\(authenticated\)/contratos/actions/contratos-actions.ts src/app/\(authenticated\)/contratos/index.ts
git commit -m "feat(contratos): add actionContratosPulseStats server action

Aggregates all KPI metrics (ativos, valor, vencendo, novos, trend)
in a single parallel call for the new pulse strip.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 1.3: Create ContratosPulseStrip component

**Files:**
- Create: `src/app/(authenticated)/contratos/components/contratos-pulse-strip.tsx`

- [ ] **Step 1: Create the pulse strip component**

Follow the exact pattern from `ExpedientesPulseStrip`:

```typescript
'use client';

import { FileCheck, DollarSign, Clock, TrendingUp } from 'lucide-react';
import { GlassPanel } from '@/components/shared/glass-panel';
import { IconContainer } from '@/components/ui/icon-container';
import {
  AnimatedNumber,
  Sparkline,
  fmtMoeda,
} from '@/app/(authenticated)/dashboard/mock/widgets/primitives';
import { cn } from '@/lib/utils';

interface PulseMetric {
  label: string;
  value: number;
  displayValue?: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  highlight?: boolean;
  extra?: React.ReactNode;
}

interface ContratosPulseStripProps {
  ativos: number;
  valorTotal: number;
  vencendo30d: number;
  novosMes: number;
  total: number;
  trendMensal?: number[];
}

export function ContratosPulseStrip({
  ativos,
  valorTotal,
  vencendo30d,
  novosMes,
  total,
  trendMensal = [],
}: ContratosPulseStripProps) {
  const metrics: PulseMetric[] = [
    {
      label: 'Ativos',
      value: ativos,
      icon: FileCheck,
      color: 'text-primary',
      bgColor: 'bg-primary',
    },
    {
      label: 'Valor Total',
      value: valorTotal,
      displayValue: fmtMoeda(valorTotal),
      icon: DollarSign,
      color: 'text-primary',
      bgColor: 'bg-primary',
      extra: trendMensal.length > 0 ? (
        <div className="mt-1">
          <Sparkline data={trendMensal} width={80} height={20} />
        </div>
      ) : null,
    },
    {
      label: 'Vencendo 30d',
      value: vencendo30d,
      icon: Clock,
      color: 'text-warning',
      bgColor: 'bg-warning',
      highlight: vencendo30d > 0,
    },
    {
      label: 'Novos/Mês',
      value: novosMes,
      icon: TrendingUp,
      color: 'text-success',
      bgColor: 'bg-success',
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
              metric.highlight && metric.value > 0 && 'border-warning/15',
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/50 truncate">
                  {metric.label}
                </p>
                <div className="flex items-baseline gap-1.5 mt-1">
                  {metric.displayValue ? (
                    <p className="font-display text-lg font-bold tabular-nums leading-none tracking-tight">
                      {metric.displayValue}
                    </p>
                  ) : (
                    <p className={cn(
                      'font-display text-2xl font-bold tabular-nums leading-none tracking-tight',
                      metric.highlight && metric.value > 0 && 'text-warning/80',
                    )}>
                      <AnimatedNumber value={metric.value} />
                    </p>
                  )}
                </div>
                {metric.extra}
              </div>
              <IconContainer
                size="md"
                className={cn(
                  `${metric.bgColor}/8`,
                  metric.highlight && metric.value > 0 && 'border border-warning/20',
                )}
              >
                <Icon className={cn('size-4', `${metric.color}/60`)} />
              </IconContainer>
            </div>

            {!metric.displayValue && (
              <div className="mt-2.5 flex items-center gap-2">
                <div className="flex-1 h-1 rounded-full bg-muted/30 overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all duration-700', `${metric.bgColor}/25`)}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-[9px] tabular-nums text-muted-foreground/50 shrink-0">
                  {pct}%
                </span>
              </div>
            )}
          </GlassPanel>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Run type-check**

Run: `npm run type-check`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/app/\(authenticated\)/contratos/components/contratos-pulse-strip.tsx
git commit -m "feat(contratos): create ContratosPulseStrip component

4-card KPI strip with AnimatedNumber, Sparkline, proportion bars.
Follows ExpedientesPulseStrip pattern with GlassPanel depth system.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 1.4: Create ContratosPipelineStepper component

**Files:**
- Create: `src/app/(authenticated)/contratos/components/contratos-pipeline-stepper.tsx`

- [ ] **Step 1: Create the pipeline stepper component**

```typescript
'use client';

import { GlassPanel } from '@/components/shared/glass-panel';
import { cn } from '@/lib/utils';
import { STATUS_CONTRATO_LABELS, type StatusContrato } from '../domain';

interface PipelineStage {
  status: StatusContrato;
  count: number;
}

interface ContratosPipelineStepperProps {
  porStatus: Record<string, number>;
  activeStatus?: StatusContrato | null;
  onStatusClick?: (status: StatusContrato) => void;
  /** Compact mode for detail page header (no GlassPanel wrapper) */
  compact?: boolean;
}

const STAGE_ORDER: StatusContrato[] = [
  'em_contratacao',
  'contratado',
  'distribuido',
  'desistencia',
];

const STAGE_COLORS: Record<StatusContrato, string> = {
  em_contratacao: 'bg-info',
  contratado: 'bg-success',
  distribuido: 'bg-primary',
  desistencia: 'bg-destructive',
};

export function ContratosPipelineStepper({
  porStatus,
  activeStatus,
  onStatusClick,
  compact = false,
}: ContratosPipelineStepperProps) {
  const stages: PipelineStage[] = STAGE_ORDER.map((status) => ({
    status,
    count: porStatus[status] ?? 0,
  }));

  const content = (
    <div className="flex items-center gap-0">
      {stages.map((stage, i) => {
        const isActive = activeStatus === stage.status;
        const colorClass = STAGE_COLORS[stage.status];

        return (
          <div key={stage.status} className="contents">
            <button
              type="button"
              onClick={() => onStatusClick?.(stage.status)}
              className={cn(
                'flex items-center gap-2 flex-1 px-3 py-1.5 rounded-lg transition-all duration-200',
                'hover:bg-primary/[0.04]',
                isActive && 'bg-primary/[0.06]',
                onStatusClick && 'cursor-pointer',
                !onStatusClick && 'cursor-default',
              )}
            >
              <div
                className={cn(
                  'size-2.5 rounded-full shrink-0 transition-all duration-300',
                  colorClass,
                  isActive && 'shadow-[0_0_6px] shadow-primary/30',
                )}
              />
              <span
                className={cn(
                  'text-[11px] font-medium text-muted-foreground whitespace-nowrap',
                  isActive && 'text-foreground font-semibold',
                )}
              >
                {compact ? STATUS_CONTRATO_LABELS[stage.status] : STATUS_CONTRATO_LABELS[stage.status]}
              </span>
              <span className="text-[10px] font-bold tabular-nums px-1.5 py-0.5 rounded-full bg-primary/8 text-primary">
                {stage.count}
              </span>
            </button>

            {i < stages.length - 1 && (
              <div
                className={cn(
                  'w-5 h-0.5 shrink-0',
                  'bg-border/30',
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );

  if (compact) {
    return content;
  }

  return (
    <GlassPanel className="px-5 py-3">
      {content}
    </GlassPanel>
  );
}
```

- [ ] **Step 2: Run type-check**

Run: `npm run type-check`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/app/\(authenticated\)/contratos/components/contratos-pipeline-stepper.tsx
git commit -m "feat(contratos): create ContratosPipelineStepper component

Horizontal pipeline with 4 stages, counts, clickable filtering.
Supports compact mode for detail page header.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 1.5: Create ContratosContent orchestrator and wire main page

**Files:**
- Create: `src/app/(authenticated)/contratos/components/contratos-content.tsx`
- Modify: `src/app/(authenticated)/contratos/page.tsx`

- [ ] **Step 1: Create the ContratosContent orchestrator**

This is the main client component that composes pulse strip + insight banners + pipeline stepper + controls + table. Read the existing `contratos-table-wrapper.tsx` and the `page.tsx` to understand the current data flow before writing this component.

The component should:
1. Call `actionContratosPulseStats()` on mount via `useEffect` or `use()`
2. Render: Header → PulseStrip → InsightBanners → PipelineStepper → Controls → Table
3. Pass filter callbacks from pipeline stepper clicks to the existing table wrapper
4. Import `InsightBanner` from `@/app/(authenticated)/dashboard/mock/widgets/primitives`
5. Import `Heading` from `@/components/ui/typography`

```typescript
'use client';

import * as React from 'react';
import { Heading } from '@/components/ui/typography';
import { Button } from '@/components/ui/button';
import {
  InsightBanner,
} from '@/app/(authenticated)/dashboard/mock/widgets/primitives';
import { Plus } from 'lucide-react';
import { actionContratosPulseStats, type ContratosPulseStats } from '../actions/contratos-actions';
import { ContratosPulseStrip } from './contratos-pulse-strip';
import { ContratosPipelineStepper } from './contratos-pipeline-stepper';
import { ContratosTableWrapper } from './contratos-table-wrapper';
import type { StatusContrato } from '../domain';

export function ContratosContent() {
  const [stats, setStats] = React.useState<ContratosPulseStats | null>(null);
  const [statusFilter, setStatusFilter] = React.useState<StatusContrato | null>(null);

  React.useEffect(() => {
    actionContratosPulseStats().then((result) => {
      if (result.success) setStats(result.data);
    });
  }, []);

  const handleStatusClick = (status: StatusContrato) => {
    setStatusFilter((prev) => (prev === status ? null : status));
  };

  const totalContratos = stats
    ? Object.values(stats.porStatus).reduce((a, b) => a + b, 0)
    : 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <Heading level="page">Contratos</Heading>
          {stats && (
            <p className="text-sm text-muted-foreground/50 mt-0.5">
              {stats.ativos} ativos &middot; {totalContratos} total
            </p>
          )}
        </div>
        <Button size="sm" className="rounded-xl">
          <Plus className="size-3.5" />
          Novo Contrato
        </Button>
      </div>

      {/* Pulse Strip */}
      {stats && (
        <ContratosPulseStrip
          ativos={stats.ativos}
          valorTotal={stats.valorTotal}
          vencendo30d={stats.vencendo30d}
          novosMes={stats.novosMes}
          total={totalContratos}
          trendMensal={stats.trendMensal}
        />
      )}

      {/* Insight Banners */}
      {stats && stats.vencendo30d > 0 && (
        <InsightBanner type="warning">
          {stats.vencendo30d} contratos vencem nos proximos 30 dias
        </InsightBanner>
      )}
      {stats && stats.semResponsavel > 0 && (
        <InsightBanner type="info">
          {stats.semResponsavel} contratos sem responsavel atribuido
        </InsightBanner>
      )}

      {/* Pipeline Stepper */}
      {stats && (
        <ContratosPipelineStepper
          porStatus={stats.porStatus}
          activeStatus={statusFilter}
          onStatusClick={handleStatusClick}
        />
      )}

      {/* Table (existing component, pass statusFilter as additional prop) */}
      <ContratosTableWrapper statusFilter={statusFilter} />
    </div>
  );
}
```

**Note:** The `ContratosTableWrapper` may need a minor modification to accept and apply `statusFilter` prop. Check its current filter implementation and add the prop if needed. This is a targeted change — only add the prop threading, don't refactor the table itself.

- [ ] **Step 2: Update page.tsx to use ContratosContent**

Read the current `page.tsx` first, then replace the content component:

```typescript
import { ContratosContent } from './components/contratos-content';

export const metadata = {
  title: 'Contratos',
  description: 'Gestao de contratos',
};

export default function ContratosPage() {
  return <ContratosContent />;
}
```

- [ ] **Step 3: Export new components from barrel**

In `src/app/(authenticated)/contratos/index.ts`, add:

```typescript
export { ContratosPulseStrip } from './components/contratos-pulse-strip';
export { ContratosPipelineStepper } from './components/contratos-pipeline-stepper';
export { ContratosContent } from './components/contratos-content';
```

- [ ] **Step 4: Run type-check and dev server**

Run: `npm run type-check`
Run: `npm run dev` — verify the main page renders with KPIs, stepper, banners, and table.

- [ ] **Step 5: Commit**

```bash
git add src/app/\(authenticated\)/contratos/components/contratos-content.tsx src/app/\(authenticated\)/contratos/page.tsx src/app/\(authenticated\)/contratos/index.ts
git commit -m "feat(contratos): wire main page with pulse strip, stepper, banners

New ContratosContent orchestrator composes all Glass Briefing
components for the hybrid main page layout.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Phase 2 — Detail Page Header + Tabs Structure

### Task 2.1: Refactor contrato-detalhes-header.tsx

**Files:**
- Modify: `src/app/(authenticated)/contratos/[id]/components/contrato-detalhes-header.tsx`

- [ ] **Step 1: Read the current file to understand its structure**

Read the full file first. Then refactor:
- Replace `Card` with `GlassPanel depth={1}`
- Use `Heading level="section"` for the title
- Use `Text variant="meta-label"` for labels
- Use `SemanticBadge` for status
- Add the pipeline stepper inline using `ContratosPipelineStepper compact`

Key imports to add:
```typescript
import { GlassPanel } from '@/components/shared/glass-panel';
import { Heading, Text } from '@/components/ui/typography';
import { ContratosPipelineStepper } from '../components/contratos-pipeline-stepper';
```

Key imports to remove:
```typescript
// Remove Card, CardHeader, CardContent imports
```

- [ ] **Step 2: Run type-check**

Run: `npm run type-check`

- [ ] **Step 3: Verify in browser**

Run: `npm run dev` — navigate to a contract detail page and verify the header renders correctly in both light and dark mode.

- [ ] **Step 4: Commit**

```bash
git add src/app/\(authenticated\)/contratos/\[id\]/components/contrato-detalhes-header.tsx
git commit -m "refactor(contratos): migrate detail header to GlassPanel + stepper

Replace Card with GlassPanel depth=1, add inline pipeline stepper,
use Heading/Text typography components.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 2.2: Refactor contrato-detalhes-client.tsx tabs structure

**Files:**
- Modify: `src/app/(authenticated)/contratos/[id]/contrato-detalhes-client.tsx`

- [ ] **Step 1: Read the current file**

Read the full 290-line file. The refactoring involves:

1. Add a mini KPI row above the tabs using `GlassPanel depth={2}` cards
2. Ensure each `TabsContent` wraps its children in proper glass containers
3. Keep the existing tab organization but add consistent spacing
4. DO NOT change component imports for detail cards yet (Phase 3)

Add mini KPI row between header and tabs:
```typescript
import { GlassPanel } from '@/components/shared/glass-panel';
import { Text } from '@/components/ui/typography';

// Inside the component, after header and before Tabs:
<div className="grid grid-cols-4 gap-3">
  <GlassPanel depth={2} className="px-4 py-3 text-center">
    <p className="font-display text-xl font-bold tabular-nums">{contrato.partes?.length ?? 0}</p>
    <Text variant="meta-label">Partes</Text>
  </GlassPanel>
  <GlassPanel depth={2} className="px-4 py-3 text-center">
    <p className="font-display text-xl font-bold tabular-nums">{contrato.processosVinculados?.length ?? 0}</p>
    <Text variant="meta-label">Processos</Text>
  </GlassPanel>
  <GlassPanel depth={2} className="px-4 py-3 text-center">
    <p className="font-display text-xl font-bold tabular-nums">{contrato.documentosCount ?? 0}</p>
    <Text variant="meta-label">Documentos</Text>
  </GlassPanel>
  <GlassPanel depth={2} className="px-4 py-3 text-center">
    <p className="font-display text-lg font-bold tabular-nums">
      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(contrato.valorCausa ?? 0)}
    </p>
    <Text variant="meta-label">Valor</Text>
  </GlassPanel>
</div>
```

**Note:** Check the actual `Contrato` type properties for partes, processos, etc. The field names may differ — use the domain.ts types as reference.

- [ ] **Step 2: Run type-check and verify in browser**

- [ ] **Step 3: Commit**

```bash
git add src/app/\(authenticated\)/contratos/\[id\]/contrato-detalhes-client.tsx
git commit -m "refactor(contratos): add mini KPI row to detail page tabs

Add 4 GlassPanel depth=2 cards showing partes, processos,
documentos, and valor counts above the tab bar.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Phase 3 — Detail Page Tab Contents

### Task 3.1: Migrate detail cards to GlassPanel/WidgetContainer

For EACH of these files in `src/app/(authenticated)/contratos/[id]/components/`:

1. `contrato-detalhes-card.tsx`
2. `contrato-resumo-card.tsx`
3. `contrato-partes-card.tsx`
4. `contrato-processos-card.tsx`
5. `contrato-documentos-card.tsx`
6. `contrato-tags-card.tsx`

Apply this migration pattern:

- [ ] **Step 1: Read each file first**

- [ ] **Step 2: For each file, apply the standard migration**

Replace imports:
```typescript
// REMOVE:
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// ADD:
import { WidgetContainer } from '@/components/shared/glass-panel';
import { Heading, Text } from '@/components/ui/typography';
```

Replace JSX pattern:
```typescript
// FROM:
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>
    {children}
  </CardContent>
</Card>

// TO:
<WidgetContainer title="Title" icon={IconName}>
  {children}
</WidgetContainer>
```

Choose appropriate Lucide icons per card:
- detalhes-card: `FileText`
- resumo-card: `ClipboardList`
- partes-card: `Users`
- processos-card: `Scale`
- documentos-card: `FolderOpen`
- tags-card: `Tags`

- [ ] **Step 3: Run type-check after all migrations**

Run: `npm run type-check`

- [ ] **Step 4: Verify all tabs in browser**

Navigate to a contract detail page, click through each tab, verify glass rendering in light and dark mode.

- [ ] **Step 5: Commit**

```bash
git add src/app/\(authenticated\)/contratos/\[id\]/components/
git commit -m "refactor(contratos): migrate all detail cards to WidgetContainer

Replace Card/CardHeader/CardContent with WidgetContainer across
6 detail components. Use semantic Lucide icons per section.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 3.2: Migrate contrato-financeiro-card.tsx with KPI cards

**Files:**
- Modify: `src/app/(authenticated)/contratos/[id]/components/contrato-financeiro-card.tsx`

- [ ] **Step 1: Read the current file**

- [ ] **Step 2: Add 3 financial KPI cards + progress bar above the table**

```typescript
import { GlassPanel, WidgetContainer } from '@/components/shared/glass-panel';
import { Text } from '@/components/ui/typography';

// Inside the component, before the lancamentos table:
const totalReceitas = lancamentos.filter(l => l.status === 'pago').reduce((a, l) => a + l.valor, 0);
const totalPendente = lancamentos.filter(l => l.status === 'pendente').reduce((a, l) => a + l.valor, 0);
const valorTotal = contrato.valorCausa ?? 0;
const pctRecebido = valorTotal > 0 ? Math.round((totalReceitas / valorTotal) * 100) : 0;

// KPI Row
<div className="grid grid-cols-3 gap-3 mb-4">
  <GlassPanel depth={2} className="px-4 py-3">
    <Text variant="meta-label">Valor Total</Text>
    <p className="font-display text-base font-bold tabular-nums mt-1">{fmtMoeda(valorTotal)}</p>
  </GlassPanel>
  <GlassPanel depth={2} className="px-4 py-3">
    <Text variant="meta-label">Recebido</Text>
    <p className="font-display text-base font-bold tabular-nums mt-1 text-success">{fmtMoeda(totalReceitas)}</p>
  </GlassPanel>
  <GlassPanel depth={2} className="px-4 py-3">
    <Text variant="meta-label">Pendente</Text>
    <p className="font-display text-base font-bold tabular-nums mt-1 text-warning">{fmtMoeda(totalPendente)}</p>
  </GlassPanel>
</div>

// Progress bar
<div className="mb-5">
  <div className="flex justify-between mb-1.5">
    <span className="text-[11px] font-medium text-muted-foreground">Progresso de recebimento</span>
    <span className="text-[11px] font-semibold text-primary tabular-nums">{pctRecebido}%</span>
  </div>
  <div className="h-1.5 rounded-full bg-muted/30 overflow-hidden">
    <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${pctRecebido}%` }} />
  </div>
</div>
```

- [ ] **Step 3: Run type-check and verify**

- [ ] **Step 4: Commit**

```bash
git add src/app/\(authenticated\)/contratos/\[id\]/components/contrato-financeiro-card.tsx
git commit -m "refactor(contratos): add financial KPI cards + progress bar

Three GlassPanel depth=2 cards (total, recebido, pendente) with
visual progress bar above the lancamentos table.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 3.3: Redesign contrato-timeline.tsx

**Files:**
- Modify: `src/app/(authenticated)/contratos/[id]/components/contrato-timeline.tsx`

- [ ] **Step 1: Read the current file**

- [ ] **Step 2: Redesign with vertical timeline using semantic icons**

Replace the current timeline with the pattern from the POC:
- Group events by month
- Each event: colored dot (by type) + actor + action description + timestamp
- Status changes show the new status badge inline
- Document events show the filename
- Use `IconContainer` for the timeline dots

Key imports:
```typescript
import { IconContainer } from '@/components/ui/icon-container';
import { Text } from '@/components/ui/typography';
import { SemanticBadge } from '@/components/ui/semantic-badge';
import { FileText, UserPlus, CheckCircle, AlertCircle, DollarSign } from 'lucide-react';
```

Event type → icon mapping:
```typescript
const EVENT_ICONS = {
  status_change: { icon: CheckCircle, color: 'bg-success/10 text-success' },
  created: { icon: AlertCircle, color: 'bg-primary/10 text-primary' },
  document: { icon: FileText, color: 'bg-info/10 text-info' },
  financial: { icon: DollarSign, color: 'bg-success/10 text-success' },
  party: { icon: UserPlus, color: 'bg-primary/10 text-primary' },
} as const;
```

- [ ] **Step 3: Run type-check and verify**

- [ ] **Step 4: Commit**

```bash
git add src/app/\(authenticated\)/contratos/\[id\]/components/contrato-timeline.tsx
git commit -m "refactor(contratos): redesign timeline with semantic icons

Vertical timeline grouped by month, with colored IconContainer dots
per event type and inline status badges for status changes.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 3.4: Remove contrato-progress-card.tsx

**Files:**
- Delete: `src/app/(authenticated)/contratos/[id]/components/contrato-progress-card.tsx`
- Modify: `src/app/(authenticated)/contratos/[id]/contrato-detalhes-client.tsx` (remove import)

- [ ] **Step 1: Remove usage from contrato-detalhes-client.tsx**

Search for `ContratoProgressCard` import and usage, remove both.

- [ ] **Step 2: Delete the file**

```bash
rm src/app/\(authenticated\)/contratos/\[id\]/components/contrato-progress-card.tsx
```

- [ ] **Step 3: Run type-check**

- [ ] **Step 4: Commit**

```bash
git add -A src/app/\(authenticated\)/contratos/\[id\]/
git commit -m "refactor(contratos): remove progress card (replaced by pipeline stepper)

Pipeline stepper in header replaces the standalone progress card.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Phase 4 — Sub-pages Config (DataTable migration)

### Task 4.1: Migrate pipelines/page-client.tsx to DataTable

**Files:**
- Modify: `src/app/(authenticated)/contratos/pipelines/page-client.tsx`

- [ ] **Step 1: Read the current file**

- [ ] **Step 2: Replace manual table with DataTable pattern**

Key imports to add:
```typescript
import { DataShell, DataTable, DataTableToolbar, DataPagination } from '@/components/shared/data-shell';
import { DialogFormShell } from '@/components/shared/dialog-shell/dialog-form-shell';
```

Replace manual `<table>` with `<DataTable>` using column definitions. Replace manual dialog with `<DialogFormShell>`.

- [ ] **Step 3: Run type-check and verify**

- [ ] **Step 4: Commit**

### Task 4.2: Migrate tipos/page-client.tsx (same pattern as 4.1)

### Task 4.3: Migrate tipos-cobranca/page-client.tsx (same pattern as 4.1)

Each task follows the identical DataTable migration pattern. Read the file, replace manual table, replace manual dialog.

---

## Phase 5 — Kanban + Polish

### Task 5.1: Migrate kanban-column.tsx to GlassPanel

**Files:**
- Modify: `src/app/(authenticated)/contratos/components/kanban-column.tsx`

- [ ] **Step 1: Read and migrate**

Replace container div with `GlassPanel depth={1}`. Add column header with stage count badge. The `contrato-card.tsx` used inside is already refactored.

- [ ] **Step 2: Commit**

### Task 5.2: Update pipeline-funnel.tsx glass tokens

- [ ] Read, replace hardcoded colors with CSS variables, commit.

### Task 5.3: Update financial-strip.tsx to GlassPanel depth=2

- [ ] Read, replace container with `GlassPanel depth={2}`, commit.

### Task 5.4: Update contrato-view-sheet.tsx glass sections

- [ ] Read, replace plain div sections with `GlassPanel depth={1}` inside the Sheet, commit.

### Task 5.5: QA visual — dark/light mode + responsiveness

- [ ] **Step 1: Run dev server and test all pages**

Test checklist:
- Main page: KPI strip, stepper, banners, table (dark + light)
- Detail page: header, mini KPIs, all 7 tabs (dark + light)
- Kanban: columns, cards (dark + light)
- Pipelines config: DataTable, dialog (dark + light)
- Tipos config: DataTable, dialog (dark + light)
- Responsiveness: 375px, 768px, 1024px, 1440px

- [ ] **Step 2: Fix any visual issues found**

- [ ] **Step 3: Commit fixes**

---

## Phase 6 — Tab Entrevista Trabalhista

### Task 6.1: Migrate entrevista-tab.tsx

**Files:**
- Modify: `src/app/(authenticated)/entrevistas-trabalhistas/components/entrevista-tab.tsx`

- [ ] **Step 1: Read the current file**

- [ ] **Step 2: Migrate empty state to GlassPanel**

Replace the empty state div with:
```typescript
import { GlassPanel } from '@/components/shared/glass-panel';
import { IconContainer } from '@/components/ui/icon-container';
import { Heading, Text } from '@/components/ui/typography';

// Empty state:
<GlassPanel className="flex flex-col items-center justify-center gap-4 py-16 text-center">
  <IconContainer size="lg" className="bg-muted/50">
    <ClipboardList className="size-5 text-muted-foreground/50" />
  </IconContainer>
  <div>
    <Heading level="card">Nenhuma entrevista realizada</Heading>
    <Text variant="caption" className="mt-1">
      Inicie uma entrevista trabalhista para coletar os fatos probatorios do caso
    </Text>
  </div>
  <Button onClick={() => setView('no_zero')}>
    <Plus className="mr-2 h-4 w-4" />
    Iniciar Entrevista
  </Button>
</GlassPanel>
```

- [ ] **Step 3: Run type-check**

- [ ] **Step 4: Commit**

---

### Task 6.2: Migrate no-zero-selector.tsx (Card → GlassPanel)

**Files:**
- Modify: `src/app/(authenticated)/entrevistas-trabalhistas/components/no-zero-selector.tsx`

- [ ] **Step 1: Read the current file**

- [ ] **Step 2: Replace Card/CardContent with GlassPanel**

```typescript
// REMOVE:
import { Card, CardContent } from '@/components/ui/card';

// ADD:
import { GlassPanel } from '@/components/shared/glass-panel';
import { Heading, Text } from '@/components/ui/typography';
```

Replace each selection card:
```typescript
// FROM:
<Card className={cn('cursor-pointer ...', selected && 'ring-2 ring-primary')}>
  <CardContent className="p-4">...</CardContent>
</Card>

// TO:
<GlassPanel
  className={cn('cursor-pointer p-4', selected && 'ring-2 ring-primary border-primary/20')}
>
  ...
</GlassPanel>
```

Replace `<h3>` with `<Heading level="card">` and `<p>` with `<Text variant="caption">`.

- [ ] **Step 3: Run type-check and verify**

- [ ] **Step 4: Commit**

---

### Task 6.3: Migrate entrevista-wizard.tsx

**Files:**
- Modify: `src/app/(authenticated)/entrevistas-trabalhistas/components/entrevista-wizard.tsx`

- [ ] **Step 1: Read the current file (250+ lines)**

- [ ] **Step 2: Replace Card wrapper with GlassPanel**

```typescript
// Replace Card wrapper around module content:
// FROM:
<Card><CardContent className="p-6">{moduleContent}</CardContent></Card>

// TO:
<GlassPanel className="p-6">{moduleContent}</GlassPanel>
```

- [ ] **Step 3: Refactor stepper to use design system patterns**

Replace the manual stepper with consistent styling using the same dot + label pattern from ContratosPipelineStepper (or inline the pattern):

```typescript
// Use consistent step styling:
<div className={cn(
  'flex items-center gap-2 px-2 py-1 rounded-lg',
  isCompleted && 'text-success',
  isCurrent && 'bg-primary/[0.06] text-primary',
  isFuture && 'text-muted-foreground/40',
)}>
  <div className={cn(
    'size-2 rounded-full',
    isCompleted && 'bg-success',
    isCurrent && 'bg-primary shadow-[0_0_6px] shadow-primary/30',
    isFuture && 'bg-muted-foreground/30',
  )} />
  <span className="text-[11px] font-medium">{label}</span>
</div>
```

- [ ] **Step 4: Run type-check and verify**

- [ ] **Step 5: Commit**

---

### Task 6.4: Migrate entrevista-resumo.tsx

**Files:**
- Modify: `src/app/(authenticated)/entrevistas-trabalhistas/components/entrevista-resumo.tsx`

- [ ] **Step 1: Read the file**

- [ ] **Step 2: Wrap accordion items in GlassPanel, migrate notes section**

Inside each AccordionContent, wrap content in `GlassPanel`:
```typescript
<AccordionContent>
  <GlassPanel className="p-4 mt-2">
    {/* existing field grid */}
  </GlassPanel>
</AccordionContent>
```

Migrate operator notes section:
```typescript
// FROM:
<div className="rounded-lg border bg-muted/50 p-4">

// TO:
<WidgetContainer title="Notas do Operador" icon={MessageSquare}>
```

- [ ] **Step 3: Commit**

---

### Task 6.5: Migrate modulo-*.tsx components (batch)

**Files:**
- Modify: All 12 `modulo-*.tsx` files + `modulo-consolidacao-final.tsx`

- [ ] **Step 1: Identify the common pattern across all module files**

Each modulo file follows the same structure:
- Title `<h3>` → `<Heading level="card">`
- Description `<p>` → `<Text variant="caption">`
- Conditional blocks `<div className="rounded-lg border bg-muted/20 p-4">` → `<GlassPanel className="p-4">`
- Form field groups → wrap in `<div className="space-y-4">` (keep as-is, no WidgetContainer needed for simple form fields)

- [ ] **Step 2: Apply batch migration to all 13 files**

For each file:
```typescript
// ADD:
import { Heading, Text } from '@/components/ui/typography';
import { GlassPanel } from '@/components/shared/glass-panel';

// REPLACE:
<h3 className="text-lg font-semibold">Title</h3>
// WITH:
<Heading level="card">Title</Heading>

// REPLACE conditional blocks:
<div className="rounded-lg border bg-muted/20 p-4">
// WITH:
<GlassPanel className="p-4">
```

- [ ] **Step 3: Run type-check**

Run: `npm run type-check`

- [ ] **Step 4: Commit**

```bash
git add src/app/\(authenticated\)/entrevistas-trabalhistas/components/
git commit -m "refactor(entrevistas): migrate all module components to Glass Briefing

Batch migration of 13 modulo-*.tsx files: h3→Heading, p→Text,
conditional blocks→GlassPanel. No logic changes.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 6.6: Migrate utility components

**Files:**
- Modify: `src/app/(authenticated)/entrevistas-trabalhistas/components/testemunhas-toggle.tsx`
- Modify: `src/app/(authenticated)/entrevistas-trabalhistas/components/anexo-upload-zone.tsx`

- [ ] **Step 1: testemunhas-toggle.tsx**

```typescript
// FROM:
<div className="rounded-lg border p-4">

// TO:
import { GlassPanel } from '@/components/shared/glass-panel';
<GlassPanel className="p-4">
```

- [ ] **Step 2: anexo-upload-zone.tsx**

```typescript
// FROM:
<div className="rounded-lg border bg-muted/20 p-4">

// TO:
import { GlassPanel } from '@/components/shared/glass-panel';
<GlassPanel className="p-4">
```

- [ ] **Step 3: Run type-check**

- [ ] **Step 4: Commit**

```bash
git add src/app/\(authenticated\)/entrevistas-trabalhistas/components/testemunhas-toggle.tsx src/app/\(authenticated\)/entrevistas-trabalhistas/components/anexo-upload-zone.tsx
git commit -m "refactor(entrevistas): migrate utility components to GlassPanel

testemunhas-toggle and anexo-upload-zone: replace styled divs
with GlassPanel for consistent glass depth system.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Final QA

### Task 7.1: Full visual QA

- [ ] **Step 1: Run dev server and walk through every page**

Checklist:
- [ ] Main page: KPIs render, stepper clickable, banners conditional, table works
- [ ] Detail page: header with stepper, mini KPIs, all 7 tabs render
- [ ] Tab Resumo: WidgetContainers with proper glass
- [ ] Tab Partes: GlassPanel cards with avatars
- [ ] Tab Processos: WidgetContainer with links
- [ ] Tab Financeiro: 3 KPI cards + progress bar + table
- [ ] Tab Documentos: WidgetContainer with doc grid
- [ ] Tab Timeline: Vertical timeline with semantic icons
- [ ] Tab Entrevista: Empty state / Wizard / Resumo views
- [ ] Kanban page: GlassPanel columns
- [ ] Pipelines config: DataTable
- [ ] Tipos config: DataTable
- [ ] Dark mode: ALL pages
- [ ] Light mode: ALL pages
- [ ] Mobile (375px): Main page, detail page
- [ ] Tablet (768px): Main page, detail page

- [ ] **Step 2: Fix any issues**

- [ ] **Step 3: Run type-check and architecture check**

```bash
npm run type-check
npm run check:architecture
```

- [ ] **Step 4: Final commit**

```bash
git commit -m "fix(contratos): QA visual fixes for Glass Briefing redesign

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```
