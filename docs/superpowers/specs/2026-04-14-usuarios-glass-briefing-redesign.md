# Spec: Redesign do Módulo de Usuários — Glass Briefing

**Data:** 2026-04-14
**Módulo:** `src/app/(authenticated)/usuarios/`
**Status:** Aprovado (brainstorming)
**Renomeação:** "Equipe" → "Usuários"

---

## 1. Visão Geral

Redesign completo do módulo de usuários para alinhar ao Design System Glass Briefing, já implementado em Audiências, Processos e Expedientes. Inclui migração visual de todos os componentes, introdução de 3 view modes (Grid, Lista, Organograma), layout two-column no perfil do usuário, e novas features (activity heatmap, profile completeness, role presets, department grouping).

### Escopo

- **Visual:** Migração completa para Glass Briefing (GlassPanel, Heading, Text, SearchInput, ViewToggle, TabPills, EmptyState, InsightBanner)
- **Features novas:** Activity heatmap, profile completeness ring, organograma hierárquico, role presets, department grouping, status dot, diff visual de permissões
- **Arquitetura:** Hybrid (unified client + lazy-loaded views)
- **Zero regressão:** Todas as funcionalidades existentes mantidas

### Decisões de Design Aprovadas

| Decisão | Escolha |
|---------|---------|
| View modes na listagem | Grid + Lista + Organograma |
| Header do perfil | Two-Column (Sidebar + Content) |
| Nível de features | Full Feature Pack (Visual + Enhancements + Features) |
| Arquitetura | Hybrid (Unified Client + Lazy Views) |

---

## 2. Página de Listagem (`/usuarios`)

### 2.1 Estrutura Vertical

```
┌─ HEADER ──────────────────────────────────────────────────┐
│  Heading level="page" → "Usuários"                        │
│  Subtitle dinâmico: "18 membros · 15 ativos · 3 cargos"  │
│  Actions: [Cargos (outline)] [+ Novo Usuário (primary)]  │
└───────────────────────────────────────────────────────────┘

┌─ KPI STRIP (GlassPanel depth=2, grid-cols-4) ─────────────┐
│  [Total Membros] [Ativos %] [Advogados OAB] [Incompletos] │
│  Cada: AnimatedNumber + IconContainer + barra proporção    │
└───────────────────────────────────────────────────────────┘

┌─ INSIGHT BANNER (InsightBanner type="warning") ───────────┐
│  "4 usuários com perfil incompleto — ver quais →"         │
│  Aparece dinamicamente quando há perfis < 70%             │
└───────────────────────────────────────────────────────────┘

┌─ TOOLBAR ─────────────────────────────────────────────────┐
│  Left: TabPills [Todos|Ativos|Inativos|Com OAB] + Cargo▾ │
│  Right: SearchInput + ViewToggle [Grid|Lista|Organograma] │
└───────────────────────────────────────────────────────────┘

┌─ CONTENT AREA ────────────────────────────────────────────┐
│  GridView | ListaView | OrganigramaView (lazy)            │
└───────────────────────────────────────────────────────────┘
```

### 2.2 KPI Strip — Métricas

| Métrica | Ícone | Cor | Cálculo |
|---------|-------|-----|---------|
| Total Membros | Users | primary | `usuarios.length` |
| Ativos | CheckCircle | success | `usuarios.filter(u => u.ativo).length` + % |
| Advogados OAB | Scale | info | `usuarios.filter(u => u.oab).length` + % |
| Perfis Incompletos | AlertTriangle | warning | `usuarios.filter(u => completeness(u) < 70).length` + % |

### 2.3 InsightBanner — Triggers

- Perfis incompletos (< 70% completeness) → `type="warning"`
- Erro de carregamento → `type="alert"`

### 2.4 Toolbar

- **TabPills:** Todos (total), Ativos (count), Inativos (count), Com OAB (count)
- **FilterPopover:** Cargo (dropdown com lista de cargos)
- **SearchInput:** Busca em nome_completo, nome_exibicao, cpf, email_corporativo
- **ViewToggle:** Grid (LayoutGrid icon), Lista (List icon), Organograma (GitBranch icon)

---

## 3. Grid View

### 3.1 Layout

- Grid: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3`
- Agrupamento por cargo: toggle ativável, seções colapsáveis

### 3.2 Department Grouping

- Header colapsável em `GlassPanel depth={1}`
- Barra de cor do cargo no lado esquerdo (4px)
- Nome do departamento + contagem de membros + avatar stack (primeiros 5)
- Chevron para colapsar/expandir
- Toggle "Agrupar por Cargo" na toolbar ou como opção no ViewToggle

### 3.3 Card de Usuário Redesenhado

```
┌─ GlassPanel depth=1 ─────────────────────────┐
│  ┌─ Mini-Banner (56px) ──────────────────────┐│
│  │  Gradient por cor do cargo                ││
│  │  [Completeness % badge] (canto superior)  ││
│  └───────────────────────────────────────────┘│
│                                               │
│  [Avatar 52px]  ← Overlapping banner -28px    │
│   └─ Status dot (online/away/offline)         │
│   └─ Completeness ring SVG (ao redor)         │
│                                               │
│  Nome Completo [🛡 se Super Admin]            │
│  email@zattar.adv.br                          │
│                                               │
│  [Role Badge cor] [OAB Badge se aplicável]    │
│                                               │
│  ── border-top ──                             │
│  [Processos: 24] [Audiências: 8] [Pend: 12]  │
└───────────────────────────────────────────────┘
```

### 3.4 Cores dos Banners por Cargo

| Cargo | Gradient |
|-------|----------|
| Diretor | `primary/40 → primary/15` (roxo) |
| Advogado | `info/35 → info/12` (azul) |
| Estagiário | `success/35 → success/12` (verde) |
| Secretária | `warning/35 → warning/12` (laranja) |
| Sem cargo | `border/10 → border/04` (neutro) |
| Inativo | Grayscale + opacity 55% |

### 3.5 Card Inativo

- Opacity 55% no card inteiro
- Banner com `filter: grayscale(1)`
- Avatar monocromático
- Badge "Inativo" no canto superior direito (destructive glass)
- Stats zerados em cor dim

### 3.6 Interações do Card

- **Click:** Navega para `/usuarios/[id]`
- **Hover:** `translateY(-2px)` + box-shadow + border highlight
- **Keyboard:** `role="button"` + `tabIndex={0}` + Enter/Space

---

## 4. Lista View

### 4.1 Componentes

- `DataShell` com header (toolbar) + footer (pagination)
- `DataTable` com colunas sortáveis

### 4.2 Colunas

| Coluna | Conteúdo | Sortável |
|--------|----------|----------|
| Usuário | Avatar (34px) + status dot + nome + email | Sim (por nome) |
| Cargo | Badge com cor do cargo | Sim |
| OAB | Badge `⚖ 123.456/SP` ou `—` | Não |
| Status | Badge Ativo (success) / Inativo (destructive) | Sim |
| Processos | Contagem numérica (tabular-nums, bold) | Sim |
| Perfil | Completeness bar (48px) + percentual | Sim |
| Ações | Botões ícone: Ver perfil, Editar (ou Reativar se inativo) | Não |

### 4.3 Comportamento

- Linhas inativas com opacity 50%
- Pagination via `TablePagination` (50 por página)
- Click na linha → navega para perfil

---

## 5. Organograma View

### 5.1 Estrutura

- Container: `GlassPanel depth={1}` com `overflow-x: auto`
- Lazy-loaded via `React.lazy` + `Suspense`
- Árvore SVG com nodes clicáveis

### 5.2 Nodes

- Cada nó: card glass com avatar, nome, cargo, stats compactas
- Nó root (maior hierarquia): borda `primary`, visualmente destacado
- Badge de contagem de membros diretos no canto

### 5.3 Hierarquia

- **Implementação inicial (v1):** Agrupamento flat por cargo (Diretores → Advogados → Estagiários → Secretárias) sem relação pai-filho, empilhado por nível hierárquico. Não requer alteração no banco de dados.
- **Evolução futura (v2):** Se um campo `supervisor_id` (FK para `usuarios.id`) for adicionado à tabela `usuarios`, o organograma pode renderizar árvore de relação pai-filho real. Essa evolução está fora do escopo desta spec.

### 5.4 Controles

- Zoom in/out + fit-to-screen + fullscreen
- Pan & drag para navegação
- Click no nó → navega para `/usuarios/[id]`

### 5.5 Performance

- Lazy-loaded (view mais pesada, tem lógica de layout de árvore)
- Suspense fallback: skeleton com 3 nodes placeholder

---

## 6. Perfil do Usuário (`/usuarios/[id]`)

### 6.1 Layout Two-Column

```
┌─────────────────────────────────────────────────────────┐
│  ┌─── Sidebar (300px, sticky) ───┐  ┌─── Content ────┐ │
│  │  Cover photo (gradient glass) │  │  ← Breadcrumb   │ │
│  │  Avatar + ring + status dot   │  │  TabPills        │ │
│  │  Nome, Cargo                  │  │                  │ │
│  │  Badges (Ativo, Admin, OAB)   │  │  [Tab Content]   │ │
│  │  ── Contatos ──               │  │                  │ │
│  │  Email, Telefone, Ramal       │  │                  │ │
│  │  Cadastro, Atualização        │  │                  │ │
│  │  ── Completeness ──           │  │                  │ │
│  │  Barra + Checklist            │  │                  │ │
│  │  ── Quick Actions ──          │  │                  │ │
│  │  [Editar] [Senha] [Desativar] │  │                  │ │
│  └───────────────────────────────┘  └──────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

- **Desktop:** Grid `grid-cols-[300px_1fr]` com sidebar sticky
- **Mobile:** Stack vertical (sidebar → content)

### 6.2 Sidebar

#### Cover Photo

- Gradient glass default (cor do cargo) ou imagem customizável
- Botão "Editar" no canto → abre `CoverEditDialog` (já existe)
- Altura: 100px

#### Avatar Section

- Avatar 88px com completeness ring SVG (circunda o avatar)
- Status dot baseado no último login (auth logs):
  - **Online (verde):** último login < 15 minutos
  - **Away (amarelo):** último login < 2 horas
  - **Offline (cinza):** último login > 2 horas ou nunca logou
  - Nota: NÃO é presença real-time via WebSocket — é baseado nos auth logs já existentes
- Hover → overlay escuro com ícone de câmera → abre `AvatarEditDialog`

#### Info & Badges

- Nome (`font-size: 18px, font-weight: 700`)
- Cargo (`font-size: 12px, text-dim`)
- Badges: Ativo/Inativo (success/destructive), Super Admin (destructive), OAB (info)

#### Contatos

- Email corporativo, telefone, ramal
- Data de cadastro, última atualização
- Cada item: ícone Lucide + valor

#### Profile Completeness

- Barra de progresso horizontal + percentual
- Checklist de itens:
  - Avatar enviado (check avatarUrl)
  - OAB preenchida (check oab && ufOab, se cargo advogado/diretor)
  - Telefone adicionado (check telefone)
  - Endereço completo (check endereco com campos principais)
  - Email pessoal (check emailPessoal)
- Items completos: `✓` verde + line-through
- Items pendentes: `○` warning + texto warning

#### Quick Actions

- **Editar Perfil** → abre `UsuarioEditDialog` (primary glass button)
- **Redefinir Senha** → abre `RedefinirSenhaDialog` (outline button)
- **Desativar Usuário** → confirma e desativa (danger button, com alert de desatribuição)

### 6.3 Content Tabs

#### Tab: Visão Geral

- **KPI Cards** (4 cards, `GlassPanel depth={2}`):
  - Processos (link para `/processos?responsavel=id`)
  - Audiências (link para `/audiencias?responsavel=id`)
  - Pendentes (link para `/expedientes?responsavel=id`)
  - Contratos (link para `/contratos?responsavel=id`)
- **Activity Heatmap** (`GlassPanel depth={1}`):
  - SVG grid 26 semanas x 7 dias (6 meses)
  - Cores: transparent → primary/15 → primary/30 → primary/50 → primary/75
  - Tooltip no hover: data + contagem de ações
  - Legenda: "Menos" → "Mais"
  - Dados: necessária nova action `actionBuscarHeatmapAtividades(usuarioId, meses)` que retorna `{ date: string, count: number }[]` agrupado por dia. A action existente `actionBuscarAtividadesUsuario` retorna lista paginada — não serve para o heatmap diretamente

#### Tab: Dados Cadastrais

- `GlassPanel depth={1}` com seções:
  - **Informações Pessoais** — grid 3 colunas (nome, CPF, RG, nascimento, gênero)
  - **Contato** — grid 2 colunas (emails, telefone, ramal)
  - **Profissional** — cargo, OAB, UF OAB
  - **Endereço** — full-width
- Cada campo: label `Text variant="meta-label"` + valor `text-sm`

#### Tab: Atividades

- **KPI Cards** (reutiliza AtividadesCards com glass treatment)
- **Atividades Recentes** (reutiliza AtividadesRecentes com glass timeline)

#### Tab: Permissões (Redesenhada)

- **Role Presets:** Dropdown no topo para aplicar template de permissões pré-definido por cargo
- **Layout:** Grid sem accordion — grupos em `GlassPanel depth={1}` com toggle switches
- **Toggle switches** em vez de checkboxes (mais visual)
- **Diff indicators:** Dot amarelo no canto de permissões alteradas mas não salvas
- **Contagem por grupo:** Badge colorido (verde=full, azul=parcial, cinza=nenhuma)
- **Ações:** Botões "Salvar" e "Resetar" no topo quando `hasChanges`
- **Super Admin:** Alert glass informando que todas as permissões estão implícitas

#### Tab: Segurança

- **Credenciais de Acesso** — `GlassPanel depth={1}` com botão "Redefinir Senha"
- **Auth Timeline** — Timeline vertical com cards glass por evento:
  - Login (success), Logout (warning), Sessão renovada (info), Falha (destructive)
  - Cada card: ícone + label + tempo relativo + detalhes (IP, device)
- **Super Admin Toggle** — `GlassPanel depth={1}` com Switch (visível apenas para super admins logados)

---

## 7. Dialogs

### 7.1 Criar Usuário (UsuarioCreateDialog)

- Mantém `DialogFormShell`
- Adicionar wizard 3 steps: Dados Pessoais → Contato & Profissional → Endereço
- Progress stepper no topo (step dots com labels)
- Campo de senha com indicador de força
- Busca CEP com auto-preenchimento (migrar da edição)

### 7.2 Editar Usuário (UsuarioEditDialog)

- Mantém `DialogFormShell maxWidth="4xl"`
- Trocar `<select>` nativo por `Select` shadcn/ui (campo gênero)
- Seções com `GlassPanel depth={1}` em vez de `border-t`
- Alert de desativação mais visual (glass destructive)

### 7.3 Gerenciar Cargos (CargosManagementDialog)

- Mantém layout 2 colunas em `DialogFormShell`
- Cada cargo na lista com preview da cor do banner
- Adicionar campo de cor (color picker para gradient do cargo)
- Badge de contagem de usuários por cargo
- Empty state com ícone Glass Briefing

---

## 8. Novos Componentes

| Componente | Localização | Descrição |
|------------|-------------|-----------|
| `UserCompletenessRing` | `usuarios/components/shared/` | SVG ring reutilizável (card, sidebar, tabela) |
| `UserStatusDot` | `usuarios/components/shared/` | Status dot com animação pulse para online |
| `RoleBanner` | `usuarios/components/shared/` | Mini-banner gradient por cargo |
| `ActivityHeatmap` | `usuarios/components/activities/` | Heatmap SVG 26x7 com tooltip |
| `OrgChart` | `usuarios/components/list/` | Árvore hierárquica com zoom/pan (lazy) |
| `PermissionToggle` | `usuarios/components/permissions/` | Toggle switch com diff indicator |
| `RolePresetSelect` | `usuarios/components/permissions/` | Dropdown de templates de permissão |
| `UserKpiStrip` | `usuarios/components/list/` | Strip de métricas para a página de listagem |
| `UsuariosListView` | `usuarios/components/list/` | DataTable view com colunas configuradas |

---

## 9. Empty States

| Contexto | Ícone | Título | Descrição | Ação |
|----------|-------|--------|-----------|------|
| Grid sem busca | Users | Nenhum usuário cadastrado | Crie o primeiro membro da equipe | [+ Novo Usuário] |
| Grid com busca | SearchX | Nenhum resultado | Tente ajustar os filtros ou busca | [Limpar busca] |
| Organograma vazio | GitBranch | Sem hierarquia | Cadastre cargos para visualizar | [Gerenciar Cargos] |
| Heatmap vazio | BarChart3 | Sem atividade | Nenhuma atividade nos últimos 6 meses | — |
| Permissões (Super Admin) | Info (alert) | Acesso total | Todas as permissões implícitas | — |
| Auth logs vazio | Clock | Nenhum log | Sem registros de autenticação | — |

---

## 10. Profile Completeness — Regras de Cálculo

Cada item vale um peso igual. Score = itens completos / total de itens × 100.

| Item | Condição de Completude |
|------|----------------------|
| Avatar | `avatarUrl !== null` |
| OAB | `oab && ufOab` (apenas se cargo é advogado/diretor) |
| Telefone | `telefone !== null` |
| Endereço | `endereco?.logradouro && endereco?.cidade && endereco?.estado` |
| Email pessoal | `emailPessoal !== null` |
| Data nascimento | `dataNascimento !== null` |
| RG | `rg !== null` |

- Verde (>= 70%): ring `--success`
- Amarelo (30-69%): ring `--warning`
- Vermelho (< 30%): ring `--destructive`

---

## 11. Arquitetura de Componentes

```
src/app/(authenticated)/usuarios/
├── page.tsx                          # Server component (renomear título)
├── layout.tsx                        # PageShell wrapper
├── components/
│   ├── usuarios-client.tsx           # REWRITE — Unified client (Grid/Lista/Org)
│   ├── list/
│   │   ├── usuarios-grid-view.tsx    # REWRITE — Grid com GlassPanel + grouping
│   │   ├── usuarios-list-view.tsx    # NEW — DataTable view
│   │   ├── usuarios-org-view.tsx     # NEW — Organograma (lazy-loaded)
│   │   ├── user-kpi-strip.tsx        # NEW — KPI metrics strip
│   │   ├── usuarios-toolbar.tsx      # NEW — TabPills + Filters + Search + ViewToggle
│   │   └── ...existing filters...
│   ├── shared/
│   │   ├── usuario-card.tsx          # REWRITE — Card com Glass + banner + ring
│   │   ├── user-completeness-ring.tsx # NEW — SVG ring component
│   │   ├── user-status-dot.tsx       # NEW — Status dot component
│   │   └── role-banner.tsx           # NEW — Mini-banner gradient
│   ├── detail/
│   │   ├── usuario-view-sheet.tsx    # DEPRECATE (replaced by perfil page)
│   │   └── ...
│   ├── forms/
│   │   ├── usuario-create-dialog.tsx # UPDATE — Wizard steps
│   │   ├── usuario-edit-dialog.tsx   # UPDATE — Glass sections
│   │   └── ...
│   ├── permissions/
│   │   ├── permissoes-matriz.tsx     # REWRITE — Toggles + presets + diff
│   │   ├── permission-toggle.tsx     # NEW — Toggle switch component
│   │   └── role-preset-select.tsx    # NEW — Preset dropdown
│   ├── activities/
│   │   ├── atividades-cards.tsx      # UPDATE — Glass treatment
│   │   ├── atividades-recentes.tsx   # UPDATE — Glass timeline
│   │   └── activity-heatmap.tsx      # NEW — GitHub-style heatmap
│   ├── logs/
│   │   └── auth-logs-timeline.tsx    # UPDATE — Glass cards
│   ├── cargos/
│   │   └── cargos-management-dialog.tsx # UPDATE — Color picker + counts
│   └── avatar/
│       └── avatar-edit-dialog.tsx    # KEEP (já funcional)
├── [id]/
│   ├── page.tsx                      # KEEP
│   └── usuario-detalhes.tsx          # REWRITE — Two-column layout
└── ...domain, service, hooks, actions (KEEP)
```

---

## 12. Componentes Shared Reutilizados

| Componente | Import | Uso |
|------------|--------|-----|
| `GlassPanel` | `@/components/shared/glass-panel` | Cards, panels, containers |
| `Heading` | `@/components/ui/typography` | Títulos (page, section, card) |
| `Text` | `@/components/ui/typography` | Labels, captions, meta-labels |
| `SearchInput` | `@/components/dashboard/search-input` | Toolbar busca |
| `ViewToggle` | `@/components/dashboard/view-toggle` | Grid/Lista/Org switch |
| `TabPills` | `@/components/dashboard/tab-pills` | Filtros + tabs do perfil |
| `PulseStrip` | `@/components/dashboard/pulse-strip` | KPI strip |
| `InsightBanner` | `@/components/dashboard/insight-banner` | Alertas contextuais |
| `EmptyState` | `@/components/shared/empty-state` | Empty states |
| `DataShell` | `@/components/shared/data-shell` | Container da lista |
| `DataTable` | `@/components/shared/data-shell` | Tabela sortável |
| `IconContainer` | `@/components/shared/icon-container` | Ícone containers |
| `DialogFormShell` | `@/components/shared/dialog-shell` | Dialogs |
| `AnimatedNumber` | `@/components/dashboard/animated-number` | KPI animados |

---

## 13. Responsividade

| Breakpoint | Listagem | Perfil |
|------------|----------|--------|
| Mobile (<640px) | Grid 1 col, toolbar stacks, ViewToggle scrollável | Sidebar → stacked above content |
| Tablet (640-1024px) | Grid 2 cols | Sidebar 260px + content |
| Desktop (1024-1280px) | Grid 3 cols | Sidebar 300px + content |
| Wide (>1280px) | Grid 4 cols | Sidebar 300px + content |

---

## 14. Mockups Visuais

Os mockups HTML aprovados durante o brainstorming estão em:
- `.superpowers/brainstorm/21968-1776117511/content/section1-listing-page.html`
- `.superpowers/brainstorm/21968-1776117511/content/section2-grid-view.html`
- `.superpowers/brainstorm/21968-1776117511/content/section3-lista-organograma.html`
- `.superpowers/brainstorm/21968-1776117511/content/section4-perfil-usuario.html`
