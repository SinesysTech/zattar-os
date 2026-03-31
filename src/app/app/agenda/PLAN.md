# Plano de Implementacao — Modulo Agenda

> Aprovado em 2026-03-31. Mock de referencia: `/app/agenda/mock`

---

## Visao Geral

**Estado atual:** Calendario em `/app/calendar` com 4 views (month/week/day/agenda), CRUD de eventos, drag-drop, 5 fontes de eventos, filtros, busca.

**Estado alvo:** Novo modulo `/app/agenda` com design Glass Briefing, 5 views (Month/Week/Day/Lista/Briefing), toolbar redesenhada, CommandHeader com stats + week pulse, view Briefing com timeline inteligente + sidebar (prep radar, alertas, acoes rapidas).

**Decisao arquitetural chave:** Reusar os componentes internos de Month/Week/Day (que ja tem drag-drop e calculo de sobreposicao de eventos) e envolver com o novo styling. Apenas Toolbar, CommandHeader, Briefing view e EventDetailDialog sao completamente novos.

---

## Phase 0: Foundation — Domain e Types (2-3h)

### 0.1 Criar `briefing-domain.ts`
- **Arquivo:** `src/features/calendar/briefing-domain.ts`
- **O que:** Tipos para PrepStatus, BriefingEventMetadata, DaySummary, WeekPulseDay, CalendarView (5 opcoes), SOURCE_CONFIG, COLOR_MAP
- **Complexidade:** LOW

### 0.2 Criar `briefing-helpers.ts`
- **Arquivo:** `src/features/calendar/briefing-helpers.ts`
- **O que:** Portar funcoes puras do mock `data.ts` para trabalhar com `UnifiedCalendarEvent`:
  - `generateWeekPulse(events, baseDate)` -> `WeekPulseDay[]`
  - `getDaySummary(events, date)` -> `DaySummary`
  - `getEventsForDay(events, date)` -> filtered
  - `getTimedEvents(events)` / `getAllDayEvents(events)`
  - `buildBriefingText(events, date)` -> string (narrativa do briefing)
- **Complexidade:** LOW

---

## Phase 1: Backend — Capacidades Novas (4-6h)

### 1.1 Enriquecer audiencia events com prep data e modalidade
- **Arquivo:** `src/features/calendar/service.ts` (modificar `audienciaToUnifiedEvent`)
- **O que:**
  - Incluir `modalidade` (ja disponivel no tipo `Audiencia`)
  - Incluir `enderecoPresencial`, `urlAudienciaVirtual`
  - PrepStatus MVP: heuristica baseada em dados existentes
    - tem `ataAudienciaId` + `observacoes` = "preparado"
    - tem algum = "parcial"
    - nada = "pendente"
  - (Futuro: tabela `audiencia_prep` para tracking real de documentos/testemunhas)
- **Complexidade:** MEDIUM
- **Depende de:** Phase 0

### 1.2 Criar server action de briefing
- **Arquivo:** `src/features/calendar/actions/briefing-actions.ts`
- **O que:** `actionListarBriefingData({ date })` retorna `{ events, summary, weekPulse }`
- **Complexidade:** LOW
- **Depende de:** 0.2, 1.1

### 1.3 Travel time estimation
- **Arquivo:** `src/features/calendar/travel-helpers.ts`
- **O que:** Funcao pura que estima tempo de deslocamento entre 2 eventos presenciais
  - Mesma cidade: 20min
  - Cidades diferentes: 60min (default)
  - Sem endereco: null
- **Complexidade:** LOW

---

## Phase 2: Design System Components — Primitivas (4-6h)

### 2.1 Verificar GlassPanel
- **Arquivo:** `src/app/app/dashboard/mock/widgets/primitives.tsx`
- **O que:** Ja existe e e importado de la. Nenhuma mudanca necessaria.
- **Complexidade:** NONE

### 2.2 Criar componentes primitivos da agenda
- **Diretorio:** `src/app/app/agenda/components/primitives/`
- **Arquivos:**
  - `event-chip.tsx` — Display compacto de evento (month/week/day cells)
  - `briefing-event-card.tsx` — Card rico da timeline do Briefing
  - `phase-label.tsx` — Separador "Manha"/"Tarde"
  - `focus-slot.tsx` — Janela de foco
  - `travel-slot.tsx` — Indicador de deslocamento
  - `break-slot.tsx` — Indicador de intervalo
  - `now-line.tsx` — Linha de tempo atual (purple pulse)
  - `prep-radar-item.tsx` — Card de status de preparacao
  - `alert-card.tsx` — Card de alerta
  - `color-map.ts` — COLOR_MAP + SOURCE_CONFIG constants
- **O que:** Extrair do mock, aceitar `UnifiedCalendarEvent` (adaptado)
- **Complexidade:** MEDIUM
- **Independente** (pode ser feito em paralelo com Phase 1)

---

## Phase 3: Frontend — Modulo Agenda Novo (12-16h)

### 3.1 Criar adapter layer
- **Arquivo:** `src/app/app/agenda/lib/adapters.ts`
- **O que:** `adaptToBriefingEvent(e: UnifiedCalendarEvent)` que extrai prepStatus, modalidade, processo, trt do campo `metadata`
- **Complexidade:** LOW
- **Depende de:** Phase 0

### 3.2 Criar Toolbar
- **Arquivo:** `src/app/app/agenda/components/toolbar.tsx`
- **O que:** Search + filtro por fonte (5 fontes) + view switcher (5 views) + date nav + "Novo evento"
- **Usar:** shadcn/ui Popover, Input, FilterPopoverMulti existente
- **Complexidade:** MEDIUM
- **Depende de:** 2.2 (color-map)

### 3.3 Criar CommandHeader
- **Arquivo:** `src/app/app/agenda/components/command-header.tsx`
- **O que:** Stats row (eventos, audiencias, ocupado, foco, alertas) + Week Pulse bars
- **Complexidade:** MEDIUM
- **Depende de:** 0.2 (helpers)

### 3.4 Criar view components
- `src/app/app/agenda/components/views/month-view.tsx`
  - **Estrategia:** Wrapper do componente existente `calendar/components/month-view.tsx` com Glass Briefing styling, OU portar do mock. Manter drag-drop.
- `src/app/app/agenda/components/views/week-view.tsx`
  - **Estrategia:** Wrapper do existente. Manter drag-drop + current time indicator.
- `src/app/app/agenda/components/views/day-view.tsx`
  - **Estrategia:** Wrapper do existente. Manter drag-drop.
- `src/app/app/agenda/components/views/agenda-list-view.tsx`
  - **Estrategia:** Portar do mock (novo design, sem drag-drop).
- `src/app/app/agenda/components/views/briefing-view.tsx`
  - **Estrategia:** Totalmente novo. Timeline + sidebar (prep radar, alertas, acoes rapidas).
- **Complexidade:** MEDIUM cada (HIGH para briefing)
- **Depende de:** 2.2, 3.1

### 3.5 Criar EventDetailDialog
- **Arquivo:** `src/app/app/agenda/components/event-detail-dialog.tsx`
- **O que:** Dialog usando shadcn/ui Dialog. Modo editar (agenda events) vs. read-only (outros). Wired com actions reais.
- **Complexidade:** MEDIUM
- **Depende de:** 3.1

### 3.6 Criar orchestrator (AgendaApp)
- **Arquivo:** `src/app/app/agenda/components/agenda-app.tsx`
- **O que:** Client component principal. Gerencia:
  - State: currentDate, view, search, sourceFilter, selectedEvent
  - Data fetching: reusa `actionListarEventosCalendar` com range-based fetch
  - Renderiza: Toolbar + CommandHeader + active view + EventDetailDialog
- **Complexidade:** HIGH
- **Depende de:** 3.2, 3.3, 3.4, 3.5

### 3.7 Criar server page
- **Arquivo:** `src/app/app/agenda/page.tsx`
- **O que:** Server component. Fetch initial 3-month window. Passa para AgendaApp.
- **Complexidade:** LOW
- **Depende de:** 3.6

---

## Phase 4: Migracao e Routing (1-2h)

### 4.1 Atualizar navegacao
- **Arquivos:**
  - `src/components/layout/sidebar/app-sidebar.tsx` — url `/app/calendar` -> `/app/agenda`
  - `src/components/layout/dock/app-dock.tsx` — url `/app/calendar` -> `/app/agenda`
- **Complexidade:** LOW

### 4.2 Redirect da rota antiga
- **Arquivo:** `src/app/app/calendar/page.tsx` — substituir por `redirect("/app/agenda")`
- **Complexidade:** LOW

### 4.3 Limpar mock
- Deletar `src/app/app/agenda/mock/` (ou manter como referencia)
- **Complexidade:** LOW

---

## Phase 5: Suite de Testes (8-10h)

### 5.1 Testes unitarios — domain e helpers
- **Arquivo:** `src/features/calendar/__tests__/unit/briefing-helpers.test.ts`
  - `generateWeekPulse` com varias distribuicoes de eventos
  - `getDaySummary` com diferentes tipos de evento
  - `buildBriefingText` para selecao de saudacao, calculo de intensidade
  - Edge cases: sem eventos, all-day, eventos cruzando meia-noite
- **Arquivo:** `src/features/calendar/__tests__/unit/travel-helpers.test.ts`
  - Estimativa mesma cidade
  - Estimativa cidades diferentes
  - Dados de endereco faltando

### 5.2 Testes unitarios — adapter layer
- **Arquivo:** `src/app/app/agenda/__tests__/unit/adapters.test.ts`
  - `adaptToBriefingEvent` para cada tipo de fonte
  - Extracao de prepStatus do metadata
  - Extracao de modalidade

### 5.3 Testes unitarios — componentes de view
- `src/app/app/agenda/__tests__/unit/toolbar.test.tsx`
  - Search input filtering callback
  - Source filter toggle
  - View switcher navigation
  - Date navigation (prev/next/today)
- `src/app/app/agenda/__tests__/unit/command-header.test.tsx`
  - Calculo de stats
  - Renderizacao do week pulse
- `src/app/app/agenda/__tests__/unit/briefing-view.test.tsx`
  - Geracao do texto do briefing (manha/tarde/noite)
  - Display do prep radar
  - Display de alertas
  - Focus windows
  - Travel indicators entre eventos presenciais
- `src/app/app/agenda/__tests__/unit/event-detail-dialog.test.tsx`
  - Modo read-only para eventos nao-agenda
  - Modo editavel para eventos agenda
  - Confirmacao de delete

### 5.4 Testes de integracao
- `src/app/app/agenda/__tests__/integration/agenda-crud.test.ts`
  - Fluxo criar evento: abrir dialog -> preencher -> salvar -> refetch
  - Fluxo atualizar evento
  - Fluxo deletar evento
- `src/app/app/agenda/__tests__/integration/view-switching.test.tsx`
  - Trocar entre 5 views
  - Eventos persistem entre trocas de view
  - Navegacao de data funciona por tipo de view
- `src/features/calendar/__tests__/integration/briefing-data.test.ts`
  - `actionListarBriefingData` com repository mockado
  - Metadata enriquecido para audiencias

---

## Grafo de Dependencias

```
Phase 0 (Domain) ──────────────────────────┐
                                            │
Phase 1 (Backend) ── depende de Phase 0 ───┤
                                            │
Phase 2 (Design) ── independente ──────────┤
                                            │
Phase 3 (Frontend) ── depende de 0, 1, 2 ──┤
                                            │
Phase 4 (Migracao) ── depende de Phase 3 ──┤
                                            │
Phase 5 (Testes) ── comeca na Phase 0 ─────┘
                     (cresce com cada phase)
```

**Caminho critico:** Phase 0 -> 1.1 -> 3.6 -> 4

**Paralelizavel:**
- Phase 2 em paralelo com Phase 1
- Testes unitarios escritos junto com cada phase
- Views Month/Week/Day (3.4) em paralelo com trabalho Briefing-specific

---

## Resumo de Esforco

| Phase | Steps | Complexidade | Estimativa |
|-------|-------|-------------|------------|
| 0 - Domain | 2 | LOW | 2-3h |
| 1 - Backend | 3 | LOW-MEDIUM | 4-6h |
| 2 - Design Components | 2 | MEDIUM | 4-6h |
| 3 - Frontend | 7 | HIGH | 12-16h |
| 4 - Migracao | 3 | LOW | 1-2h |
| 5 - Testes | 4 | MEDIUM | 8-10h |
| **Total** | **21 steps** | | **31-43h** |

---

## Mitigacao de Riscos

1. **Drag-drop:** Reusar componentes internos existentes de Month/Week/Day preserva funcionalidade sem reimplementacao.
2. **Shape de dados:** Campo `metadata` em `UnifiedCalendarEvent` e `Record<string, unknown>`, enriquecer e backward-compatible.
3. **Transicao de rota:** Redirect em `/app/calendar` garante links antigos continuam funcionando.
4. **Performance:** Briefing view computa `getDaySummary` e `generateWeekPulse` client-side dos eventos ja buscados. Sem chamadas API adicionais.
5. **Entrega incremental:** Mock permanece acessivel durante desenvolvimento. Nova `/app/agenda/page.tsx` pode ser desenvolvida e testada sem afetar `/app/calendar` ate Phase 4.

---

## Arquivos Criticos

### Criar (novos)
- `src/features/calendar/briefing-domain.ts`
- `src/features/calendar/briefing-helpers.ts`
- `src/features/calendar/travel-helpers.ts`
- `src/features/calendar/actions/briefing-actions.ts`
- `src/app/app/agenda/components/primitives/` (10 arquivos)
- `src/app/app/agenda/lib/adapters.ts`
- `src/app/app/agenda/components/toolbar.tsx`
- `src/app/app/agenda/components/command-header.tsx`
- `src/app/app/agenda/components/views/` (5 arquivos)
- `src/app/app/agenda/components/event-detail-dialog.tsx`
- `src/app/app/agenda/components/agenda-app.tsx`
- `src/app/app/agenda/page.tsx`

### Modificar (existentes)
- `src/features/calendar/service.ts` (enriquecer audienciaToUnifiedEvent)
- `src/components/layout/sidebar/app-sidebar.tsx` (url)
- `src/components/layout/dock/app-dock.tsx` (url)
- `src/app/app/calendar/page.tsx` (redirect)

### Deletar (apos migracao)
- `src/app/app/agenda/mock/` (opcional, manter como referencia)
