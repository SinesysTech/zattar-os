# Plano de Redesign — Módulo de Expedientes

> **Visão**: Transformar o módulo de expedientes de uma ferramenta de consulta em um **Centro de Comando Operacional** — onde o advogado não busca informação, a informação busca o advogado.

---

## 1. Diagnóstico do Estado Atual

### O que funciona

| View       | Padrão                      | Funcional?                            |
| ---------- | --------------------------- | ------------------------------------- |
| **Quadro** | KPI Cards + Queue + Sidebar | Sim, mas falta profundidade analítica |
| **Lista**  | DataShell + Filters + Bulk  | Operacional, padrão consolidado       |
| **Semana** | WeekNavigator + Tabela      | Funcional, mas sem contexto temporal  |
| **Mês**    | Calendar grid + Day list    | Master-detail bom, falta densidade    |
| **Ano**    | 12-month grid               | Muito raso — só marca/não marca       |

### Problemas Identificados

1. **Quadro** — KPI cards são estáticos (sem trend, sem delta, sem comparação). Sidebar com dados que não geram ação. Fila mistura triagem com visualização.
2. **Semana** — É uma tabela com filtro de data. Não evoca temporalidade; não mostra fluxo do dia.
3. **Mês** — Calendar cells são pontos sem informação. O painel de dia é flat (lista simples de cards).
4. **Ano** — Não mostra intensidade, apenas presença/ausência. Sem utilidade analítica real.
5. **Nenhuma view** tem: risk scoring, burn rate, workload prediction, SLA tracking, temporal pulse.

### Gap vs Outros Módulos

| Recurso                  | Audiências             | Processos                | Expedientes               |
| ------------------------ | ---------------------- | ------------------------ | ------------------------- |
| KPI com trend/sparkline  | ✅ MissionKpiStrip     | ✅ PulseStrip            | ❌ Cards estáticos        |
| Timeline com now marker  | ✅ Mission timeline    | ✅ PulseTimeline         | ❌ Inexistente            |
| Prep/health scoring      | ✅ PrepScore ring      | ✅ SaúdeProcessual gauge | ❌ Inexistente            |
| InsightBanner contextual | ✅ Conflitos + preparo | ✅ Sem responsável       | ⚠️ Básico (só vencidos)   |
| Heatmap de atividade     | —                      | ✅ CalendarHeatmap       | ❌ Inexistente            |
| Post-action flow         | ✅ PostHearingFlow     | —                        | ❌ Inexistente            |
| Aging funnel             | —                      | —                        | ⚠️ Só no dashboard widget |

---

## 2. Visão Disruptiva

### Metáfora: "Mesa de Operações do Escritório"

O módulo de expedientes é o **nerve center** do escritório. Todo advogado começa o dia aqui. O redesign transforma cada view em uma **estação de trabalho** com propósito claro:

| View       | Nova Metáfora            | Propósito                                                       |
| ---------- | ------------------------ | --------------------------------------------------------------- |
| **Quadro** | **Sala de Situação**     | Triagem de risco em tempo real com scoring preditivo            |
| **Lista**  | **Mesa de Trabalho**     | CRUD operacional com bulk ops (mantém, mas com upgrade visual)  |
| **Semana** | **Briefing Diário**      | Timeline vertical estilo "Missão" com blocos de urgência do dia |
| **Mês**    | **Mapa de Calor Mensal** | Heatmap de intensidade com drill-down por dia                   |
| **Ano**    | **Radar Estratégico**    | GitHub-style heatmap + seasonality patterns + workload forecast |

---

## 3. Design por View

### 3.1 QUADRO — Sala de Situação (Redesign Completo)

**Conceito**: Dashboard operacional que **prioriza a ação** sobre a informação passiva.

#### Layout (Desktop)

```
┌───────────────────────────────────────────────────────────────────────┐
│ "Sala de Situação"                          [ViewMode] [⚙️ Settings] │
│ "Estado operacional do acervo em tempo real"                         │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌─ PULSE STRIP ──────────────────────────────────────────────────┐  │
│  │ 🔴 12 Vencidos   🟠 5 Hoje   🔵 8 Próx 3d   ⚪ 4 Sem dono    │  │
│  │   ▓▓▓▓▓░░░░░░    ▓▓░░░░░░    ▓▓▓░░░░░░░     ▓▓░░░░░░░░░░    │  │
│  │   +3 vs semana    -2 vs sem   estável         +1 vs semana    │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  ┌─ INSIGHT BANNERS (contextual, max 2) ─────────────────────────┐  │
│  │ ⚠️ 12 expedientes vencidos — sprint de recuperação sugerido   │  │
│  │ 💡 João Silva concentra 34% da carga — considere redistribuir │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  ┌─ MAIN (2/3) ──────────────────────┬─ SIDEBAR (1/3) ───────────┐  │
│  │                                    │                            │  │
│  │  [TabPills: Fila de queues]       │  ┌─ RISK SCORE ──────────┐│  │
│  │  [Search] [View: Cards|Lista]     │  │                        ││  │
│  │                                    │  │  [GaugeMeter: 72/100] ││  │
│  │  ┌─ QUEUE ITEMS ──────────────┐   │  │  "Saúde operacional"  ││  │
│  │  │ ▎🔴 Intimação - Despacho   │   │  │  Sem alertas críticos ││  │
│  │  │ ▎   0001234-56.2024.5.01   │   │  │                        ││  │
│  │  │ ▎   TRT1 · 1º Grau · João  │   │  └────────────────────────┘│  │
│  │  │ ▎   12/03 · 5d vencido     │   │                            │  │
│  │  ├────────────────────────────┤   │  ┌─ AGING FUNNEL ────────┐│  │
│  │  │ ▎🟠 Citação               │   │  │ Vencidos    ▓▓▓▓▓▓ 12 ││  │
│  │  │ ▎   0007890-12.2024.5.02   │   │  │ Hoje        ▓▓▓░░ 5  ││  │
│  │  │ ▎   TRT2 · 1º Grau         │   │  │ 3 dias      ▓▓▓▓ 8  ││  │
│  │  │ ▎   07/04 · Vence hoje     │   │  │ 7 dias      ▓▓░░ 4  ││  │
│  │  ├────────────────────────────┤   │  │ 15+ dias    ▓░░░ 3  ││  │
│  │  │ ...                        │   │  └────────────────────────┘│  │
│  │  └────────────────────────────┘   │                            │  │
│  │                                    │  ┌─ WORKLOAD ────────────┐│  │
│  │                                    │  │ João     ▓▓▓▓▓▓ 18   ││  │
│  │                                    │  │ Maria    ▓▓▓▓░░ 12   ││  │
│  │                                    │  │ Pedro    ▓▓░░░░  7   ││  │
│  │                                    │  │ Sem dono ▓░░░░░  4   ││  │
│  │                                    │  └────────────────────────┘│  │
│  │                                    │                            │  │
│  │                                    │  ┌─ HEATMAP ─────────────┐│  │
│  │                                    │  │ Atividade 30 dias     ││  │
│  │                                    │  │ [░▒▓▓░░▒▓████▓▒░░░]  ││  │
│  │                                    │  │ 142 baixas no período ││  │
│  │                                    │  └────────────────────────┘│  │
│  └────────────────────────────────────┴────────────────────────────┘  │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

#### Novos Componentes

**A. ExpedientesPulseStrip** (substitui os 5 ControlMetricCards)

- Layout: `grid grid-cols-2 lg:grid-cols-4` com GlassPanel depth=2
- Cada card: ícone + label + AnimatedNumber + delta vs semana anterior + barra proporcional
- Cores semânticas: destructive (vencidos), warning (hoje), primary (próximos), muted (sem dono)
- Sparkline de 7 dias embutido no canto inferior de cada KPI

**B. RiskScoreGauge** (novo — sidebar)

- GaugeMeter semicircular (0–100)
- Score composto: `(100 - %vencidos*2) * 0.4 + (%comResponsavel) * 0.3 + (%comTipo) * 0.3`
- Status: good (≥70), warning (40–69), danger (<40)
- Label dinâmico contextual ("Operação saudável" / "Atenção necessária" / "Estado crítico")

**C. AgingFunnel** (novo — sidebar)

- Barras horizontais empilhadas: Vencidos → Hoje → 3 dias → 7 dias → 15+ dias
- Largura proporcional ao total
- Labels com contagem + porcentagem
- Clicável: filtra a fila principal ao clicar numa faixa

**D. ActivityHeatmap** (novo — sidebar)

- GitHub-style 5×7 grid dos últimos 30 dias
- Intensidade = baixas realizadas naquele dia
- Hover: tooltip com data + contagem
- Footer: total de baixas no período + média diária

**E. InsightBanners inteligentes** (upgrade)

- Até 2 banners simultâneos, priorizados por severity
- Tipos expandidos:
  - `alert`: "X expedientes vencidos" (destructive)
  - `warning`: "Concentração de carga em Y" (warning)
  - `info`: "Z expedientes sem tipo — classificação automática disponível" (info)
  - `success`: "Semana sem vencimentos pendentes — parabéns!" (success)
- Cada banner pode ter call-to-action (botão que filtra a fila)

#### Upgrades na Fila

- **Queue items** com micro-progress: se o expediente tem observações/arquivo, mostrar ícones de completude
- **Drag-to-assign**: arrastar expediente para a barra de workload para atribuir responsável (futuro)
- **Quick actions no hover**: ícones de "baixar", "atribuir", "ver processo" aparecem ao passar o mouse
- **Batch select**: checkbox sutil na borda esquerda para seleção em massa

---

### 3.2 SEMANA — Briefing Diário (Redesign Significativo)

**Conceito**: Inspirado no Mission View de Audiências. O advogado abre pela manhã e vê sua "missão do dia" com timeline vertical.

#### Layout

```
┌───────────────────────────────────────────────────────────────────────┐
│ [◀ Semana Anterior]  [Hoje]  [Próxima Semana ▶]    [ViewMode] [⚙️]  │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌─ WEEK STRIP ──────────────────────────────────────────────────┐   │
│  │  Seg 07  Ter 08  [Qua 09]  Qui 10  Sex 11  Sáb 12  Dom 13   │   │
│  │   ·3      ·1     ★·8·★      ·2      ·5       —       —      │   │
│  │  (dots = contagem, estrela = hoje, destaque = selecionado)    │   │
│  └────────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  ┌─ HERO CARD (se dia tem vencidos) ─────────────────────────────┐   │
│  │ 🔴 "3 expedientes vencidos precisam de ação imediata"         │   │
│  │    [Abrir triagem →]                                           │   │
│  └────────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  ┌─ MISSION KPI STRIP (do dia selecionado) ──────────────────────┐   │
│  │  📋 Total: 8    🔴 Vencidos: 3    ✅ Baixados: 2    ⏳ Pend: 3│   │
│  └────────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  ── URGENTES (vencidos + hoje) ──────────────────────────────────     │
│  │ ▎🔴 Intimação    0001234-56...   TRT1 · 1ºG   5d vencido     │   │
│  │ ▎🔴 Citação      0007890-12...   TRT2 · 1ºG   2d vencido     │   │
│  │ ▎🟠 Notificação  0004567-89...   TRT15 · 2ºG  Vence hoje     │   │
│  │                                                                │   │
│  ── NO PRAZO (próximos) ─────────────────────────────────────────     │
│  │ ▎🔵 Despacho     0002345-67...   TRT1 · 1ºG   2d restantes   │   │
│  │ ▎🔵 Mandado      0003456-78...   TRT3 · 1ºG   3d restantes   │   │
│  │                                                                │   │
│  ── SEM PRAZO ───────────────────────────────────────────────────     │
│  │ ▎⚪ Ofício        0005678-90...   TRT5 · 1ºG   Sem prazo      │   │
│  │                                                                │   │
│  ── BAIXADOS HOJE ✅ ────────────────────────────────────────────     │
│  │ ▎✅ Intimação    0006789-01...   TRT1 · 1ºG   Baixado 09:14  │   │
│  │ ▎✅ Citação      0008901-23...   TRT2 · 1ºG   Baixado 11:30  │   │
│  └────────────────────────────────────────────────────────────────┘   │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

#### Novidades

1. **Week Strip com indicadores**: Cada dia mostra contagem de expedientes pendentes como dots/badges. Hoje tem destaque especial (estrela ou anel).

2. **Hero Card contextual**: Se existem vencidos no dia, aparece card de alerta no topo com CTA. Se todos baixados, aparece card de sucesso.

3. **Day Mission KPIs**: 4 mini-KPIs do dia selecionado (total, vencidos, baixados, pendentes) em PulseStrip compacto.

4. **Agrupamento semântico**: Expedientes agrupados por urgência:
   - 🔴 **URGENTES** (vencidos + vence hoje) — fundo sutil destructive
   - 🔵 **NO PRAZO** (1-15 dias) — fundo neutro
   - ⚪ **SEM PRAZO** — fundo muted
   - ✅ **BAIXADOS** — seção colapsável, fundo success sutil

5. **Separadores visuais** entre grupos com label + ícone (estilo Mission View).

---

### 3.3 MÊS — Mapa de Calor Mensal (Upgrade)

**Conceito**: Calendar heatmap onde cada célula mostra **intensidade** (não apenas presença) e drill-down com detail panel.

#### Upgrades

1. **Heatmap cells**: Fundo com opacidade proporcional à quantidade de expedientes:
   - 0 itens: transparente
   - 1-2: `bg-primary/10`
   - 3-5: `bg-primary/25`
   - 6-10: `bg-primary/45`
   - 11+: `bg-primary/70`

2. **Danger overlay**: Se o dia tem vencidos pendentes, borda `border-destructive/40` + dot pulsante.

3. **Micro stats por célula**:

   ```
   ┌─────────┐
   │ 14      │  (número do dia)
   │  🔴2 📋5 │  (vencidos + total, ícones micro)
   └─────────┘
   ```

4. **Detail panel lateral** (em vez de dialog) ao clicar em um dia — usa o layout de sheet existente com a ExpedientesDayList mas com agrupamento por urgência.

5. **Month summary strip** no topo:
   - Total do mês | Baixados | Pendentes | % conclusão | Dias com vencimentos

---

### 3.4 ANO — Radar Estratégico (Redesign Completo)

**Conceito**: Visão de 365 dias estilo GitHub contributions + analytics de seasonality.

#### Layout

```
┌───────────────────────────────────────────────────────────────────────┐
│ "Radar Anual de Expedientes — 2026"        [◀ 2025] [2027 ▶] [⚙️]   │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌─ ANNUAL KPI STRIP ───────────────────────────────────────────┐    │
│  │  📋 Total: 1.847   ✅ Baixados: 1.503   ⏳ Pendentes: 344    │    │
│  │  📊 Taxa: 81.4%    🔴 Vencimentos: 42    ⏱ Tempo Médio: 3.2d│    │
│  └──────────────────────────────────────────────────────────────┘    │
│                                                                       │
│  ┌─ GITHUB-STYLE HEATMAP ──────────────────────────────────────┐    │
│  │  Jan  Fev  Mar  Abr  Mai  Jun  Jul  Ago  Set  Out  Nov  Dez │    │
│  │  ░▒▓▓░ ▒▓▓▓▒ ░▒▓██ ▓▓▓██ ▓████ █████ ░▒▓▓░ ▒▓▓▓▒ ░░▒▒░ ...│    │
│  │  ░▒▓░░ ▒▓▓▒▒ ░▒▓█▓ ▓▓██▓ ▓███▓ ████▓ ░▒▓░░ ▒▓▓░░ ░░░░░ ...│    │
│  │  ...                                                          │    │
│  │  ░ = 0   ▒ = 1-2   ▓ = 3-5   █ = 6+                        │    │
│  │  Dia hover → tooltip: "12 Mar 2026 — 8 expedientes"          │    │
│  └──────────────────────────────────────────────────────────────┘    │
│                                                                       │
│  ┌─ MONTHLY BREAKDOWN (grid 4×3) ──────────────────────────────┐    │
│  │  ┌─Jan─────┐  ┌─Fev─────┐  ┌─Mar─────┐  ┌─Abr─────┐       │    │
│  │  │ 142     │  │ 128     │  │ 168     │  │ 195     │       │    │
│  │  │ ▓▓▓▓░░  │  │ ▓▓▓░░░  │  │ ▓▓▓▓▓░  │  │ ▓▓▓▓▓▓  │       │    │
│  │  │ 87% ✅  │  │ 91% ✅  │  │ 78% ⚠️  │  │ 72% ⚠️  │       │    │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘       │    │
│  │  ...                                                          │    │
│  └──────────────────────────────────────────────────────────────┘    │
│                                                                       │
│  ┌─ SEASONALITY INSIGHTS ──────────────────────────────────────┐    │
│  │ 📈 "Abril-Junho concentram 38% do volume anual"             │    │
│  │ 📊 "Tempo médio de resposta caiu 18% vs Q1"                 │    │
│  │ ⚠️ "Outubro historicamente tem 2x mais intimações"           │    │
│  └──────────────────────────────────────────────────────────────┘    │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

#### Novidades

1. **GitHub-style CalendarHeatmap** de 365 dias (52 colunas × 7 linhas)
   - 5 níveis de intensidade via opacidade
   - Hover tooltip com data + contagem
   - Click → filtra para aquele dia (navega para semana view focado no dia)

2. **Monthly breakdown cards** (grid 3×4 ou 4×3)
   - Cada mês: total + barra de progresso + taxa de conclusão
   - Click → navega para mês view

3. **Annual KPIs**: Total, Baixados, Pendentes, Taxa de conclusão, Vencimentos, Tempo médio de baixa

4. **Seasonality insights**: Banners gerados a partir dos dados que identificam padrões (ex: meses de pico, tendências)

---

### 3.5 LISTA — Mesa de Trabalho (Upgrade Visual)

A lista já segue o DataShell pattern corretamente. Upgrades focados em **densidade visual** e **microinterações**.

1. **SubHeader com PulseStrip**: Adicionar stats acima da tabela (Total | Vencidos | Pendentes | Baixados)
2. **Row urgency indicators**: Linha inteira com borda esquerda colorida por urgência (como o QueueListRow)
3. **Inline quick actions**: Hover revela ícones de baixar/atribuir/ver sem abrir dialog
4. **Column improvements**:
   - Coluna "Prazo" com barra de progresso mini (days elapsed / total)
   - Coluna "Responsável" com avatar mini
5. **Filter chips visuais**: Filtros ativos aparecem como chips dismissíveis acima da tabela

---

## 4. Detail Sheet (Compartilhado entre Views)

O `ExpedienteControlDetailSheet` recebe upgrade para funcionar como **centro de ação** do expediente:

### Tabs Redesenhadas

| Tab           | Conteúdo                            | Novidades                                                                                                 |
| ------------- | ----------------------------------- | --------------------------------------------------------------------------------------------------------- |
| **Resumo**    | Meta grid + Classificação + Ações   | Prep-style scoring: % completude do expediente (tem tipo? tem responsável? tem observações? tem arquivo?) |
| **Processo**  | Dados do processo vinculado         | Timeline mini dos últimos eventos do processo                                                             |
| **Partes**    | Partes autora + ré + origem         | Cards com avatar/ícone por tipo de parte                                                                  |
| **Ação**      | Formulário de baixa + transferência | Quick-action buttons: Baixar, Transferir, Editar, Ver PDF                                                 |
| **Histórico** | Audit trail completo                | Timeline vertical com timestamps                                                                          |

### Header do Sheet

```
┌─ EXPEDIENTE DETAIL SHEET ────────────────────────────────────┐
│ [🔴 UrgencyDot]  Intimação - Despacho Saneador               │
│ 0001234-56.2024.5.01.0001 · TRT1 · 1º Grau                   │
│                                                                │
│ ┌─ META GRID (2×3) ────────────────────────────────────────┐  │
│ │ Prazo: 12/03/2026    Responsável: João Silva              │  │
│ │ Tipo: Intimação      Origem: Captura PJE                  │  │
│ │ Ciência: 05/03/2026  Status: 5d vencido 🔴                │  │
│ └──────────────────────────────────────────────────────────┘  │
│                                                                │
│ [Resumo] [Processo] [Partes] [Ação] [Histórico]               │
│                                                                │
│ ...conteúdo da tab...                                          │
│                                                                │
│ ┌─ QUICK ACTIONS ──────────────────────────────────────────┐  │
│ │ [📥 Baixar]  [👤 Transferir]  [📝 Editar]  [📄 Ver PDF]  │  │
│ └──────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

---

## 5. Componentes Novos a Criar

| #   | Componente              | Arquivo                         | Inspiração                                     |
| --- | ----------------------- | ------------------------------- | ---------------------------------------------- |
| 1   | `ExpedientesPulseStrip` | `expedientes-pulse-strip.tsx`   | `processos-pulse-strip.tsx`                    |
| 2   | `RiskScoreGauge`        | `risk-score-gauge.tsx`          | `saude-processual.tsx` (dashboard)             |
| 3   | `AgingFunnel`           | `aging-funnel-panel.tsx`        | `aging-funnel.tsx` (dashboard widget)          |
| 4   | `ActivityHeatmap`       | `activity-heatmap-panel.tsx`    | `heatmap-atividade.tsx` (dashboard)            |
| 5   | `WeekMissionView`       | `expedientes-week-mission.tsx`  | `audiencias-mission-view.tsx`                  |
| 6   | `MonthHeatmapCalendar`  | `expedientes-month-heatmap.tsx` | Upgrade do `expedientes-calendar-month.tsx`    |
| 7   | `YearRadarView`         | `expedientes-year-radar.tsx`    | Substituição do `expedientes-year-wrapper.tsx` |
| 8   | `SmartInsightEngine`    | Lógica em `service.ts`          | Regras de negócio para insights contextuais    |

---

## 6. Ordem de Implementação

### Fase 1 — Quadro (Sala de Situação)

1. Criar `ExpedientesPulseStrip` (substitui 5 ControlMetricCards)
2. Criar `RiskScoreGauge` (sidebar)
3. Criar `AgingFunnel` inline (sidebar)
4. Criar `ActivityHeatmap` inline (sidebar)
5. Expandir InsightBanners com regras inteligentes
6. Ajustar queue items com micro-completude + quick actions

### Fase 2 — Semana (Briefing Diário)

1. Redesenhar `ExpedientesTableWrapper` → `WeekMissionView`
2. Week strip com contagem por dia
3. Hero card contextual
4. Agrupamento semântico (urgentes/no prazo/sem prazo/baixados)
5. Day mission KPIs

### Fase 3 — Mês (Heatmap Mensal)

1. Upgrade cells do `ExpedientesCalendarMonth` com intensidade
2. Danger overlay para dias com vencidos
3. Micro stats por célula
4. Month summary strip no topo

### Fase 4 — Ano (Radar Estratégico)

1. Substituir grid atual por GitHub CalendarHeatmap de 365 dias
2. Monthly breakdown cards
3. Annual KPIs
4. Seasonality insights (calculados a partir dos dados)

### Fase 5 — Lista (Upgrade Visual)

1. SubHeader com PulseStrip
2. Row urgency indicators
3. Filter chips visuais
4. Column improvements (progress bars, avatars)

### Fase 6 — Detail Sheet (Evolução)

1. Header melhorado com meta grid
2. Nova tab "Ação" com quick-action buttons
3. Tab "Histórico" com timeline vertical
4. Prep-scoring do expediente

---

## 7. Princípios de Design Seguidos

| Princípio (MASTER.md)        | Aplicação                                                                  |
| ---------------------------- | -------------------------------------------------------------------------- |
| **Vidro sobre pedra**        | GlassPanel em depth 1/2/3 para hierarquia visual                           |
| **Dados primeiro**           | PulseStrip + AgingFunnel + Heatmap = dados densos sem decoração            |
| **Roxo com propósito**       | Primary apenas em CTAs, links, tabs ativas                                 |
| **Hierarquia por opacidade** | Urgency levels modulam opacidade, não multiplicam cores                    |
| **Mobile-honest**            | PulseStrip `grid-cols-2 lg:grid-cols-4`, queue cards stack                 |
| **Tipografia é arquitetura** | Montserrat nos títulos, Inter no corpo, Geist Mono nos números de processo |
| **Animação é feedback**      | AnimatedNumber nos KPIs, 200ms transitions nos hovers                      |

---

## 8. Métricas de Sucesso

| Métrica                    | Antes             | Depois (esperado)                      |
| -------------------------- | ----------------- | -------------------------------------- |
| Informação útil no Quadro  | 5 números         | 15+ data points com contexto           |
| Ação por clique (baixar)   | 3 cliques         | 2 cliques (quick action)               |
| Contexto temporal (semana) | Tabela flat       | Timeline com agrupamento semântico     |
| Análise anual              | Presença/ausência | Intensidade + seasonality + tendências |
| Insights proativos         | 1 banner básico   | Até 4 insights contextuais com CTA     |
