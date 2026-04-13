# Comunica CNJ — Gazette Fusion Redesign

> **Status:** Aprovado
> **Data:** 2026-04-13
> **Abordagem:** Gazette Fusion (Stripe + Linear + Notion + QuickBooks)
> **Escopo:** Redesign Completo + Features (AI, Timeline, Workflow de Triagem)

## 1. Visao Geral

Redesign completo do modulo Comunica CNJ (Diario Oficial) do ZattarOS. Transforma uma interface de 2 tabs (Consulta + Capturadas) em um **Command Center hibrido** com KPIs interativos, busca NLP, filtros progressivos, toggle tabela/cards, detail panel deslizante, resolucao inteligente de orfaos, AI insights, e timelines de sincronizacao e processo.

### Principios

1. **Calm density** (Linear) — informacao densa sem poluicao visual
2. **KPIs funcionais** (Stripe) — metricas clicaveis que filtram dados
3. **Views como presets** (Notion) — filtros salvos como tabs reutilizaveis
4. **Reconciliacao inteligente** (QuickBooks) — resolucao de orfaos com confidence scores
5. **Glass Briefing nativo** — profundidade semantica via GlassPanel depth 1/2/3
6. **Zero regressao** — todas as funcionalidades atuais preservadas

### Restricoes

- Stack: Next.js 16, React 19, Tailwind CSS 4, shadcn/ui
- Componentes shared: GlassPanel, TabPills, SearchInput, IconContainer, Heading, Text, SemanticBadge, EmptyState, DataShell
- FSD Architecture: modulo proxy em `src/app/(authenticated)/comunica-cnj/`, logica em `captura/comunica-cnj/`
- Tokens CSS: usar tokens existentes do design system (surfaces, status, chart) e adicionar novos `--gazette-*` se necessario
- Cores: apenas CSS variables — zero hardcoded hex/oklch
- Dark mode: obrigatorio, via CSS variables override em `.dark`

---

## 2. Arquitetura de Pagina

### Layout Desktop (>=1280px)

```
+-----------------------------------------------------------+
|  Header: [Diario Oficial] [badge CNJ]  [Cmd+K Search]     |
|          [Sincronizar] [API status: verde 847/1000]        |
+-----+-----+-----+-----+-----+----------------------------+
| KPI | KPI | KPI | KPI | KPI |  (5 cols, interativos)      |
+-----+-----+-----+-----+-----+----------------------------+
| [Todas][Pendentes][Orfaos(3)][Prazos][Meus Proc][+View]   |
| [Fonte v][Tipo v][Periodo v][Advogado v][+ Filtro] chips   |
+---------------------------------------+-------------------+
|  Data Table / Cards (toggle)           | Detail Panel      |
|  - Tipo, Processo, Partes, Orgao       | (420px slide-in)  |
|  - Fonte, Data, Prazo, Status          | - Processo info   |
|  - Inline actions, row selection       | - Partes A/R      |
|  - 3 densidades (compacto/padrao/conf) | - Alerta prazo    |
|  - Keyboard: up/down/enter/esc         | - AI resumo       |
|                                        | - Texto (collapse)|
|  Paginacao: 1-50 de 142               | - Expediente link  |
|                                        | - Timeline proc.  |
+---------------------------------------+-------------------+
```

### Glass Depth Mapping

| Elemento | Depth | Classe |
|----------|-------|--------|
| Container da pagina | 1 | `glass-widget` |
| KPI cards, publication cards | 2 | `glass-kpi` |
| KPI ativo (filtro selecionado) | 3 | `bg-primary/[0.04] backdrop-blur-xl border-primary/10` |
| CTA "Sincronizar", alertas urgentes | 3 | primary tint |
| Filter chips ativos | 2 | `glass-kpi` |
| Detail panel | 1 | `glass-widget` com border-left |

---

## 3. KPI Strip

5 metricas interativas em grid horizontal. Cada KPI e clicavel e filtra a tabela abaixo.

| KPI | Metrica | Visual | Ao Clicar |
|-----|---------|--------|-----------|
| Publicacoes Hoje | count total do dia | numero + sparkline 7d + % vs ontem | filtra por data=hoje |
| Vinculados | count com expediente | numero + progress bar (% taxa) | filtra status=vinculado |
| Pendentes | count sem acao | numero + badge "aguardando triagem" | filtra status=pendente |
| Prazos Criticos | count prazo <48h | numero vermelho + icone warning | filtra prazo critico |
| Orfaos | count sem expediente | numero ambar + badge "AI: N com sugestao" | filtra status=orfao |

### Comportamento

- KPI ativo: borda top colorida (2px) + background tint + depth 3
- KPI inativo: depth 2, hover com border sutil
- Clicar novamente no KPI ativo remove o filtro
- Sparklines nos KPIs mostram tendencia dos ultimos 7 dias
- Dados vem de query agregada no repository (nova action `actionObterMetricas`)

---

## 4. Search NLP + Filtros Progressivos

### Camada 1: Search Bar NLP (Cmd+K)

- Posicao: header da pagina, sempre visivel
- Placeholder: `Buscar publicacoes... (ex: "intimacoes TJ-PR desta semana")`
- Shortcut: `Cmd+K` ou `/`

**Fluxo NLP:**
1. Usuario digita texto natural
2. AI parseia e mostra interpretacao como chips editaveis abaixo do input
3. Cada chip tem cor semantica por categoria e botao de remover
4. Acoes: "Aplicar Filtros", "Editar Filtros", "Salvar como View"

**Fluxo Operadores (power users):**
- Sintaxe: `fonte:tj-pr tipo:intimacao prazo:<5d processo:0001234 vinculado:nao`
- Syntax highlighting no input (operador em primary, valor em foreground)
- Autocomplete para operadores e valores

**Cores semanticas dos chips:**
- Fonte: azul (`--info`)
- Tipo: verde (`--success`)
- Periodo: ambar (`--warning`)
- Prazo: vermelho (`--destructive`)
- Advogado: roxo (`--accent`)
- Status: neutro (`--muted`)

### Camada 2: Filter Bar (Dropdowns)

Botoes horizontais com popovers individuais:

| Filtro | Componente | Comportamento |
|--------|-----------|---------------|
| Fonte | Combobox agrupado (TRT/TJ/TRF/TRE/Superiores) | Multi-select com checkboxes, busca interna |
| Tipo | Checkboxes com badges coloridos | INT/DES/SEN/EDIT/CERT/OUT |
| Periodo | DateRangePicker | Presets: hoje, 7d, 30d, custom |
| Advogado | Combobox com OAB | Mostra nome + OAB numero/uf |
| Meio | Radio | Todos / Edital / Diario Eletronico |
| Status | Checkboxes | Vinculado / Pendente / Orfao |

- Botao ativo: background tint + valor inline
- Botao inativo: border sutil
- Badge de contagem: "Filtros ativos (N)"
- Botao "Limpar" para resetar todos
- `+ Filtro`: adiciona filtros opcionais (Parte, Texto, Processo)

### Camada 3: Views Salvos (Presets)

Tabs acima da filter bar. Cada view e um preset de filtros + sort + colunas visiveis.

**Views padrao:**
- Todas (sem filtro)
- Pendentes (status=pendente)
- Orfaos (status=orfao, badge com contagem)
- Prazos (ordenado por prazo crescente, filtro prazo<=30d)
- Meus Processos (advogado=usuario logado)

**View customizada (+View):**
- Dialog: nome, icone, filtros incluidos (chips), visibilidade (pessoal/equipe)
- Persistido no banco (nova tabela `comunica_cnj_views`)
- Estado de view (filtros, sort, density, table/cards) persistido por view

---

## 5. Tabela / Cards + Detail Panel

### Modo Tabela (padrao desktop)

**Colunas:**

| Coluna | Tipo | Conteudo |
|--------|------|----------|
| Checkbox | selection | multi-select para batch actions |
| Tipo | badge colorido | INT (azul), DES (ambar), SEN (roxo), EDIT (verde), CERT (cinza) |
| Processo / Partes | texto | numero (monospace tabular-nums) + partes abaixo (muted) |
| Orgao | texto | nome da vara/gabinete |
| Fonte | badge outline | sigla do tribunal |
| Data | texto | data de disponibilizacao (tabular-nums) |
| Prazo | badge countdown | dias restantes com cor (vermelho <3d, ambar <7d, verde >7d, — se sem prazo) |
| Status | dot semantico | verde solido=vinculado, ambar solido=pendente, ambar anel=orfao (+badge AI %) |
| Acoes | menu | botao "..." com dropdown |

**3 densidades:**
- Compacto: 32px rows, sem excerpt
- Padrao: 42px rows, sem excerpt
- Confortavel: 56px rows, com excerpt de 1 linha

**Colunas configuraveis** via popover "Colunas": toggle on/off + drag-to-reorder. Persistido por view.

### Modo Cards

Grid 2 colunas em desktop, 1 coluna em mobile. Cada card mostra:
- Header: badge tipo + fonte + prazo + status dot
- Processo numero (bold, tabular-nums)
- Partes + orgao (muted)
- Excerpt 2 linhas (texto da comunicacao truncado)
- Footer: data + acoes (PDF, Detalhes, Vincular se orfao)

Card orfao: borda ambar + badge AI % no header.

### Toggle Tabela/Cards

Switch no toolbar: icones de grid (tabela) e cards. Estado persistido por view.
Mobile (<768px): forcado modo cards (tabela nao funciona em tela estreita).

### Detail Panel (420px, slide-in direita)

Abre ao clicar em uma row/card. Nao navega — mantem contexto da lista.

**Secoes do panel:**

1. **Header**: badge tipo + data + navegacao (setas up/down) + fechar (X)
2. **Processo**: numero (bold), badges (tribunal, orgao, grau)
3. **Partes**: lista com badges A (azul) e R (vermelho)
4. **Alerta de Prazo** (condicional): faixa vermelha com icone, dias restantes, data limite, tipo de prazo
5. **AI Resumo**: badge "AI" + 2-3 frases + tags extraidas (prazo, valor, acao) + botao "Regenerar"
6. **Texto da Comunicacao**: collapsible com gradient fade, botao "Expandir". HTML sanitizado com DOMPurify
7. **Expediente Vinculado** (condicional): card clicavel com numero do expediente, data de vinculacao, link para navegar
8. **Timeline do Processo**: todas as publicacoes do mesmo processo em ordem cronologica (mais recente no topo)
9. **Acoes**: Ver Certidao PDF, Abrir no PJE, Ver Expediente

**Keyboard navigation:**
- `↑↓`: navega entre items na lista (muda o detail panel)
- `Esc`: fecha o panel
- `Enter`: abre o panel se fechado

---

## 6. View Orfaos + Resolucao Inteligente

### Header da View

- Titulo "Comunicacoes Orfas" + badge contagem
- Progress bar: resolvidos / total (verde=resolvidos, ambar=pendentes)
- Legenda: Alta confianca (>85%), Media (50-85%), Sem match
- Batch action: "Aceitar Alta Confianca (N)" — resolve todos >85% em 1 clique

### Interface Split-Panel

Duas colunas lado a lado:

**Esquerda — Publicacao Original:**
- Badge tipo + fonte + data
- Numero do processo (com highlight nos trechos que matchearam)
- Partes (com highlight)
- Orgao (com highlight)
- Texto excerpt (com highlight nos trechos relevantes)

**Direita — Match Sugerido:**
- Confidence score: barra visual + percentual
- Card do expediente sugerido: numero, processo, partes, vara, status, data criacao
- Criterios de match (checklist):
  - ✓ Numero do processo — match exato
  - ✓ Nome da parte — match fuzzy
  - ✓ Vara compativel
  - ✓ Data compativel (janela 3 dias)
  - ○ CPF/CNPJ — nao disponivel

**4 acoes:**
1. **Vincular a Este Expediente** (CTA primario, verde)
2. **Buscar Outro** (abre dialog de busca manual)
3. **Criar Expediente** (cria novo a partir da comunicacao)
4. **Marcar Irrelevante** (descarta, discreto)

### Estado Sem Match

Quando AI nao encontra correspondencia:
- Icone vazio + "Nenhum match encontrado"
- 3 acoes: Buscar Manualmente, Criar Novo Expediente, Ignorar

### Navegacao

- `← →` ou botoes "Anterior/Proximo": navega entre orfaos
- Counter: "1 de 3 pendentes"
- Undo toast: toda vinculacao e reversivel por 10 segundos

### Logica de Matching (aproveitando codigo existente)

O `repository.ts` ja tem `findExpedienteCorrespondente()` que busca por:
- Mesmo numero_processo + trt + grau
- data_criacao_expediente dentro de 3 dias
- Expediente nao baixado e sem comunicacao existente

Expandir para calcular **confidence score** baseado em:
- Numero do processo: match exato = +40%
- Nome da parte: fuzzy match = +25%
- Vara/orgao compativel = +15%
- Data dentro da janela = +10%
- Tribunal compativel = +10%

---

## 7. AI Features

### 7.1 AI Resumos

- Cada comunicacao recebe resumo automatico ao ser capturada
- 2-3 frases + tags extraidas (prazo, valor, tipo de acao)
- Usa `gerarResumo` existente no service (via `@/lib/ai/summarization`)
- Badge "AI" + botao "Regenerar"
- Mostrado no Detail Panel, secao dedicada

### 7.2 AI Insights (proativos)

Cards de insight abaixo dos KPIs, aparecem quando relevantes:

| Tipo | Cor | Exemplo |
|------|-----|---------|
| Padrao Detectado | primary | "5 intimacoes do TRT-9 sobre horas extras hoje" |
| Atencao Requerida | warning | "Sentenca menciona condenacao em honorarios" |
| Relatorio Automatico | success | "23 publicacoes vinculadas automaticamente (89%)" |

- Dismissable (X button)
- Maximo 3 cards visiveis, scroll horizontal se mais
- Gerados pela sincronizacao (enriquecimento pos-captura)

### 7.3 AI Search NLP

- Input aceita linguagem natural
- AI parseia para filtros estruturados
- Interpretacao mostrada como chips editaveis
- Transparencia total — usuario ve e corrige antes de aplicar

### 7.4 AI Matching (orfaos)

- Confidence score calculado por criterios pesados
- Sugestoes ordenadas por score descendente
- Batch accept para alta confianca (>85%)
- Criterios de match visiveis para o usuario

---

## 8. Timelines

### 8.1 Timeline de Sincronizacao

- Acessivel via popover do botao "Sincronizar" ou status da API
- Vertical, mais recente no topo
- Cada entrada mostra:
  - Tipo: automatica / manual
  - Status: sucesso (verde) / erro (vermelho)
  - 5 metricas: total, novos, duplicados, vinculados auto, orfaos
  - Metadata: OAB, tribunais, duracao
  - Erros com botao retry
- Ultimas 10 entradas
- Nova tabela `comunica_cnj_sync_log` no banco

### 8.2 Timeline do Processo

- No Detail Panel, secao dedicada
- Todas as publicacoes do mesmo numero de processo
- Ordem cronologica (mais recente no topo)
- Entry atual highlighted em primary com glow
- Prazos com countdown e cor de urgencia
- Clicavel para navegar entre publicacoes

---

## 9. Responsividade

| Elemento | Desktop >=1280 | Tablet 768-1279 | Mobile <768 |
|----------|---------------|-----------------|-------------|
| KPI Strip | grid 5 cols | grid 2x2+1 | horizontal scroll |
| View Tabs | inline | inline | horizontal scroll |
| Filter Bar | inline | popover unico | sheet bottom |
| Data View | table/cards toggle | table/cards toggle | cards only |
| Detail Panel | slide-in 420px | sheet bottom | sheet fullscreen |
| Orfaos Split | side-by-side | stacked vertical | stacked vertical |
| PDF Viewer | split (meta + pdf) | split | pdf full + meta collapse |
| AI Insights | grid 3 cols | grid 2 cols | horizontal scroll |

---

## 10. Empty States

| Contexto | Icone | Mensagem | CTA |
|----------|-------|----------|-----|
| Sem resultados | ⊘ | "Nenhuma publicacao encontrada" | Limpar Filtros |
| Primeira vez | ↻ | "Nenhuma publicacao capturada ainda" | Sincronizar Agora + suggestion cards (Configurar OAB, Selecionar Tribunais) |
| Orfaos resolvidos | ✓ | "Tudo resolvido!" | (nenhum) |
| Sem prazos | ☀ | "Nenhum prazo urgente" | (nenhum) |

Todos usam `EmptyState` de `@/components/shared/empty-state.tsx`.

---

## 11. Dialogs, Popovers e Tooltips

### Dialogs (glass-dialog + glass-dialog-overlay)

| Dialog | Trigger | Conteudo |
|--------|---------|----------|
| Sincronizacao Manual | Botao "Sincronizar" | Selecao advogado (OAB) + tribunal + periodo + progress bar + metricas finais |
| Buscar Expediente | Botao "Buscar Outro" nos orfaos | Combobox busca por numero processo + lista resultados + clique vincular |
| Criar Nova View | Botao "+ View" | Nome + icone + filtros (chips) + visibilidade (pessoal/equipe) |
| PDF Viewer | Botao "Ver Certidao" | Split: metadados (280px) + PDF renderizado (react-pdf) + toolbar zoom/paginacao |
| Atalhos de Teclado | Tecla `?` | Lista completa de keyboard shortcuts |

### Popovers

| Popover | Trigger | Conteudo |
|---------|---------|----------|
| Filtro Fonte | Botao "Fonte" | Combobox agrupado multi-select |
| Filtro Tipo | Botao "Tipo" | Checkboxes com badges |
| Filtro Periodo | Botao "Periodo" | DateRangePicker com presets |
| Filtro Advogado | Botao "Advogado" | Combobox OAB |
| Filtro Meio | Botao "Meio" | Radio buttons |
| Filtro Status | Botao "Status" | Checkboxes |
| Config Colunas | Botao "Colunas ⚙" | Toggle list + drag reorder |
| Timeline Sync | Status API / hover Sincronizar | Ultimas 10 sincronizacoes + botao sync |
| Row Actions | Botao "..." na tabela | Ver detalhes, PDF, Abrir PJE, Vincular/Desvincular |

### Tooltips

| Elemento | Conteudo |
|----------|----------|
| KPI card hover | Breakdown da metrica (ex: "47 TRT-9, 95 TJ-PR") |
| Status dot | "Vinculado ao Exp. #4521" ou "Pendente de triagem" |
| AI badge | "Confianca de match: 92% — baseado em processo + parte + vara" |
| Prazo badge | "Vence em 14/04/2026 (2 dias) — Contestacao 15 dias" |
| Rate limit | "847/1000 requests · Reset em 2h" |
| Sparkline | "Ultimos 7 dias: 98, 105, 112, 89, 142, 128, 142" |

---

## 12. Keyboard Shortcuts

| Shortcut | Acao |
|----------|------|
| `/` | Focar search bar |
| `Cmd+K` | Abrir search NLP |
| `↑` `↓` | Navegar entre rows/cards |
| `Enter` | Abrir detail panel |
| `Esc` | Fechar detail panel / dialog |
| `v` | Vincular (no detail panel de orfao) |
| `p` | Abrir PDF viewer |
| `f` | Abrir filtros |
| `t` | Toggle tabela/cards |
| `?` | Mostrar atalhos |
| `← →` | Anterior/Proximo (na view orfaos) |

---

## 13. Novas Dependencias de Dados

### Novas Actions Necessarias

| Action | Permissao | Descricao |
|--------|-----------|-----------|
| `actionObterMetricas` | `comunica_cnj:listar` | Retorna KPIs agregados (contagens por status, prazos criticos, orfaos) |
| `actionBuscarMatchSugerido` | `comunica_cnj:editar` | Retorna expediente sugerido com confidence score para uma comunicacao |
| `actionAceitarMatchBatch` | `comunica_cnj:editar` + `expedientes:editar` | Vincula todos os orfaos com confianca >85% |
| `actionSalvarView` | auth generica | Cria/atualiza view salva |
| `actionListarViews` | auth generica | Lista views do usuario + equipe |
| `actionGerarResumoAI` | `comunica_cnj:visualizar` | Gera resumo AI para uma comunicacao |
| `actionBuscarInsightsAI` | `comunica_cnj:listar` | Retorna insights proativos baseados nas publicacoes do dia |
| `actionRegistrarSincronizacao` | `comunica_cnj:capturar` | Salva log de sincronizacao com metricas |
| `actionListarSincronizacoes` | `comunica_cnj:listar` | Lista historico de sincronizacoes |

### Novas Tabelas

| Tabela | Colunas Principais |
|--------|--------------------|
| `comunica_cnj_views` | id, nome, icone, filtros (jsonb), colunas (jsonb), sort (jsonb), visibilidade (pessoal/equipe), criado_por, created_at |
| `comunica_cnj_sync_log` | id, tipo (auto/manual), status (sucesso/erro), total, novos, duplicados, vinculados, orfaos, erros (jsonb), oab, tribunais, duracao_ms, created_at |
| `comunica_cnj_resumos` | id, comunicacao_id (FK), resumo, tags (jsonb), created_at, updated_at |

---

## 14. Componentes a Criar/Refatorar

### Novos Componentes

| Componente | Descricao |
|-----------|-----------|
| `GazetteKpiStrip` | Grid de 5 KPIs interativos com sparklines |
| `GazetteKpiCard` | Card individual com metricas, trend, clique-para-filtrar |
| `GazetteSearchBar` | Search NLP com interpretacao AI + operadores |
| `GazetteFilterBar` | Barra de filtros com popovers individuais |
| `GazetteFilterChips` | Chips ativos removiveis com cores semanticas |
| `GazetteViewTabs` | Tabs de views salvos com badge de contagem |
| `GazetteDataTable` | Tabela de alta densidade com 3 densidades |
| `GazetteCardGrid` | Grid de cards com excerpts |
| `GazetteDetailPanel` | Painel deslizante com todas as secoes |
| `GazetteOrphanResolver` | Split-panel de resolucao com confidence scores |
| `GazetteTimeline` | Timeline vertical reutilizavel (sync + processo) |
| `GazetteAiInsights` | Cards de insight proativos |
| `GazetteAiSummary` | Bloco de resumo AI com tags |
| `GazettePdfViewer` | Split-view PDF com metadados + react-pdf |
| `GazetteEmptyState` | Empty states contextuais (4 variantes) |
| `GazetteSyncDialog` | Dialog de sincronizacao manual com progress |
| `GazetteCreateViewDialog` | Dialog para criar nova view |
| `GazetteColumnConfig` | Popover de configuracao de colunas |
| `GazetteKeyboardHelp` | Dialog de atalhos de teclado |

### Componentes Shared Reutilizados

- `GlassPanel` (depth 1, 2, 3)
- `Heading` (page, section, widget)
- `Text` (label, caption, meta-label, micro-caption, kpi-value)
- `SemanticBadge` (tribunal, status, tipo)
- `EmptyState`
- `DataShell`, `DataTable`, `DataPagination`
- `DateRangePicker`
- `Combobox`
- `IconContainer` (md, sm)
- `TabPills`

---

## 15. Referencias de Design

| Referencia | Padrao Usado |
|-----------|-------------|
| Stripe Dashboard | KPIs interativos que filtram tabela |
| Linear | Calm density, triage view, detail panel slide-in, keyboard-first |
| Notion Databases | Views como presets, filtros composáveis, inline editing |
| QuickBooks Reconciliation | Split-panel orfaos com confidence scores |
| Gmail / Google Chat | Chip-based filters progressivos |
| Slack Enterprise Search | Operadores de busca com autocomplete |
| Intercom Inbox | Context panel ao lado da conversa |
| WhatsApp / JusBrasil | Legal publication cards com metadata |
