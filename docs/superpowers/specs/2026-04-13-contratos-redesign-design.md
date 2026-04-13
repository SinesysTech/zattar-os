# Contratos Module — Glass Briefing Redesign Spec

**Data:** 2026-04-13
**Status:** Aprovado
**Decisoes-chave:** Main page hibrida (KPI + pipeline stepper + tabela), Detail page com tabs (incluindo tab Entrevista Trabalhista), Glass Briefing em todos os componentes.

---

## 1. Contexto

O modulo de contratos (`src/app/(authenticated)/contratos/`) esta ~50% refatorado para o design system Glass Briefing. A arquitetura de dados (domain, service, repository, actions) esta completa. A camada visual precisa ser alinhada ao padrao ja implementado em audiencias, expedientes e processos.

### Estado Atual
- **Refatorado:** layout.tsx, contratos-table-wrapper.tsx, columns.tsx, contrato-card.tsx, contrato-delete-dialog.tsx, contrato-alterar-responsavel-dialog.tsx, contrato-financeiro-card.tsx, mock/page.tsx
- **Parcialmente refatorado:** contrato-detalhes-client.tsx, contrato-form.tsx, contrato-view-sheet.tsx, pipelines/page-client.tsx, tipos/page-client.tsx
- **Nao refatorado:** Maioria dos detail cards, timeline, KPI strip (inexistente), pipeline stepper (inexistente), insight banners (inexistente), filter bar (inexistente)

### Gaps de Service descobertos
Funcoes existentes no service/repository que NAO estao expostas na UI:
- `contarContratosPorStatus()` — parcial (mock page usa, main page nao)
- `countContratosTrendMensal()` — nao exposto
- `countContratosNovosMes()` — nao exposto
- `contarContratosAteData()` / `contarContratosEntreDatas()` — nao usados na UI

---

## 2. Decisoes de Design

| Decisao | Escolha | Alternativas descartadas |
|---------|---------|--------------------------|
| Layout main page | Hibrido: KPI strip + mini pipeline stepper + tabela | (A) Padrao audiencias com view toggle, (B) CRM dashboard |
| Layout detail page | Tabs (manter atual, migrar visual) | (B) Sidebar fixa, (C) Bento grid |
| Kanban | Rota separada `/kanban` (manter) | Inline na main page |

---

## 3. Main Page — Lista de Contratos

### Estrutura (top to bottom)
1. **Header:** Heading level="page" + subtitle dinamico + Button "Novo Contrato"
2. **KPI Strip:** 4 cards GlassPanel depth=2 em grid 2→4 colunas
3. **Insight Banners:** Condicionais (vencendo <7d, sem responsavel)
4. **Mini Pipeline Stepper:** Barra horizontal com 4 estagios + contagens, clickavel para filtrar
5. **Controls:** TabPills (Ativos|Todos) + FilterBar + SearchInput + ViewToggle (Lista|Kanban)
6. **DataShell + DataTable:** Tabela principal com colunas existentes
7. **DataPagination:** Paginacao

### KPI Cards

| Card | Fonte de dados | Visual |
|------|---------------|--------|
| Ativos | `contarContratosPorStatus()` — soma contratado+distribuido | Numero + icone FileCheck, cor primary |
| Valor Total | NOVO: `sumValorContratosAtivos()` | fmtMoeda + sparkline trend mensal |
| Vencendo 30d | NOVO: `countContratosVencendo(30)` | Numero + cor warning/destructive |
| Novos/Mes | `countContratosNovosMes()` (repo existe) | Numero + trend vs mes anterior |

### Pipeline Stepper
- 4 estagios: em_contratacao → contratado → distribuido → desistencia
- Cada estagio: badge com contagem + label
- Cor: gradient primary (claro → escuro)
- Click filtra a tabela por status

### Insight Banners
- **Alerta (destructive):** "N contratos vencem nos proximos 7 dias"
- **Info:** "N contratos sem responsavel atribuido"
- Mostrados condicionalmente (count > 0)

### Componentes novos necessarios
- `contratos-pulse-strip.tsx` — baseado em `expedientes-pulse-strip.tsx`
- `contratos-pipeline-stepper.tsx` — novo componente
- `contratos-insight-banner.tsx` — usa InsightBanner existente
- `contratos-filter-bar.tsx` — baseado em `AudienciasFilterBar`
- `contratos-content.tsx` — orquestrador client, baseado em `expedientes-content.tsx`

---

## 4. Detail Page — Contrato Individual (`[id]/`)

### Estrutura
1. **Header (GlassPanel d=1):** Avatar + titulo + status badge + tipo + cobranca + segmento + responsavel + acoes
2. **Pipeline Stepper:** Inline no header, mostra estagio atual destacado
3. **Mini KPI Row:** 4 cards GlassPanel d=2 (Partes, Processos, Documentos, Valor) de `ContratoCompletoStats`
4. **Tabs:** Resumo | Partes | Processos | Financeiro | Documentos | Timeline | Entrevista

### Migracao por componente

| Componente | De | Para |
|-----------|-----|------|
| contrato-detalhes-header.tsx | Card | GlassPanel d=1 + pipeline stepper |
| contrato-detalhes-card.tsx | Card | WidgetContainer grid 2 colunas |
| contrato-resumo-card.tsx | Card | WidgetContainer |
| contrato-partes-card.tsx | Card | Lista de GlassPanel d=1 com Avatar + SemanticBadge |
| contrato-processos-card.tsx | Card | WidgetContainer com links para /processos/[id] |
| contrato-financeiro-card.tsx | Card | 3 KPI cards d=2 + progress bar + DataTable |
| contrato-documentos-card.tsx | Card | WidgetContainer + grid de doc cards |
| contrato-progress-card.tsx | REMOVER | Substituido pelo pipeline stepper no header |
| contrato-tags-card.tsx | Card | Inline no header ou WidgetContainer compacto |
| contrato-timeline.tsx | Basico | Redesign: vertical timeline com icones semanticos por tipo de evento |
| contrato-view-sheet.tsx | Divs | GlassPanel dentro do Sheet |

### Tab "Resumo"
- Grid 2 colunas: Detalhes Gerais (WidgetContainer) + Datas & Prazos (WidgetContainer)
- Full-width: Observacoes (WidgetContainer)

### Tab "Partes"
- Cards por parte em GlassPanel d=1
- Avatar + Nome + Papel (SemanticBadge) + CPF/CNPJ + Contato
- Link para entidade

### Tab "Financeiro"
- 3 KPI cards d=2: Valor Total, Recebido, Pendente
- Progress bar: % recebido do total
- DataTable de lancamentos

### Tab "Timeline"
- Vertical timeline com icones por tipo de evento
- Agrupada por data
- Filtro por tipo de evento (status, documento, comentario)

---

## 5. Sub-paginas

### 5.1 Kanban (`/contratos/kanban`)
- Colunas em GlassPanel d=1 (uma por estagio do pipeline)
- Header de coluna: nome + contagem + badge cor
- Cards: `contrato-card.tsx` (ja refatorado)
- Footer: contagem total
- Controls: Search + Filter (Responsavel, Segmento)

### 5.2 Pipelines Config (`/contratos/pipelines`)
- Tabela manual → DataTable + DataTableToolbar
- Forms → DialogFormShell
- CRUD de pipelines e estagios

### 5.3 Tipos Config (`/contratos/tipos`)
- Tabela manual → DataTable + DataTableToolbar
- Forms → DialogFormShell

### 5.4 Tipos Cobranca (`/contratos/tipos-cobranca`)
- Identico ao Tipos Config

### 5.5 Formulario de Contrato (`contrato-form.tsx`)
- DialogFormShell (ja usado)
- Ampliar maxWidth para "xl" (grid 3 colunas)
- Melhorar layout responsivo
- Secao de partes com UX de lista dinamica (add/remove)

---

## 5b. Tab Entrevista Trabalhista (modulo externo integrado)

O modulo `entrevistas-trabalhistas` (`src/app/(authenticated)/entrevistas-trabalhistas/`) e consumido como tab "Entrevista" na detail page de contratos. Possui 21 componentes, 3 trilhas de investigacao (Classico, Gig Economy, Pejotizacao) com 4 modulos cada + consolidacao final com IA.

### View States

**Empty State** (sem entrevista)
- Migrar para: GlassPanel d=1 centralizado + IconContainer + Heading + Text + Button

**No Zero** (selecao tipo litigio)
- 3 cards de selecao: `Card`/`CardContent` → `GlassPanel d=1` com borda ring-primary no selecionado
- Select de perfil reclamante (condicional)
- Typography: `<h3>` → `Heading level="card"`, `<p>` → `Text`

**Wizard** (em andamento)
- Status badge + modulo atual
- Stepper horizontal: reutilizar padrao `pipeline-stepper` do contratos
- Conteudo do modulo: `Card` wrapper → `GlassPanel d=1`
- Campos agrupados: → `WidgetContainer`
- Blocos condicionais (`bg-muted/20`, `bg-warning/5`): → `GlassPanel d=1`
- Titulos `<h3>` → `Heading level="card"`
- Navegacao: [Anterior] [Proximo]

**Resumo** (concluida)
- Header: Badge "Concluida" + Button "Reabrir"
- Accordion de modulos, cada item em GlassPanel d=1
- Grid de campos preenchidos com icones check/x
- Secao notas operador: `div bg-muted/50` → `WidgetContainer`
- Consolidacao final com relato IA

### Migracao por componente

| Componente | De | Para |
|-----------|-----|------|
| entrevista-tab.tsx | Divs + inline typography | Heading + Text + GlassPanel empty state |
| no-zero-selector.tsx | Card/CardContent | GlassPanel d=1 com ring-primary |
| entrevista-wizard.tsx | Card wrapper + stepper manual | GlassPanel d=1 + pipeline-stepper reusavel |
| entrevista-resumo.tsx | Divs + Accordion | GlassPanel d=1 dentro do Accordion + WidgetContainer |
| modulo-consolidacao-final.tsx | Divs bg-muted/20 | GlassPanel d=1 |
| 12x modulo-*.tsx | Inline h3 + divs | Heading + WidgetContainer para agrupamentos |
| testemunhas-toggle.tsx | div border rounded-lg | GlassPanel d=1 compacto |
| anexo-upload-zone.tsx | div bg-muted/20 | GlassPanel d=1 |
| operador-alert.tsx | Alert shadcn | Manter (ja semantico) |
| sim-nao-radio.tsx | RadioGroup | Manter (minimo, OK) |

---

## 6. Novos Endpoints Necessarios

| Endpoint | Camada | Descricao |
|----------|--------|-----------|
| `sumValorContratosAtivos()` | Repository | SUM(valor_causa) WHERE status IN (contratado, distribuido) |
| `countContratosVencendo(dias)` | Repository | COUNT WHERE data_vencimento BETWEEN now AND now+dias |
| `countContratosSemResponsavel()` | Repository | COUNT WHERE responsavel_id IS NULL |
| `actionContratosPulseStats()` | Actions | Agrega todos os KPIs acima + trend mensal + novos/mes |
| Expor `countContratosTrendMensal()` | Actions | Wrapper para repo existente |
| Expor `countContratosNovosMes()` | Actions | Wrapper para repo existente |

---

## 7. Plano de Fases

### Fase 1 — Main Page (maior impacto visual)
1. Novos endpoints: `actionContratosPulseStats()`
2. Criar `contratos-pulse-strip.tsx`
3. Criar `contratos-pipeline-stepper.tsx`
4. Criar `contratos-insight-banner.tsx`
5. Criar `contratos-filter-bar.tsx`
6. Criar `contratos-content.tsx` (orquestrador)
7. Conectar na page.tsx

### Fase 2 — Detail Page Header + Tabs Structure
1. Refatorar `contrato-detalhes-header.tsx` → GlassPanel + stepper
2. Refatorar `contrato-detalhes-client.tsx` → nova estrutura de tabs
3. Adicionar mini KPI row
4. Remover `contrato-progress-card.tsx`

### Fase 3 — Detail Page Tab Contents
1. `contrato-detalhes-card.tsx` → WidgetContainer
2. `contrato-resumo-card.tsx` → WidgetContainer
3. `contrato-partes-card.tsx` → GlassPanel + Avatar + SemanticBadge
4. `contrato-processos-card.tsx` → WidgetContainer
5. `contrato-financeiro-card.tsx` → KPI cards + progress bar
6. `contrato-documentos-card.tsx` → WidgetContainer + grid
7. `contrato-tags-card.tsx` → compacto
8. `contrato-timeline.tsx` → redesign completo

### Fase 4 — Sub-paginas de Config
1. `pipelines/page-client.tsx` → DataTable + DialogFormShell
2. `tipos/page-client.tsx` → DataTable + DialogFormShell
3. `tipos-cobranca/page-client.tsx` → DataTable + DialogFormShell

### Fase 5 — Kanban + Polish
1. `kanban-column.tsx` → GlassPanel
2. `pipeline-funnel.tsx` → glass tokens
3. `financial-strip.tsx` → GlassPanel d=2
4. `contrato-view-sheet.tsx` → glass sections
5. QA visual: dark/light mode em todos os componentes
6. QA responsividade: 375px, 768px, 1024px, 1440px

### Fase 6 — Tab Entrevista Trabalhista (modulo externo)
1. `entrevista-tab.tsx` → Heading + Text + GlassPanel empty state
2. `no-zero-selector.tsx` → GlassPanel d=1 para cards de selecao (Card → GlassPanel)
3. `entrevista-wizard.tsx` → GlassPanel d=1 wrapper + pipeline-stepper reutilizavel
4. `entrevista-resumo.tsx` → GlassPanel d=1 dentro do Accordion + WidgetContainer notas
5. `modulo-consolidacao-final.tsx` → GlassPanel d=1 para blocos condicionais
6. 12x `modulo-*.tsx` → Heading level="card" + WidgetContainer para agrupamento de campos
7. `testemunhas-toggle.tsx` → GlassPanel d=1 compacto
8. `anexo-upload-zone.tsx` → GlassPanel d=1

---

## 8. Componentes Shared Reutilizados

| Componente | Import |
|-----------|--------|
| PageShell | @/components/shared/page-shell |
| DataShell | @/components/shared/data-shell/data-shell |
| DataTable | @/components/shared/data-shell/data-table |
| DataTableToolbar | @/components/shared/data-shell/data-table-toolbar |
| DataPagination | @/components/shared/data-shell/data-pagination |
| GlassPanel, WidgetContainer | @/components/shared/glass-panel |
| DialogFormShell | @/components/shared/dialog-shell/dialog-form-shell |
| Heading, Text | @/components/ui/typography |
| SemanticBadge | @/components/ui/semantic-badge |
| InsightBanner | @/components/dashboard/insight-banner |
| SearchInput | @/components/dashboard/search-input |
| TabPills | @/components/dashboard/tab-pills |
| ViewToggle | @/components/dashboard/view-toggle |
| IconContainer | @/components/shared/icon-container |
| AnimatedNumber | @/components/primitives/animated-number |
| Sparkline | @/components/primitives/sparkline |

---

## 9. Regras de Design (Glass Briefing)

- Cores SEMPRE via CSS variables — nunca `bg-blue-500` ou `#hex`
- Glass Depth: d=1 (containers), d=2 (KPIs/metricas), d=3 (enfase maxima)
- Tipografia via Heading/Text — sem tamanhos avulsos
- Espacamento via SPACING/SEMANTIC_SPACING de tokens.ts
- Opacidade via OPACITY_SCALE — sem valores arbitrarios
- Dark mode obrigatorio — CSS variables ja tem override .dark
- Dialogs: glass-dialog + glass-dialog-overlay
- Badges: SemanticBadge com category — nunca hardcode de cores
