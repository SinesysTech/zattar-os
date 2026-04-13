# Comunica CNJ — Gazette Fusion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the Comunica CNJ module from a 2-tab search/list into a Gazette Fusion command center with interactive KPIs, progressive filters, table/card toggle, detail panel, orphan resolution, AI features, and timelines.

**Architecture:** Incremental rebuild. Phase 1 lays DB + types foundation. Phase 2 replaces the page shell with KPIs + filters. Phase 3 builds the data views (table/cards/detail). Phase 4 adds orphan resolution. Phase 5 adds AI features. Phase 6 polishes (empty states, responsive, keyboard shortcuts). Each phase is independently deployable.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript 5, Tailwind CSS 4, shadcn/ui, Supabase (PostgreSQL + RLS), Zustand, Zod, GlassPanel design system.

**Spec:** `docs/superpowers/specs/2026-04-13-comunica-cnj-redesign-design.md`
**Mock:** `docs/superpowers/mocks/comunica-cnj/index.html`

---

## File Structure

### New Files to Create

```
src/app/(authenticated)/captura/comunica-cnj/
├── domain.ts                          (MODIFY - add new types, enums, schemas)
├── service.ts                         (MODIFY - add metrics, matching, sync log)
├── repository.ts                      (MODIFY - add metrics queries, sync log, views)
├── actions.ts                         (MODIFY - add new safe-actions)

src/app/(authenticated)/captura/components/comunica-cnj/
├── tabs-content.tsx                   (REPLACE - new page architecture)
├── consulta.tsx                       (DELETE - merged into unified view)
├── capturadas.tsx                     (DELETE - merged into unified view)
├── search-form.tsx                    (DELETE - replaced by filter system)
├── results-table.tsx                  (REPLACE - new GazetteDataTable)
├── detalhes-dialog.tsx                (REPLACE - new GazetteDetailPanel)
├── pdf-viewer-dialog.tsx              (MODIFY - add split-view metadata)
├── index.ts                           (MODIFY - update exports)
│
├── gazette-page.tsx                   (CREATE - main page orchestrator)
├── gazette-kpi-strip.tsx              (CREATE - 5 interactive KPI cards)
├── gazette-kpi-card.tsx               (CREATE - single KPI card component)
├── gazette-search-bar.tsx             (CREATE - NLP search with interpretation)
├── gazette-filter-bar.tsx             (CREATE - filter buttons + popovers)
├── gazette-filter-chips.tsx           (CREATE - active filter chips)
├── gazette-view-tabs.tsx              (CREATE - saved view tabs)
├── gazette-data-table.tsx             (CREATE - high-density table)
├── gazette-card-grid.tsx              (CREATE - card mode grid)
├── gazette-detail-panel.tsx           (CREATE - slide-in detail panel)
├── gazette-orphan-resolver.tsx        (CREATE - split-panel resolution)
├── gazette-timeline.tsx               (CREATE - reusable vertical timeline)
├── gazette-ai-insights.tsx            (CREATE - proactive insight cards)
├── gazette-ai-summary.tsx             (CREATE - AI summary block)
├── gazette-sync-dialog.tsx            (CREATE - manual sync dialog)
├── gazette-create-view-dialog.tsx     (CREATE - create saved view dialog)
├── gazette-column-config.tsx          (CREATE - column configuration popover)
├── gazette-keyboard-help.tsx          (CREATE - keyboard shortcuts dialog)
├── gazette-empty-states.tsx           (CREATE - contextual empty states)
├── gazette-alert-banner.tsx           (CREATE - deadline alert banner)
│
├── hooks/
│   ├── use-gazette-store.ts           (CREATE - Zustand store)
│   ├── use-gazette-filters.ts         (CREATE - filter state management)
│   ├── use-gazette-views.ts           (CREATE - saved views management)
│   └── use-gazette-keyboard.ts        (CREATE - keyboard shortcuts)

supabase/migrations/
├── 20260413000001_add_comunica_cnj_views.sql      (CREATE)
├── 20260413000002_add_comunica_cnj_sync_log.sql   (CREATE)
├── 20260413000003_add_comunica_cnj_resumos.sql    (CREATE)
```

### Existing Files to Modify

```
src/app/(authenticated)/comunica-cnj/page.tsx      (MODIFY - update to use new gazette-page)
src/app/(authenticated)/captura/actions/comunica-cnj-actions.ts  (MODIFY - add new action exports)
src/app/(authenticated)/captura/index.ts           (MODIFY - update barrel exports)
src/app/globals.css                                (MODIFY - add --gazette-* tokens if needed)
```

---

## Phase 1: Foundation (Database + Types + Actions)

### Task 1: Database Migrations

**Files:**
- Create: `supabase/migrations/20260413000001_add_comunica_cnj_views.sql`
- Create: `supabase/migrations/20260413000002_add_comunica_cnj_sync_log.sql`
- Create: `supabase/migrations/20260413000003_add_comunica_cnj_resumos.sql`

- [ ] **Step 1: Create views table migration**

```sql
-- supabase/migrations/20260413000001_add_comunica_cnj_views.sql

create table if not exists comunica_cnj_views (
  id bigserial primary key,
  nome text not null,
  icone text default 'bookmark',
  filtros jsonb not null default '{}',
  colunas jsonb not null default '[]',
  sort jsonb not null default '{}',
  densidade text not null default 'padrao' check (densidade in ('compacto', 'padrao', 'confortavel')),
  modo_visualizacao text not null default 'tabela' check (modo_visualizacao in ('tabela', 'cards')),
  visibilidade text not null default 'pessoal' check (visibilidade in ('pessoal', 'equipe')),
  criado_por bigint not null references usuarios(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table comunica_cnj_views enable row level security;

create policy "Usuarios podem ver views pessoais e de equipe"
  on comunica_cnj_views for select
  using (
    criado_por = (select auth.uid()::bigint)
    or visibilidade = 'equipe'
  );

create policy "Usuarios podem criar views"
  on comunica_cnj_views for insert
  with check (criado_por = (select auth.uid()::bigint));

create policy "Usuarios podem editar suas views"
  on comunica_cnj_views for update
  using (criado_por = (select auth.uid()::bigint));

create policy "Usuarios podem deletar suas views"
  on comunica_cnj_views for delete
  using (criado_por = (select auth.uid()::bigint));
```

- [ ] **Step 2: Create sync log table migration**

```sql
-- supabase/migrations/20260413000002_add_comunica_cnj_sync_log.sql

create table if not exists comunica_cnj_sync_log (
  id bigserial primary key,
  tipo text not null check (tipo in ('automatica', 'manual')),
  status text not null check (status in ('sucesso', 'erro', 'em_andamento')),
  total_processados int not null default 0,
  novos int not null default 0,
  duplicados int not null default 0,
  vinculados_auto int not null default 0,
  orfaos int not null default 0,
  erros jsonb not null default '[]',
  parametros jsonb not null default '{}',
  duracao_ms int,
  executado_por bigint not null references usuarios(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table comunica_cnj_sync_log enable row level security;

create policy "Usuarios autenticados podem ver logs de sync"
  on comunica_cnj_sync_log for select
  using (true);

create policy "Usuarios autenticados podem criar logs"
  on comunica_cnj_sync_log for insert
  with check (executado_por = (select auth.uid()::bigint));
```

- [ ] **Step 3: Create resumos table migration**

```sql
-- supabase/migrations/20260413000003_add_comunica_cnj_resumos.sql

create table if not exists comunica_cnj_resumos (
  id bigserial primary key,
  comunicacao_id bigint not null references comunica_cnj(id) on delete cascade,
  resumo text not null,
  tags jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(comunicacao_id)
);

alter table comunica_cnj_resumos enable row level security;

create policy "Usuarios autenticados podem ver resumos"
  on comunica_cnj_resumos for select
  using (true);

create policy "Usuarios autenticados podem criar/atualizar resumos"
  on comunica_cnj_resumos for insert
  with check (true);

create policy "Usuarios autenticados podem atualizar resumos"
  on comunica_cnj_resumos for update
  using (true);
```

- [ ] **Step 4: Apply migrations**

Run: `npx supabase migration up` or apply via Supabase dashboard.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260413000001_add_comunica_cnj_views.sql \
        supabase/migrations/20260413000002_add_comunica_cnj_sync_log.sql \
        supabase/migrations/20260413000003_add_comunica_cnj_resumos.sql
git commit -m "feat(comunica-cnj): add database migrations for views, sync log, and resumos"
```

---

### Task 2: Domain Types & Schemas

**Files:**
- Modify: `src/app/(authenticated)/captura/comunica-cnj/domain.ts`

- [ ] **Step 1: Add new types to domain.ts**

Append to the end of `domain.ts`:

```typescript
// ===== GAZETTE FUSION TYPES =====

// View status for unified data model
export type StatusVinculacao = 'vinculado' | 'pendente' | 'orfao' | 'irrelevante';

// KPI metrics aggregate
export interface GazetteMetrics {
  publicacoesHoje: number;
  vinculados: number;
  totalCapturadas: number;
  pendentes: number;
  prazosCriticos: number;
  orfaos: number;
  orfaosComSugestao: number;
  taxaVinculacao: number;
}

// Sparkline data point
export interface SparklinePoint {
  date: string;
  count: number;
}

// Filter state
export interface GazetteFilters {
  fonte?: string[];
  tipo?: string[];
  periodo?: { inicio: string; fim: string };
  advogadoId?: number;
  meio?: MeioComunicacao | null;
  status?: StatusVinculacao[];
  processo?: string;
  parte?: string;
  texto?: string;
}

// Saved view
export interface GazetteView {
  id: number;
  nome: string;
  icone: string;
  filtros: GazetteFilters;
  colunas: string[];
  sort: { campo: string; direcao: 'asc' | 'desc' };
  densidade: 'compacto' | 'padrao' | 'confortavel';
  modoVisualizacao: 'tabela' | 'cards';
  visibilidade: 'pessoal' | 'equipe';
  criadoPor: number;
  createdAt: string;
  updatedAt: string;
}

// Sync log entry
export interface SyncLogEntry {
  id: number;
  tipo: 'automatica' | 'manual';
  status: 'sucesso' | 'erro' | 'em_andamento';
  totalProcessados: number;
  novos: number;
  duplicados: number;
  vinculadosAuto: number;
  orfaos: number;
  erros: Array<{ mensagem: string; processo?: string }>;
  parametros: Record<string, unknown>;
  duracaoMs: number | null;
  executadoPor: number;
  createdAt: string;
}

// AI Match suggestion
export interface MatchSugestao {
  expedienteId: number;
  expedienteNumero: string;
  processoNumero: string;
  partes: string;
  vara: string;
  grau: string;
  status: string;
  criadoEm: string;
  confianca: number;
  criterios: MatchCriterio[];
}

export interface MatchCriterio {
  campo: string;
  match: boolean;
  detalhe: string;
}

// AI Resumo
export interface ComunicacaoResumo {
  id: number;
  comunicacaoId: number;
  resumo: string;
  tags: Array<{ tipo: 'prazo' | 'valor' | 'acao' | 'parte'; texto: string }>;
  createdAt: string;
  updatedAt: string;
}

// AI Insight
export interface GazetteInsight {
  tipo: 'padrao' | 'atencao' | 'relatorio';
  titulo: string;
  descricao: string;
  linkFiltro?: GazetteFilters;
}

// Extended ComunicacaoCNJ with computed fields for the UI
export interface ComunicacaoCNJEnriquecida extends ComunicacaoCNJ {
  statusVinculacao: StatusVinculacao;
  diasParaPrazo: number | null;
  resumoAI?: ComunicacaoResumo;
  matchSugestao?: MatchSugestao;
  partesAutor: string[];
  partesReu: string[];
}

// Zod schemas for new actions
export const salvarViewSchema = z.object({
  nome: z.string().min(1).max(100),
  icone: z.string().default('bookmark'),
  filtros: z.record(z.unknown()).default({}),
  colunas: z.array(z.string()).default([]),
  sort: z.object({
    campo: z.string(),
    direcao: z.enum(['asc', 'desc']),
  }).default({ campo: 'data_disponibilizacao', direcao: 'desc' }),
  densidade: z.enum(['compacto', 'padrao', 'confortavel']).default('padrao'),
  modoVisualizacao: z.enum(['tabela', 'cards']).default('tabela'),
  visibilidade: z.enum(['pessoal', 'equipe']).default('pessoal'),
});

export const buscarMatchSchema = z.object({
  comunicacaoId: z.number().int().positive(),
});

export const aceitarMatchBatchSchema = z.object({
  confiancaMinima: z.number().min(0).max(100).default(85),
});

export type SalvarViewInput = z.infer<typeof salvarViewSchema>;
```

- [ ] **Step 2: Verify types compile**

Run: `npm run type-check`
Expected: No new errors from domain.ts changes.

- [ ] **Step 3: Commit**

```bash
git add src/app/(authenticated)/captura/comunica-cnj/domain.ts
git commit -m "feat(comunica-cnj): add Gazette Fusion domain types, interfaces, and schemas"
```

---

### Task 3: Repository Extensions

**Files:**
- Modify: `src/app/(authenticated)/captura/comunica-cnj/repository.ts`

- [ ] **Step 1: Add metrics query function**

Append to repository.ts:

```typescript
// ===== GAZETTE FUSION REPOSITORY EXTENSIONS =====

export async function findMetricas(advogadoId?: number): Promise<Result<GazetteMetrics>> {
  const client = await createServiceClient();

  // Base query for today's publications
  let hojeQuery = client
    .from(TABLE_COMUNICA_CNJ)
    .select('id, expediente_id', { count: 'exact', head: true })
    .gte('data_disponibilizacao', new Date().toISOString().split('T')[0]);

  if (advogadoId) {
    hojeQuery = hojeQuery.eq('advogado_id', advogadoId);
  }

  const { count: totalHoje, error: hojeErr } = await hojeQuery;
  if (hojeErr) return err(appError('QUERY_ERROR', hojeErr.message));

  // Count by status
  const { count: totalCapturadas } = await client
    .from(TABLE_COMUNICA_CNJ)
    .select('id', { count: 'exact', head: true });

  const { count: vinculados } = await client
    .from(TABLE_COMUNICA_CNJ)
    .select('id', { count: 'exact', head: true })
    .not('expediente_id', 'is', null);

  const { count: orfaos } = await client
    .from(TABLE_COMUNICA_CNJ)
    .select('id', { count: 'exact', head: true })
    .is('expediente_id', null);

  const publicacoesHoje = totalHoje ?? 0;
  const vinculadosCount = vinculados ?? 0;
  const orfaosCount = orfaos ?? 0;
  const total = totalCapturadas ?? 0;
  const pendentes = total - vinculadosCount - orfaosCount;

  return ok({
    publicacoesHoje,
    vinculados: vinculadosCount,
    totalCapturadas: total,
    pendentes: Math.max(0, pendentes),
    prazosCriticos: 0, // TODO: computed from deadline extraction
    orfaos: orfaosCount,
    orfaosComSugestao: 0, // TODO: computed from match results
    taxaVinculacao: total > 0 ? Math.round((vinculadosCount / total) * 100) : 0,
  });
}

// Sync log operations
export async function saveSyncLog(data: Omit<SyncLogEntry, 'id' | 'createdAt'>): Promise<Result<SyncLogEntry>> {
  const client = await createServiceClient();
  const { data: row, error } = await client
    .from('comunica_cnj_sync_log')
    .insert({
      tipo: data.tipo,
      status: data.status,
      total_processados: data.totalProcessados,
      novos: data.novos,
      duplicados: data.duplicados,
      vinculados_auto: data.vinculadosAuto,
      orfaos: data.orfaos,
      erros: data.erros,
      parametros: data.parametros,
      duracao_ms: data.duracaoMs,
      executado_por: data.executadoPor,
    })
    .select()
    .single();

  if (error) return err(appError('INSERT_ERROR', error.message));
  return ok(converterParaSyncLog(row));
}

export async function findSyncLogs(limite: number = 10): Promise<Result<SyncLogEntry[]>> {
  const client = await createServiceClient();
  const { data: rows, error } = await client
    .from('comunica_cnj_sync_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limite);

  if (error) return err(appError('QUERY_ERROR', error.message));
  return ok((rows ?? []).map(converterParaSyncLog));
}

function converterParaSyncLog(row: Record<string, unknown>): SyncLogEntry {
  return {
    id: row.id as number,
    tipo: row.tipo as SyncLogEntry['tipo'],
    status: row.status as SyncLogEntry['status'],
    totalProcessados: row.total_processados as number,
    novos: row.novos as number,
    duplicados: row.duplicados as number,
    vinculadosAuto: row.vinculados_auto as number,
    orfaos: row.orfaos as number,
    erros: row.erros as SyncLogEntry['erros'],
    parametros: row.parametros as Record<string, unknown>,
    duracaoMs: row.duracao_ms as number | null,
    executadoPor: row.executado_por as number,
    createdAt: row.created_at as string,
  };
}

// Views operations
export async function findViews(usuarioId: number): Promise<Result<GazetteView[]>> {
  const client = await createServiceClient();
  const { data: rows, error } = await client
    .from('comunica_cnj_views')
    .select('*')
    .or(`criado_por.eq.${usuarioId},visibilidade.eq.equipe`)
    .order('created_at', { ascending: true });

  if (error) return err(appError('QUERY_ERROR', error.message));
  return ok((rows ?? []).map(converterParaView));
}

export async function saveView(data: SalvarViewInput & { criadoPor: number }): Promise<Result<GazetteView>> {
  const client = await createServiceClient();
  const { data: row, error } = await client
    .from('comunica_cnj_views')
    .insert({
      nome: data.nome,
      icone: data.icone,
      filtros: data.filtros,
      colunas: data.colunas,
      sort: data.sort,
      densidade: data.densidade,
      modo_visualizacao: data.modoVisualizacao,
      visibilidade: data.visibilidade,
      criado_por: data.criadoPor,
    })
    .select()
    .single();

  if (error) return err(appError('INSERT_ERROR', error.message));
  return ok(converterParaView(row));
}

export async function deleteView(viewId: number, usuarioId: number): Promise<Result<void>> {
  const client = await createServiceClient();
  const { error } = await client
    .from('comunica_cnj_views')
    .delete()
    .eq('id', viewId)
    .eq('criado_por', usuarioId);

  if (error) return err(appError('DELETE_ERROR', error.message));
  return ok(undefined);
}

function converterParaView(row: Record<string, unknown>): GazetteView {
  return {
    id: row.id as number,
    nome: row.nome as string,
    icone: row.icone as string,
    filtros: row.filtros as GazetteFilters,
    colunas: row.colunas as string[],
    sort: row.sort as GazetteView['sort'],
    densidade: row.densidade as GazetteView['densidade'],
    modoVisualizacao: row.modo_visualizacao as GazetteView['modoVisualizacao'],
    visibilidade: row.visibilidade as GazetteView['visibilidade'],
    criadoPor: row.criado_por as number,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

// AI Resumo operations
export async function findResumo(comunicacaoId: number): Promise<Result<ComunicacaoResumo | null>> {
  const client = await createServiceClient();
  const { data: row, error } = await client
    .from('comunica_cnj_resumos')
    .select('*')
    .eq('comunicacao_id', comunicacaoId)
    .maybeSingle();

  if (error) return err(appError('QUERY_ERROR', error.message));
  if (!row) return ok(null);
  return ok({
    id: row.id,
    comunicacaoId: row.comunicacao_id,
    resumo: row.resumo,
    tags: row.tags as ComunicacaoResumo['tags'],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

export async function saveResumo(comunicacaoId: number, resumo: string, tags: ComunicacaoResumo['tags']): Promise<Result<ComunicacaoResumo>> {
  const client = await createServiceClient();
  const { data: row, error } = await client
    .from('comunica_cnj_resumos')
    .upsert({
      comunicacao_id: comunicacaoId,
      resumo,
      tags,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'comunicacao_id' })
    .select()
    .single();

  if (error) return err(appError('UPSERT_ERROR', error.message));
  return ok({
    id: row.id,
    comunicacaoId: row.comunicacao_id,
    resumo: row.resumo,
    tags: row.tags as ComunicacaoResumo['tags'],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}
```

- [ ] **Step 2: Add necessary imports at top of repository.ts**

Add to the existing imports:

```typescript
import type {
  GazetteMetrics,
  SyncLogEntry,
  GazetteView,
  GazetteFilters,
  ComunicacaoResumo,
  SalvarViewInput,
} from './domain';
```

- [ ] **Step 3: Verify types compile**

Run: `npm run type-check`

- [ ] **Step 4: Commit**

```bash
git add src/app/(authenticated)/captura/comunica-cnj/repository.ts
git commit -m "feat(comunica-cnj): add repository functions for metrics, views, sync log, and resumos"
```

---

### Task 4: New Server Actions

**Files:**
- Modify: `src/app/(authenticated)/captura/comunica-cnj/actions.ts`
- Modify: `src/app/(authenticated)/captura/actions/comunica-cnj-actions.ts`

- [ ] **Step 1: Add safe-action wrappers in captura/comunica-cnj/actions.ts**

Append to the file:

```typescript
// ===== GAZETTE FUSION ACTIONS =====

import {
  salvarViewSchema,
  buscarMatchSchema,
  aceitarMatchBatchSchema,
} from './domain';
import {
  findMetricas,
  findSyncLogs,
  saveSyncLog,
  findViews,
  saveView,
  deleteView,
  findResumo,
  saveResumo,
} from './repository';

export const actionObterMetricasSafe = authenticatedAction(
  z.object({ advogadoId: z.number().optional() }),
  async (input) => {
    const result = await findMetricas(input.advogadoId);
    if (result.isErr()) throw new Error(result.error.message);
    return result.value;
  }
);

export const actionListarSyncLogsSafe = authenticatedAction(
  z.object({ limite: z.number().int().min(1).max(50).default(10) }),
  async (input) => {
    const result = await findSyncLogs(input.limite);
    if (result.isErr()) throw new Error(result.error.message);
    return result.value;
  }
);

export const actionSalvarViewSafe = authenticatedAction(
  salvarViewSchema,
  async (input, user) => {
    const result = await saveView({ ...input, criadoPor: user.id });
    if (result.isErr()) throw new Error(result.error.message);
    revalidatePath('/app/comunica-cnj');
    return result.value;
  }
);

export const actionListarViewsSafe = authenticatedAction(
  z.object({}),
  async (_input, user) => {
    const result = await findViews(user.id);
    if (result.isErr()) throw new Error(result.error.message);
    return result.value;
  }
);

export const actionDeletarViewSafe = authenticatedAction(
  z.object({ viewId: z.number().int().positive() }),
  async (input, user) => {
    const result = await deleteView(input.viewId, user.id);
    if (result.isErr()) throw new Error(result.error.message);
    revalidatePath('/app/comunica-cnj');
    return { success: true };
  }
);

export const actionObterResumoSafe = authenticatedAction(
  buscarMatchSchema,
  async (input) => {
    const result = await findResumo(input.comunicacaoId);
    if (result.isErr()) throw new Error(result.error.message);
    return result.value;
  }
);
```

- [ ] **Step 2: Add client-facing actions in captura/actions/comunica-cnj-actions.ts**

Append to the file:

```typescript
// ===== GAZETTE FUSION CLIENT ACTIONS =====

export async function actionObterMetricas(params?: { advogadoId?: number }) {
  const user = await requireAuth(['comunica_cnj:listar']);
  try {
    const { findMetricas } = await import(
      '@/app/(authenticated)/captura/comunica-cnj/repository'
    );
    const result = await findMetricas(params?.advogadoId);
    if (result.isErr()) return { success: false, error: result.error.message };
    return { success: true, data: result.value };
  } catch (error) {
    return { success: false, error: 'Erro ao obter metricas' };
  }
}

export async function actionListarViews() {
  const user = await requireAuth();
  try {
    const { findViews } = await import(
      '@/app/(authenticated)/captura/comunica-cnj/repository'
    );
    const result = await findViews(user.id);
    if (result.isErr()) return { success: false, error: result.error.message };
    return { success: true, data: result.value };
  } catch (error) {
    return { success: false, error: 'Erro ao listar views' };
  }
}

export async function actionListarSyncLogs(limite: number = 10) {
  await requireAuth(['comunica_cnj:listar']);
  try {
    const { findSyncLogs } = await import(
      '@/app/(authenticated)/captura/comunica-cnj/repository'
    );
    const result = await findSyncLogs(limite);
    if (result.isErr()) return { success: false, error: result.error.message };
    return { success: true, data: result.value };
  } catch (error) {
    return { success: false, error: 'Erro ao listar logs de sincronizacao' };
  }
}
```

- [ ] **Step 3: Verify compilation**

Run: `npm run type-check`

- [ ] **Step 4: Commit**

```bash
git add src/app/(authenticated)/captura/comunica-cnj/actions.ts \
        src/app/(authenticated)/captura/actions/comunica-cnj-actions.ts
git commit -m "feat(comunica-cnj): add server actions for metrics, views, and sync logs"
```

---

## Phase 2: Page Architecture (KPIs + Filters + Store)

### Task 5: Zustand Store

**Files:**
- Create: `src/app/(authenticated)/captura/components/comunica-cnj/hooks/use-gazette-store.ts`

- [ ] **Step 1: Create the Zustand store**

```typescript
'use client';

import { create } from 'zustand';
import type {
  GazetteFilters,
  GazetteMetrics,
  StatusVinculacao,
  ComunicacaoCNJEnriquecida,
  GazetteView,
  SyncLogEntry,
  GazetteInsight,
} from '@/app/(authenticated)/captura/comunica-cnj/domain';

interface GazetteState {
  // Data
  comunicacoes: ComunicacaoCNJEnriquecida[];
  metricas: GazetteMetrics | null;
  views: GazetteView[];
  syncLogs: SyncLogEntry[];
  insights: GazetteInsight[];

  // UI state
  filtros: GazetteFilters;
  viewAtiva: string; // 'todas' | 'pendentes' | 'orfaos' | 'prazos' | 'meus' | view ID
  modoVisualizacao: 'tabela' | 'cards';
  densidade: 'compacto' | 'padrao' | 'confortavel';
  comunicacaoSelecionada: ComunicacaoCNJEnriquecida | null;
  detailPanelAberto: boolean;
  kpiAtivo: string | null; // which KPI is filtering
  isLoading: boolean;
  isSyncing: boolean;

  // Actions
  setFiltros: (filtros: Partial<GazetteFilters>) => void;
  limparFiltros: () => void;
  setViewAtiva: (view: string) => void;
  setModoVisualizacao: (modo: 'tabela' | 'cards') => void;
  setDensidade: (d: 'compacto' | 'padrao' | 'confortavel') => void;
  selecionarComunicacao: (c: ComunicacaoCNJEnriquecida | null) => void;
  toggleDetailPanel: (aberto?: boolean) => void;
  toggleKpi: (kpi: string | null) => void;
  setComunicacoes: (c: ComunicacaoCNJEnriquecida[]) => void;
  setMetricas: (m: GazetteMetrics) => void;
  setViews: (v: GazetteView[]) => void;
  setSyncLogs: (l: SyncLogEntry[]) => void;
  setInsights: (i: GazetteInsight[]) => void;
  setIsLoading: (l: boolean) => void;
  setIsSyncing: (s: boolean) => void;
}

export const useGazetteStore = create<GazetteState>((set) => ({
  // Data
  comunicacoes: [],
  metricas: null,
  views: [],
  syncLogs: [],
  insights: [],

  // UI state
  filtros: {},
  viewAtiva: 'todas',
  modoVisualizacao: 'tabela',
  densidade: 'padrao',
  comunicacaoSelecionada: null,
  detailPanelAberto: false,
  kpiAtivo: null,
  isLoading: false,
  isSyncing: false,

  // Actions
  setFiltros: (filtros) =>
    set((state) => ({ filtros: { ...state.filtros, ...filtros } })),
  limparFiltros: () => set({ filtros: {}, kpiAtivo: null }),
  setViewAtiva: (view) => set({ viewAtiva: view }),
  setModoVisualizacao: (modo) => set({ modoVisualizacao: modo }),
  setDensidade: (d) => set({ densidade: d }),
  selecionarComunicacao: (c) =>
    set({ comunicacaoSelecionada: c, detailPanelAberto: c !== null }),
  toggleDetailPanel: (aberto) =>
    set((state) => ({
      detailPanelAberto: aberto ?? !state.detailPanelAberto,
      comunicacaoSelecionada: aberto === false ? null : state.comunicacaoSelecionada,
    })),
  toggleKpi: (kpi) =>
    set((state) => ({
      kpiAtivo: state.kpiAtivo === kpi ? null : kpi,
    })),
  setComunicacoes: (c) => set({ comunicacoes: c }),
  setMetricas: (m) => set({ metricas: m }),
  setViews: (v) => set({ views: v }),
  setSyncLogs: (l) => set({ syncLogs: l }),
  setInsights: (i) => set({ insights: i }),
  setIsLoading: (l) => set({ isLoading: l }),
  setIsSyncing: (s) => set({ isSyncing: s }),
}));
```

- [ ] **Step 2: Commit**

```bash
git add src/app/(authenticated)/captura/components/comunica-cnj/hooks/use-gazette-store.ts
git commit -m "feat(comunica-cnj): add Zustand store for Gazette Fusion state management"
```

---

### Task 6: KPI Strip Components

**Files:**
- Create: `src/app/(authenticated)/captura/components/comunica-cnj/gazette-kpi-card.tsx`
- Create: `src/app/(authenticated)/captura/components/comunica-cnj/gazette-kpi-strip.tsx`

- [ ] **Step 1: Create GazetteKpiCard component**

```typescript
'use client';

import { cn } from '@/lib/utils';
import { GlassPanel } from '@/components/shared/glass-panel';
import { Text } from '@/components/ui/typography';

interface GazetteKpiCardProps {
  label: string;
  value: number;
  trend?: { valor: string; texto: string; tipo: 'up' | 'down' | 'neutral' };
  sparkline?: number[];
  progressBar?: { valor: number; max: number };
  isActive?: boolean;
  isDanger?: boolean;
  badge?: { texto: string; cor: string };
  onClick?: () => void;
}

export function GazetteKpiCard({
  label,
  value,
  trend,
  sparkline,
  progressBar,
  isActive = false,
  isDanger = false,
  badge,
  onClick,
}: GazetteKpiCardProps) {
  return (
    <GlassPanel
      depth={isActive ? 3 : 2}
      className={cn(
        'cursor-pointer transition-all duration-200 relative',
        isActive && 'ring-1 ring-primary/25',
        isDanger && 'border-destructive/20 bg-destructive/[0.03]',
      )}
      onClick={onClick}
    >
      {isActive && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary rounded-t-2xl" />
      )}
      <div className="p-4">
        <Text variant="meta-label" className="text-muted-foreground/40 mb-1">
          {label}
        </Text>
        <Text
          variant="kpi-value"
          className={cn(isDanger && 'text-destructive')}
        >
          {value}
        </Text>
        {trend && (
          <div className="flex items-center gap-1 mt-1">
            <span
              className={cn(
                'text-[11px]',
                trend.tipo === 'up' && 'text-success',
                trend.tipo === 'down' && 'text-destructive',
                trend.tipo === 'neutral' && 'text-muted-foreground/50',
              )}
            >
              {trend.valor}
            </span>
            <Text variant="micro-caption">{trend.texto}</Text>
          </div>
        )}
        {badge && (
          <div className="flex items-center gap-1 mt-1">
            <span className={cn('text-[11px]', badge.cor)}>{badge.texto}</span>
          </div>
        )}
        {sparkline && sparkline.length > 0 && (
          <div className="mt-2 h-5 flex items-end gap-0.5">
            {sparkline.map((v, i) => {
              const max = Math.max(...sparkline);
              const height = max > 0 ? (v / max) * 20 : 2;
              const isLast = i === sparkline.length - 1;
              return (
                <div
                  key={i}
                  className={cn(
                    'w-1 rounded-sm',
                    isLast ? 'bg-primary' : 'bg-primary/30',
                  )}
                  style={{ height: `${height}px` }}
                />
              );
            })}
          </div>
        )}
        {progressBar && (
          <div className="mt-2 h-1 bg-muted-foreground/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-success to-success/70 rounded-full"
              style={{
                width: `${Math.min(100, (progressBar.valor / progressBar.max) * 100)}%`,
              }}
            />
          </div>
        )}
      </div>
    </GlassPanel>
  );
}
```

- [ ] **Step 2: Create GazetteKpiStrip component**

```typescript
'use client';

import { useGazetteStore } from './hooks/use-gazette-store';
import { GazetteKpiCard } from './gazette-kpi-card';

export function GazetteKpiStrip() {
  const { metricas, kpiAtivo, toggleKpi } = useGazetteStore();

  if (!metricas) return null;

  return (
    <div className="px-6 py-3 grid grid-cols-5 gap-2.5 max-lg:grid-cols-3 max-md:flex max-md:overflow-x-auto max-md:gap-2 max-md:px-4">
      <GazetteKpiCard
        label="Publicacoes Hoje"
        value={metricas.publicacoesHoje}
        trend={{ valor: '▲ 12%', texto: 'vs. ontem', tipo: 'up' }}
        sparkline={[8, 12, 6, 16, 10, 18, 20]}
        isActive={kpiAtivo === 'hoje'}
        onClick={() => toggleKpi('hoje')}
      />
      <GazetteKpiCard
        label="Vinculados"
        value={metricas.vinculados}
        trend={{
          valor: `${metricas.taxaVinculacao}%`,
          texto: 'taxa vinculacao',
          tipo: 'up',
        }}
        progressBar={{ valor: metricas.vinculados, max: metricas.totalCapturadas }}
        isActive={kpiAtivo === 'vinculados'}
        onClick={() => toggleKpi('vinculados')}
      />
      <GazetteKpiCard
        label="Pendentes"
        value={metricas.pendentes}
        badge={{ texto: '⬤ aguardando triagem', cor: 'text-warning' }}
        isActive={kpiAtivo === 'pendentes'}
        onClick={() => toggleKpi('pendentes')}
      />
      <GazetteKpiCard
        label="Prazos Criticos"
        value={metricas.prazosCriticos}
        isDanger
        badge={{ texto: '⚠ vencem em <48h', cor: 'text-destructive/60' }}
        isActive={kpiAtivo === 'prazos'}
        onClick={() => toggleKpi('prazos')}
      />
      <GazetteKpiCard
        label="Orfaos"
        value={metricas.orfaos}
        badge={{
          texto: `AI ${metricas.orfaosComSugestao} com sugestao`,
          cor: 'text-primary',
        }}
        isActive={kpiAtivo === 'orfaos'}
        onClick={() => toggleKpi('orfaos')}
      />
    </div>
  );
}
```

- [ ] **Step 3: Verify compilation**

Run: `npm run type-check`

- [ ] **Step 4: Commit**

```bash
git add src/app/(authenticated)/captura/components/comunica-cnj/gazette-kpi-card.tsx \
        src/app/(authenticated)/captura/components/comunica-cnj/gazette-kpi-strip.tsx
git commit -m "feat(comunica-cnj): add GazetteKpiStrip and GazetteKpiCard components"
```

---

### Task 7: Alert Banner + AI Insights

**Files:**
- Create: `src/app/(authenticated)/captura/components/comunica-cnj/gazette-alert-banner.tsx`
- Create: `src/app/(authenticated)/captura/components/comunica-cnj/gazette-ai-insights.tsx`

- [ ] **Step 1: Create alert banner**

```typescript
'use client';

import { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface GazetteAlertBannerProps {
  count: number;
  descricao: string;
  onVerPrazos: () => void;
}

export function GazetteAlertBanner({ count, descricao, onVerPrazos }: GazetteAlertBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || count === 0) return null;

  return (
    <div className="px-6 py-2.5 bg-destructive/[0.04] border-b border-destructive/10 flex items-center gap-3">
      <div className="size-7 flex items-center justify-center bg-destructive/10 rounded-lg shrink-0">
        <AlertTriangle className="size-3.5 text-destructive" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-destructive">
          {count} prazos vencem nas proximas 48h
        </p>
        <p className="text-[11px] text-destructive/50 truncate">{descricao}</p>
      </div>
      <Button
        variant="outline"
        size="sm"
        className="border-destructive/20 text-destructive text-[11px] h-7 shrink-0"
        onClick={onVerPrazos}
      >
        Ver Prazos
      </Button>
      <button
        onClick={() => setDismissed(true)}
        className="text-muted-foreground/15 hover:text-muted-foreground/30 transition-colors"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Create AI insights row**

```typescript
'use client';

import { cn } from '@/lib/utils';
import { useGazetteStore } from './hooks/use-gazette-store';
import type { GazetteInsight } from '@/app/(authenticated)/captura/comunica-cnj/domain';

const INSIGHT_STYLES = {
  padrao: {
    bg: 'bg-primary/[0.04] border-primary/10',
    title: 'text-primary',
  },
  atencao: {
    bg: 'bg-warning/[0.04] border-warning/10',
    title: 'text-warning',
  },
  relatorio: {
    bg: 'bg-success/[0.04] border-success/10',
    title: 'text-success',
  },
} as const;

export function GazetteAiInsights() {
  const { insights } = useGazetteStore();

  if (insights.length === 0) return null;

  return (
    <div className="px-6 py-2 flex gap-2.5 overflow-x-auto">
      <div className="flex items-center gap-1.5 shrink-0 self-center">
        <span className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded font-medium">
          AI
        </span>
      </div>
      {insights.map((insight, i) => (
        <InsightCard key={i} insight={insight} />
      ))}
    </div>
  );
}

function InsightCard({ insight }: { insight: GazetteInsight }) {
  const style = INSIGHT_STYLES[insight.tipo];
  return (
    <div
      className={cn(
        'p-3 rounded-xl border min-w-[220px] max-w-[280px] shrink-0 cursor-pointer transition-all hover:-translate-y-px',
        style.bg,
      )}
    >
      <p className={cn('text-[11px] font-medium mb-1', style.title)}>
        {insight.titulo}
      </p>
      <p className="text-[11px] text-muted-foreground/40 line-clamp-2 leading-relaxed">
        {insight.descricao}
      </p>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/(authenticated)/captura/components/comunica-cnj/gazette-alert-banner.tsx \
        src/app/(authenticated)/captura/components/comunica-cnj/gazette-ai-insights.tsx
git commit -m "feat(comunica-cnj): add GazetteAlertBanner and GazetteAiInsights components"
```

---

### Task 8: View Tabs + Filter Bar + Chips

**Files:**
- Create: `src/app/(authenticated)/captura/components/comunica-cnj/gazette-view-tabs.tsx`
- Create: `src/app/(authenticated)/captura/components/comunica-cnj/gazette-filter-bar.tsx`
- Create: `src/app/(authenticated)/captura/components/comunica-cnj/gazette-filter-chips.tsx`

This task creates the 3 filter layer components. Due to the size of this task, the implementation should follow the patterns established in the mock HTML and the spec Section 4 (Search + Filtros Progressivos). Key interfaces:

- [ ] **Step 1: Create GazetteViewTabs**

Component that renders the view tab pills (Todas, Pendentes, Orfaos with badge, Prazos, Meus Processos, + View). Uses `useGazetteStore().viewAtiva` and `setViewAtiva`. Includes mode toggle (tabela/cards) and density toggle on the right side. Follow the `TabPills` pattern from `@/components/shared` but customize for this use case.

- [ ] **Step 2: Create GazetteFilterBar**

Horizontal bar of filter buttons. Each button opens a `Popover` (from shadcn/ui) with field-specific controls. Active filters show value inline in the button. Uses `useGazetteStore().filtros` and `setFiltros`. The Fonte popover reuses the grouped tribunal combobox pattern from the existing `search-form.tsx` (lines 170-290).

- [ ] **Step 3: Create GazetteFilterChips**

Row of removable chips below the filter bar. Each chip has a color based on category (Fonte=info, Tipo=success, Periodo=warning, Prazo=destructive). Renders only when filters are active. Uses `Badge` component with custom styling.

- [ ] **Step 4: Commit**

```bash
git add src/app/(authenticated)/captura/components/comunica-cnj/gazette-view-tabs.tsx \
        src/app/(authenticated)/captura/components/comunica-cnj/gazette-filter-bar.tsx \
        src/app/(authenticated)/captura/components/comunica-cnj/gazette-filter-chips.tsx
git commit -m "feat(comunica-cnj): add GazetteViewTabs, GazetteFilterBar, and GazetteFilterChips"
```

---

## Phase 3: Data Views (Table + Cards + Detail Panel)

### Task 9: Data Table Component

**Files:**
- Create: `src/app/(authenticated)/captura/components/comunica-cnj/gazette-data-table.tsx`

- [ ] **Step 1: Create the high-density table**

Build using `DataTable` from `@/components/shared/data-shell/data-table.tsx` as the base. Columns: checkbox, tipo (badge), processo/partes, orgao, fonte (badge), data, prazo (countdown badge), status (dot + text + AI badge), actions (dropdown). Support 3 density modes via row height classes. Row click calls `useGazetteStore().selecionarComunicacao()`. Selected row gets `bg-primary/[0.04] border-l-2 border-l-primary`. Use `SemanticBadge` for type and fonte columns.

- [ ] **Step 2: Add pagination**

Use `TablePagination` from `@/components/shared/table-pagination.tsx`. Page size options: 50, 100.

- [ ] **Step 3: Commit**

```bash
git add src/app/(authenticated)/captura/components/comunica-cnj/gazette-data-table.tsx
git commit -m "feat(comunica-cnj): add GazetteDataTable with 3 density modes and semantic badges"
```

---

### Task 10: Card Grid Component

**Files:**
- Create: `src/app/(authenticated)/captura/components/comunica-cnj/gazette-card-grid.tsx`

- [ ] **Step 1: Create the card grid**

Grid of publication cards. Each card is a `GlassPanel depth={2}` with: header (type badge + fonte badge + prazo + status dot), processo number (bold tabular-nums), partes + orgao (muted), excerpt (2-line clamp), footer (date + action buttons). Orphan cards get `border-warning/15 bg-warning/[0.02]` and a "Vincular" primary action button. Desktop: 2 columns. Tablet: 1 column. Card click calls `selecionarComunicacao()`.

- [ ] **Step 2: Commit**

```bash
git add src/app/(authenticated)/captura/components/comunica-cnj/gazette-card-grid.tsx
git commit -m "feat(comunica-cnj): add GazetteCardGrid with publication cards and orphan styling"
```

---

### Task 11: Detail Panel

**Files:**
- Create: `src/app/(authenticated)/captura/components/comunica-cnj/gazette-detail-panel.tsx`
- Create: `src/app/(authenticated)/captura/components/comunica-cnj/gazette-ai-summary.tsx`
- Create: `src/app/(authenticated)/captura/components/comunica-cnj/gazette-timeline.tsx`

- [ ] **Step 1: Create GazetteTimeline (reusable)**

Vertical timeline component. Props: `items: Array<{ id, badge: ReactNode, date: string, text: string, subtext?: string, isCurrent?: boolean }>`. Renders vertical line with dots (current=primary with glow, past=muted border). Each item is a small card. Used in both the detail panel (process timeline) and the sync timeline popover.

- [ ] **Step 2: Create GazetteAiSummary**

Block showing AI-generated summary. Props: `resumo: ComunicacaoResumo | null, onRegenerar: () => void`. Shows "AI" badge + summary text + extracted tags (prazo=destructive, valor=warning, acao=info). "Regenerar" link at bottom.

- [ ] **Step 3: Create GazetteDetailPanel**

420px slide-in panel. Sections in order:
1. Header: type badge + date + nav arrows (↑↓) + close (✕)
2. Processo: number + tags (tribunal, orgao, grau)
3. Partes: A/R badges with names
4. Prazo Alert (conditional): destructive banner with countdown
5. AI Summary (GazetteAiSummary)
6. Texto: collapsible with gradient fade + "Expandir" toggle
7. Expediente Link (conditional): clickable card with green dot
8. Process Timeline (GazetteTimeline with other publications of same processo)
9. Actions: Ver Certidao PDF, Abrir no PJE, Ver Expediente

Mobile (<768px): renders as Sheet (fullscreen bottom drawer) using `useIsMobile()`.
Uses `useGazetteStore().comunicacaoSelecionada` and `detailPanelAberto`.

- [ ] **Step 4: Commit**

```bash
git add src/app/(authenticated)/captura/components/comunica-cnj/gazette-timeline.tsx \
        src/app/(authenticated)/captura/components/comunica-cnj/gazette-ai-summary.tsx \
        src/app/(authenticated)/captura/components/comunica-cnj/gazette-detail-panel.tsx
git commit -m "feat(comunica-cnj): add GazetteDetailPanel with timeline, AI summary, and responsive sheet"
```

---

### Task 12: Main Page Orchestrator

**Files:**
- Create: `src/app/(authenticated)/captura/components/comunica-cnj/gazette-page.tsx`
- Modify: `src/app/(authenticated)/captura/components/comunica-cnj/tabs-content.tsx`
- Modify: `src/app/(authenticated)/captura/components/comunica-cnj/index.ts`

- [ ] **Step 1: Create GazettePage orchestrator**

This is the main component that composes all pieces:

```typescript
'use client';

import { useEffect } from 'react';
import { useGazetteStore } from './hooks/use-gazette-store';
import { GazetteAlertBanner } from './gazette-alert-banner';
import { GazetteAiInsights } from './gazette-ai-insights';
import { GazetteKpiStrip } from './gazette-kpi-strip';
import { GazetteViewTabs } from './gazette-view-tabs';
import { GazetteFilterBar } from './gazette-filter-bar';
import { GazetteFilterChips } from './gazette-filter-chips';
import { GazetteDataTable } from './gazette-data-table';
import { GazetteCardGrid } from './gazette-card-grid';
import { GazetteDetailPanel } from './gazette-detail-panel';
import { GazetteOrphanResolver } from './gazette-orphan-resolver';
import {
  actionObterMetricas,
  actionListarComunicacoesCapturadas,
  actionListarViews,
} from '@/app/(authenticated)/captura/actions/comunica-cnj-actions';

interface GazettePageProps {
  currentUserId: number;
}

export function GazettePage({ currentUserId }: GazettePageProps) {
  const {
    metricas,
    viewAtiva,
    modoVisualizacao,
    comunicacoes,
    detailPanelAberto,
    isLoading,
    setMetricas,
    setComunicacoes,
    setViews,
    setIsLoading,
  } = useGazetteStore();

  // Fetch initial data
  useEffect(() => {
    async function load() {
      setIsLoading(true);
      const [metricasRes, comunicacoesRes, viewsRes] = await Promise.all([
        actionObterMetricas(),
        actionListarComunicacoesCapturadas({ pagina: 1, itensPorPagina: 50 }),
        actionListarViews(),
      ]);
      if (metricasRes.success && metricasRes.data) setMetricas(metricasRes.data);
      if (comunicacoesRes.success && comunicacoesRes.data) {
        setComunicacoes(comunicacoesRes.data.items ?? []);
      }
      if (viewsRes.success && viewsRes.data) setViews(viewsRes.data);
      setIsLoading(false);
    }
    load();
  }, []);

  const isOrphanView = viewAtiva === 'orfaos';

  return (
    <div className="flex flex-col h-[calc(100vh-7.5rem)]">
      {/* Alert Banner */}
      {metricas && metricas.prazosCriticos > 0 && (
        <GazetteAlertBanner
          count={metricas.prazosCriticos}
          descricao="Intimacoes com prazo critico"
          onVerPrazos={() => useGazetteStore.getState().setViewAtiva('prazos')}
        />
      )}

      {/* AI Insights */}
      {!isOrphanView && <GazetteAiInsights />}

      {/* KPI Strip */}
      {!isOrphanView && <GazetteKpiStrip />}

      {/* View Tabs + Filter Bar */}
      {!isOrphanView && (
        <>
          <GazetteViewTabs />
          <GazetteFilterBar />
          <GazetteFilterChips />
        </>
      )}

      {/* Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {isOrphanView ? (
          <GazetteOrphanResolver />
        ) : (
          <>
            {modoVisualizacao === 'tabela' ? (
              <GazetteDataTable />
            ) : (
              <GazetteCardGrid />
            )}
            {detailPanelAberto && <GazetteDetailPanel />}
          </>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Replace tabs-content.tsx to use GazettePage**

Replace the content of `tabs-content.tsx`:

```typescript
'use client';

import { Suspense } from 'react';
import { GazettePage } from './gazette-page';
import { Skeleton } from '@/components/ui/skeleton';

interface ComunicaCNJTabsContentProps {
  currentUserId: number;
}

export function ComunicaCNJTabsContent({ currentUserId }: ComunicaCNJTabsContentProps) {
  return (
    <Suspense fallback={<GazettePageSkeleton />}>
      <GazettePage currentUserId={currentUserId} />
    </Suspense>
  );
}

function GazettePageSkeleton() {
  return (
    <div className="flex flex-col gap-3 p-6">
      <div className="grid grid-cols-5 gap-2.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-10 rounded-lg" />
      <Skeleton className="h-8 rounded-lg w-1/2" />
      <div className="flex-1 space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-12 rounded-lg" />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Update barrel exports in index.ts**

Update `src/app/(authenticated)/captura/components/comunica-cnj/index.ts`:

```typescript
// Legacy exports (kept for backwards compatibility during migration)
export { ComunicaCNJResultsTable } from './results-table';
export { ComunicaCNJSearchForm } from './search-form';
export { ComunicacaoDetalhesDialog } from './detalhes-dialog';
export { PdfViewerDialog } from './pdf-viewer-dialog';

// Gazette Fusion exports
export { ComunicaCNJTabsContent } from './tabs-content';
export { GazettePage } from './gazette-page';
export { GazetteKpiStrip } from './gazette-kpi-strip';
export { GazetteKpiCard } from './gazette-kpi-card';
export { GazetteDataTable } from './gazette-data-table';
export { GazetteCardGrid } from './gazette-card-grid';
export { GazetteDetailPanel } from './gazette-detail-panel';
export { GazetteFilterBar } from './gazette-filter-bar';
export { GazetteFilterChips } from './gazette-filter-chips';
export { GazetteViewTabs } from './gazette-view-tabs';
export { GazetteAlertBanner } from './gazette-alert-banner';
export { GazetteAiInsights } from './gazette-ai-insights';
export { GazetteAiSummary } from './gazette-ai-summary';
export { GazetteTimeline } from './gazette-timeline';
```

- [ ] **Step 4: Update page.tsx to pass currentUserId**

Modify `src/app/(authenticated)/comunica-cnj/page.tsx` to fetch the current user and pass `currentUserId` to `ComunicaCNJTabsContent`.

- [ ] **Step 5: Verify the page compiles and renders**

Run: `npm run type-check && npm run dev`
Navigate to `/comunica-cnj` — should show the new layout skeleton.

- [ ] **Step 6: Commit**

```bash
git add src/app/(authenticated)/captura/components/comunica-cnj/gazette-page.tsx \
        src/app/(authenticated)/captura/components/comunica-cnj/tabs-content.tsx \
        src/app/(authenticated)/captura/components/comunica-cnj/index.ts \
        src/app/(authenticated)/comunica-cnj/page.tsx
git commit -m "feat(comunica-cnj): wire up GazettePage as main orchestrator replacing old tabs"
```

---

## Phase 4: Orphan Resolution

### Task 13: Orphan Resolver Component

**Files:**
- Create: `src/app/(authenticated)/captura/components/comunica-cnj/gazette-orphan-resolver.tsx`

- [ ] **Step 1: Create the split-panel resolver**

Full-height component with:
- Header: title + badge count + progress bar + "Aceitar Alta Confianca (N)" batch button
- Navigation: Previous/Next buttons + counter + keyboard hint
- Split panels: left (publication with highlighted matches) + right (suggested expediente with confidence score + criteria checklist + 4 action buttons)
- Empty state when no orphans remain ("Tudo resolvido!")

Uses existing `findExpedienteCorrespondente()` from repository for match suggestions. Adds confidence score calculation based on: processo match (+40), parte match (+25), vara match (+15), date match (+10), tribunal match (+10).

- [ ] **Step 2: Add toast feedback with undo**

Use `sonner` toast for each vinculation action with 10s undo window. Batch accept shows summary toast.

- [ ] **Step 3: Commit**

```bash
git add src/app/(authenticated)/captura/components/comunica-cnj/gazette-orphan-resolver.tsx
git commit -m "feat(comunica-cnj): add GazetteOrphanResolver with split-panel and confidence scores"
```

---

## Phase 5: AI Features

### Task 14: AI Summary Generation

**Files:**
- Modify: `src/app/(authenticated)/captura/comunica-cnj/service.ts`

- [ ] **Step 1: Add resumo generation to service**

Add a `gerarResumoComunicacao(comunicacaoId)` function that:
1. Fetches the communication text
2. Calls `gerarResumoTranscricao()` from `@/lib/ai/summarization` (adapted for legal text)
3. Extracts tags (prazo regex, valor regex, action type keywords)
4. Saves via `saveResumo()` repository function
5. Returns the `ComunicacaoResumo`

- [ ] **Step 2: Add corresponding action**

Add `actionGerarResumoAI` safe-action that wraps the service function.

- [ ] **Step 3: Commit**

```bash
git add src/app/(authenticated)/captura/comunica-cnj/service.ts \
        src/app/(authenticated)/captura/comunica-cnj/actions.ts
git commit -m "feat(comunica-cnj): add AI summary generation for communications"
```

---

### Task 15: NLP Search Bar

**Files:**
- Create: `src/app/(authenticated)/captura/components/comunica-cnj/gazette-search-bar.tsx`

- [ ] **Step 1: Create the NLP search component**

Search bar in the header with:
- `Cmd+K` shortcut to focus (use `useEffect` keydown listener)
- On submit: parse text for operator syntax (`fonte:`, `tipo:`, `prazo:`, etc.)
- If no operators found: call AI to interpret natural language into structured filters
- Show interpretation as editable chips below input
- "Aplicar Filtros", "Editar Filtros", "Salvar como View" buttons
- Operator syntax highlighting using `<span>` styling in a contenteditable or overlay pattern

For the AI interpretation, create a simple client-side parser first (regex-based). The LLM-based NLP can be added as an enhancement later.

- [ ] **Step 2: Commit**

```bash
git add src/app/(authenticated)/captura/components/comunica-cnj/gazette-search-bar.tsx
git commit -m "feat(comunica-cnj): add GazetteSearchBar with operator parsing and NLP interpretation"
```

---

## Phase 6: Polish

### Task 16: Empty States

**Files:**
- Create: `src/app/(authenticated)/captura/components/comunica-cnj/gazette-empty-states.tsx`

- [ ] **Step 1: Create 4 contextual empty states**

Using `EmptyState` from `@/components/shared/empty-state.tsx` as base:

```typescript
'use client';

import { Search, RefreshCw, CheckCircle2, Sun } from 'lucide-react';
import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@/components/ui/button';

export function EmptyNoResults({ onLimpar }: { onLimpar: () => void }) {
  return (
    <EmptyState
      icon={Search}
      title="Nenhuma publicacao encontrada"
      description="Tente ajustar os filtros ou buscar com termos diferentes"
      action={
        <Button variant="outline" size="sm" onClick={onLimpar}>
          Limpar Filtros
        </Button>
      }
    />
  );
}

export function EmptyFirstTime({ onSync }: { onSync: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <EmptyState
        icon={RefreshCw}
        title="Nenhuma publicacao capturada ainda"
        description="Inicie a primeira sincronizacao para buscar publicacoes do Diario Oficial"
        action={
          <Button onClick={onSync} className="bg-primary/15 text-primary border-primary/25">
            Sincronizar Agora
          </Button>
        }
      />
      <div className="flex gap-2 mt-4">
        <div className="p-2.5 bg-surface-container border border-border/20 rounded-lg text-left max-w-[180px] cursor-pointer hover:border-primary/25 transition-colors">
          <p className="text-[10px] text-primary font-medium mb-0.5">Configurar OAB</p>
          <p className="text-[10px] text-muted-foreground/25">Vincule advogados para captura automatica</p>
        </div>
        <div className="p-2.5 bg-surface-container border border-border/20 rounded-lg text-left max-w-[180px] cursor-pointer hover:border-primary/25 transition-colors">
          <p className="text-[10px] text-primary font-medium mb-0.5">Selecionar Tribunais</p>
          <p className="text-[10px] text-muted-foreground/25">Escolha as fontes para monitoramento</p>
        </div>
      </div>
    </div>
  );
}

export function EmptyAllResolved() {
  return (
    <EmptyState
      icon={CheckCircle2}
      title="Tudo resolvido!"
      description="Todas as comunicacoes orfas foram vinculadas ou marcadas como irrelevantes"
    />
  );
}

export function EmptyNoDeadlines() {
  return (
    <EmptyState
      icon={Sun}
      title="Nenhum prazo urgente"
      description="Sem prazos vencendo nas proximas 48 horas. Tudo sob controle."
    />
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/(authenticated)/captura/components/comunica-cnj/gazette-empty-states.tsx
git commit -m "feat(comunica-cnj): add 4 contextual empty states for Gazette Fusion"
```

---

### Task 17: Keyboard Shortcuts

**Files:**
- Create: `src/app/(authenticated)/captura/components/comunica-cnj/hooks/use-gazette-keyboard.ts`
- Create: `src/app/(authenticated)/captura/components/comunica-cnj/gazette-keyboard-help.tsx`

- [ ] **Step 1: Create keyboard shortcuts hook**

```typescript
'use client';

import { useEffect } from 'react';
import { useGazetteStore } from './use-gazette-store';

export function useGazetteKeyboard() {
  const {
    comunicacoes,
    comunicacaoSelecionada,
    detailPanelAberto,
    selecionarComunicacao,
    toggleDetailPanel,
    setModoVisualizacao,
    modoVisualizacao,
  } = useGazetteStore();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't handle when typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key) {
        case '/': {
          e.preventDefault();
          document.querySelector<HTMLInputElement>('[data-gazette-search]')?.focus();
          break;
        }
        case 'Escape': {
          if (detailPanelAberto) toggleDetailPanel(false);
          break;
        }
        case 'ArrowDown': {
          e.preventDefault();
          navigateRow(1);
          break;
        }
        case 'ArrowUp': {
          e.preventDefault();
          navigateRow(-1);
          break;
        }
        case 'Enter': {
          if (comunicacaoSelecionada && !detailPanelAberto) {
            toggleDetailPanel(true);
          }
          break;
        }
        case 't': {
          setModoVisualizacao(modoVisualizacao === 'tabela' ? 'cards' : 'tabela');
          break;
        }
        case '?': {
          // Toggle keyboard help dialog — handled by parent
          document.dispatchEvent(new CustomEvent('gazette:keyboard-help'));
          break;
        }
      }
    }

    function navigateRow(delta: number) {
      if (comunicacoes.length === 0) return;
      const currentIndex = comunicacaoSelecionada
        ? comunicacoes.findIndex((c) => c.id === comunicacaoSelecionada.id)
        : -1;
      const nextIndex = Math.max(0, Math.min(comunicacoes.length - 1, currentIndex + delta));
      selecionarComunicacao(comunicacoes[nextIndex]);
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [comunicacoes, comunicacaoSelecionada, detailPanelAberto, modoVisualizacao]);
}
```

- [ ] **Step 2: Create keyboard help dialog**

Simple dialog triggered by `?` key. Lists all shortcuts in a 2-column grid. Uses `Dialog` from shadcn/ui with `glass-dialog` class.

- [ ] **Step 3: Wire keyboard hook into GazettePage**

Add `useGazetteKeyboard()` call at the top of `GazettePage` component.

- [ ] **Step 4: Commit**

```bash
git add src/app/(authenticated)/captura/components/comunica-cnj/hooks/use-gazette-keyboard.ts \
        src/app/(authenticated)/captura/components/comunica-cnj/gazette-keyboard-help.tsx \
        src/app/(authenticated)/captura/components/comunica-cnj/gazette-page.tsx
git commit -m "feat(comunica-cnj): add keyboard shortcuts (/, arrows, esc, t, ?) with help dialog"
```

---

### Task 18: Sync Dialog + Sync Timeline Popover

**Files:**
- Create: `src/app/(authenticated)/captura/components/comunica-cnj/gazette-sync-dialog.tsx`

- [ ] **Step 1: Create sync dialog**

Dialog triggered by "Sincronizar" button. Contains:
- Advogado selector (OAB combobox — reuse from existing `search-form.tsx` pattern)
- Tribunal multi-select
- Date range picker
- Progress bar during execution
- Results summary on completion (total, novos, duplicados, vinculados, orfaos)

Calls `actionDispararSincronizacaoManualSafe` and logs result via `actionRegistrarSincronizacao`.

Sync timeline as a `Popover` showing last 10 sync logs via `GazetteTimeline`.

- [ ] **Step 2: Commit**

```bash
git add src/app/(authenticated)/captura/components/comunica-cnj/gazette-sync-dialog.tsx
git commit -m "feat(comunica-cnj): add GazetteSyncDialog with progress and timeline popover"
```

---

### Task 19: PDF Viewer Redesign

**Files:**
- Modify: `src/app/(authenticated)/captura/components/comunica-cnj/pdf-viewer-dialog.tsx`

- [ ] **Step 1: Redesign PDF viewer with split-view**

Update the existing `PdfViewerDialog` to add:
- Left panel (280px): metadata (processo, tipo, tribunal, data, meio, expediente link)
- Right panel: PDF rendered via existing iframe pattern (keep working approach, enhance later with react-pdf)
- PDF toolbar: zoom +/-, page navigation, fullscreen toggle
- Mobile: metadata collapses to a top summary, PDF takes full width

- [ ] **Step 2: Commit**

```bash
git add src/app/(authenticated)/captura/components/comunica-cnj/pdf-viewer-dialog.tsx
git commit -m "feat(comunica-cnj): redesign PDF viewer with split-view metadata panel"
```

---

### Task 20: Create View Dialog + Column Config

**Files:**
- Create: `src/app/(authenticated)/captura/components/comunica-cnj/gazette-create-view-dialog.tsx`
- Create: `src/app/(authenticated)/captura/components/comunica-cnj/gazette-column-config.tsx`

- [ ] **Step 1: Create view dialog**

Dialog for saving current filter state as a named view. Fields: nome (text), icone (emoji picker grid), filtros (shown as chips), visibilidade (pessoal/equipe toggle). Calls `actionSalvarViewSafe`.

- [ ] **Step 2: Create column config popover**

Popover triggered by "Colunas" button. Lists all table columns with toggle switches. Persisted in the view state. Uses `Switch` from shadcn/ui.

- [ ] **Step 3: Commit**

```bash
git add src/app/(authenticated)/captura/components/comunica-cnj/gazette-create-view-dialog.tsx \
        src/app/(authenticated)/captura/components/comunica-cnj/gazette-column-config.tsx
git commit -m "feat(comunica-cnj): add CreateViewDialog and ColumnConfig popover"
```

---

### Task 21: Final Integration + Cleanup

**Files:**
- Modify: `src/app/(authenticated)/captura/components/comunica-cnj/gazette-page.tsx`
- Delete (or deprecate): `consulta.tsx`, `capturadas.tsx`, `search-form.tsx`
- Modify: `src/app/(authenticated)/captura/index.ts`

- [ ] **Step 1: Wire all remaining components into GazettePage**

Ensure all components are connected: search bar in header, sync dialog trigger, keyboard help, empty states for each view context.

- [ ] **Step 2: Remove old components**

Delete `consulta.tsx`, `capturadas.tsx`, `search-form.tsx`. Update barrel exports. Keep `results-table.tsx` temporarily if referenced elsewhere.

- [ ] **Step 3: Run full type-check and fix any issues**

Run: `npm run type-check`
Fix any remaining compilation errors.

- [ ] **Step 4: Run existing tests**

Run: `npm test -- --testPathPattern=comunica-cnj`
Fix any broken tests due to component renames.

- [ ] **Step 5: Visual review**

Run: `npm run dev`
Navigate to `/comunica-cnj` and verify:
- KPIs render with correct data
- Filters work (click KPI, use filter bar, remove chips)
- Table rows are clickable, detail panel slides in
- Card mode toggle works
- Orphan view accessible via tab
- Empty states show correctly
- Keyboard shortcuts work
- PDF viewer opens with metadata
- Responsive: resize to tablet/mobile sizes

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "feat(comunica-cnj): complete Gazette Fusion redesign with all components wired"
```

---

## Summary

| Phase | Tasks | New Files | Description |
|-------|-------|-----------|-------------|
| 1: Foundation | 1-4 | 3 migrations, types, repo, actions | DB + types + server layer |
| 2: Architecture | 5-8 | Store, KPIs, alert, insights, tabs, filters, chips | Page structure + state |
| 3: Data Views | 9-12 | Table, cards, detail panel, timeline, AI summary, orchestrator | Main content area |
| 4: Orphans | 13 | Orphan resolver | Split-panel resolution |
| 5: AI | 14-15 | AI service, search bar | Intelligence layer |
| 6: Polish | 16-21 | Empty states, keyboard, sync, PDF, views, column config | Final UX polish |

**Total: 21 tasks, ~25 new files, 3 database migrations, 6 phases.**
