# Plano de Refatoração — Novo Website + Portal Magistrate AI

> **Objetivo:** Converter 24 protótipos HTML estáticos em páginas React/Next.js 16, integradas ao projeto existente (Zattar OS), normalizando componentes, cores e branding conforme o `design-system.md`.

---

## Inventário: O Que Já Existe vs. O Que Precisa Ser Feito

### Stack Atual do Projeto

| Camada | Tecnologia | Status |
|--------|-----------|--------|
| Framework | Next.js 16 + React 19 + TypeScript | OK |
| CSS | Tailwind CSS 4 + CSS Variables | OK, precisa estender tokens |
| Componentes | shadcn/ui (new-york) + Radix UI | OK |
| Ícones | Lucide React | OK (protótipos usam Material Symbols → converter) |
| Fontes | Inter, Montserrat, Manrope, Geist Mono | OK (manter todas) |
| Auth | Supabase Auth | OK |
| DB | Supabase PostgreSQL + RLS | OK |
| Charts | Recharts | OK |
| Animações | Framer Motion | OK |

### Tokens Já Configurados em `globals.css`

Os tokens MD3 (surface-*, on-surface-*, primary-container, etc.) **já existem** em `:root`. Apenas faltam alguns tokens de efeito e refinamentos.

### Componentes Já Existentes

| Componente | Localização | Status |
|-----------|------------|--------|
| PortalShell | `src/features/portal/components/layout/portal-shell.tsx` | Existe, precisa refinamento |
| PortalSidebar | `src/features/portal/components/layout/sidebar.tsx` | Existe, já usa Lucide |
| PortalHeader | `src/features/portal/components/layout/header.tsx` | Existe, precisa refinamento |
| Website Header | `src/features/website/components/layout/header.tsx` | Existe, precisa substituir |
| Website Footer | `src/features/website/components/layout/footer.tsx` | Existe, precisa substituir |
| HomePage | `src/features/website/components/home-page.tsx` | Existe, precisa substituir |
| Hero | `src/features/website/components/home/hero.tsx` | Existe, precisa substituir |
| Website UI | `src/components/website/ui/` | Existe, precisa avaliar |

---

## Decisões Arquiteturais

### D1: Ícones — Lucide React (NÃO Material Symbols)

Os protótipos usam `material-symbols-outlined`. O projeto usa **Lucide React**. Toda conversão deve mapear ícones Material → Lucide equivalentes.

| Material Symbol | Lucide Equivalent |
|----------------|-------------------|
| `dashboard` | `LayoutDashboard` |
| `description` | `FileText` |
| `gavel` | `Gavel` |
| `calendar_today` | `Calendar` |
| `payments` | `CreditCard` |
| `person` | `User` |
| `settings` | `Settings` |
| `search` | `Search` |
| `notifications` | `Bell` |
| `chat_bubble` | `MessageCircle` |
| `add` | `Plus` |
| `help` | `HelpCircle` |
| `logout` | `LogOut` |
| `arrow_forward` | `ArrowRight` |
| `chevron_right` | `ChevronRight` |
| `trending_up` | `TrendingUp` |
| `check_circle` | `CheckCircle` |
| `schedule` | `Clock` |
| `verified` | `BadgeCheck` |
| `lock` | `Lock` |
| `security` | `Shield` |
| `upload_file` | `Upload` |
| `bookmark` | `Bookmark` |
| `edit` | `Pencil` |
| `more_vert` | `MoreVertical` |
| `expand_more` | `ChevronDown` |
| `open_in_new` | `ExternalLink` |
| `auto_awesome` | `Sparkles` |
| `terminal` | `Terminal` |
| `troubleshoot` | `ScanSearch` |
| `query_stats` | `BarChart3` |
| `hub` | `Network` |
| `bolt` | `Zap` |
| `video_chat` | `Video` |
| `support_agent` | `Headphones` |
| `account_balance_wallet` | `Wallet` |
| `add_circle` | `PlusCircle` |
| `calendar_add_on` | `CalendarPlus` |
| `event_available` | `CalendarCheck` |
| `note_add` | `FilePlus` |
| `cloud_upload` | `CloudUpload` |
| `article` | `Newspaper` |
| `link` | `Link` |
| `speed` | `Gauge` |
| `calculate` | `Calculator` |
| `enhanced_encryption` | `ShieldCheck` |

### D2: Branding — "Zattar" (NÃO "Magistrate AI" / "Neon Magistrate")

Os protótipos usam nomes placeholder. Na implementação real:

| Protótipo | Projeto Real |
|-----------|-------------|
| "Magistrate AI" | "Zattar" (ou nome definido pelo cliente) |
| "Neon Magistrate" | "Zattar Portal" |
| "Tech-Legal Elite" | Subtítulo a definir com o cliente |
| Logo texto | Logo SVG de `/public/logos/logomarca-dark.svg` |

### D3: Componentes — Reutilizar shadcn/ui

Não reconstruir componentes do zero. Usar a biblioteca existente:

| Protótipo (HTML) | Implementação (React) |
|-------------------|----------------------|
| `<button class="bg-primary...">` | `<Button variant="default">` com estilos customizados |
| `<input class="bg-surface...">` | `<Input>` do shadcn com overrides |
| Tabelas raw HTML | `<DataTable>` + `DataShell` pattern existente |
| Cards raw HTML | `<Card>` do shadcn com classes do design system |
| Accordion FAQ | `<Accordion>` do shadcn |
| Badges | `<Badge>` do shadcn com variantes customizadas |
| Tabs | `<Tabs>` do shadcn |
| Dialog/Modal | `<Dialog>` do shadcn |
| Toggle | `<Switch>` do shadcn |
| Select | `<Select>` do shadcn |
| Toast | `sonner` (já instalado) |

### D4: Layout — Duas Shells Distintas

| Contexto | Shell | Layout |
|----------|-------|--------|
| Website Público | `WebsiteShell` | Floating nav + content + footer |
| Portal do Cliente | `PortalShell` | Sidebar + top bar + content |
| App Interno | `CopilotDashboard` (existente) | Sidebar shadcn + content |

### D5: Dados — Protótipos → Dados Reais via Supabase

Cada página protótipo tem dados hardcoded. Na implementação:
- Server Components fazem fetch no Supabase
- Client Components recebem dados via props
- Loading states com skeletons
- Error boundaries

---

## Fases de Implementação

### FASE 0: Fundação — Tokens & Utilitários CSS (1-2 dias)

**Objetivo:** Garantir que todos os tokens do design system estejam disponíveis no projeto.

#### 0.1 Atualizar `globals.css`

Os tokens MD3 já existem. Falta adicionar:

```
Adicionar em globals.css:
- .glass-card (classe utilitária global)
- .glass-panel (classe utilitária global)
- .text-gradient (classe utilitária global)
- .neon-glow / .neon-text-glow (classe utilitária global)
- .gradient-border (classe utilitária global)
- .sidebar-active (classe utilitária)
- .no-scrollbar (classe utilitária)
- selection styling (já pode estar, verificar)
```

#### 0.2 Verificar tokens faltantes

Comparar design-system.md (seção Tailwind Config) com `globals.css` `:root` e `@theme inline`. Tokens que faltam no `@theme inline`:

```
Verificar se existem mapeamentos para:
- --color-surface-tint (pode faltar)
- --color-primary-dim (pode faltar)
- --color-secondary-dim (pode faltar)
- --color-tertiary-dim (pode faltar)
- --color-error-dim (pode faltar)
- --color-inverse-primary (pode faltar)
```

#### 0.3 Confirmar fontes

Verificar em `src/app/layout.tsx` se Manrope está importada com pesos 400, 500, 700, 800 e Inter com 300, 400, 500, 600.

#### 0.4 Logo

Confirmar que `/public/logos/logomarca-dark.svg` existe e é adequado. Se necessário, criar versão "small" para sidebar.

**Entregável:** `globals.css` atualizado, todos os tokens do design system disponíveis.

---

### FASE 1: Componentes Compartilhados do Website (3-5 dias)

**Objetivo:** Criar/atualizar os componentes reutilizáveis do novo website e portal.

#### 1.1 Website Layout Components

| Componente | Arquivo | Descrição |
|-----------|---------|-----------|
| `FloatingNav` | `src/features/website/components/layout/floating-nav.tsx` | Navbar flutuante glassmórfica (novo) |
| `WebsiteFooter` | `src/features/website/components/layout/footer.tsx` | Footer editorial (substituir) |
| `WebsiteShell` | `src/features/website/components/layout/website-shell.tsx` | Shell completo: nav + content + footer (novo) |
| `HeroSection` | `src/features/website/components/sections/hero-section.tsx` | Hero reutilizável com kicker + headline + CTA (substituir) |
| `SectionHeader` | `src/features/website/components/sections/section-header.tsx` | Padrão Kicker → Headline → Body (novo) |
| `GlowBackground` | `src/features/website/components/effects/glow-background.tsx` | Orbs de glow com blur (novo) |
| `TrustTicker` | `src/features/website/components/sections/trust-ticker.tsx` | Logos scrolling (novo) |

#### 1.2 Portal Layout Components (Atualizar)

| Componente | Arquivo | Ação |
|-----------|---------|------|
| `PortalShell` | `src/features/portal/components/layout/portal-shell.tsx` | Refinar (hidden sidebar em mobile) |
| `PortalSidebar` | `src/features/portal/components/layout/sidebar.tsx` | Refinar (adicionar itens faltantes, logo SVG) |
| `PortalHeader` | `src/features/portal/components/layout/header.tsx` | Refinar (search, notificações, avatar) |

#### 1.3 Componentes Compartilhados Novos

| Componente | Arquivo | Descrição |
|-----------|---------|-----------|
| `GlassCard` | `src/components/website/glass-card.tsx` | Card glassmórfico reutilizável |
| `BentoGrid` | `src/components/website/bento-grid.tsx` | Grid bento 12-col configurable |
| `StatCard` | `src/components/website/stat-card.tsx` | Card de estatística com ícone + valor |
| `EditorialHeader` | `src/components/website/editorial-header.tsx` | Header de página portal: kicker + title + actions |
| `FilterChips` | `src/components/website/filter-chips.tsx` | Grupo de chips de filtro |
| `ActivityItem` | `src/components/website/activity-item.tsx` | Item de feed de atividade |
| `TimelineEntry` | `src/components/website/timeline-entry.tsx` | Entrada de timeline |
| `FeatureCard` | `src/components/website/feature-card.tsx` | Card de feature com ícone + descrição |
| `ArticleCard` | `src/components/website/article-card.tsx` | Card de artigo com imagem + overlay |

**Entregável:** Biblioteca de ~15 componentes prontos para uso nas páginas.

---

### FASE 2: Páginas Públicas do Website (5-7 dias)

**Objetivo:** Implementar as 9 páginas públicas, substituindo as existentes.

#### Ordem de implementação (por dependência)

| # | Página | Rota | Protótipo Base | Ação |
|---|--------|------|---------------|------|
| 1 | **Home** | `/` | `p_gina_inicial_magistrado_ai_v2` | SUBSTITUIR `src/features/website/components/home-page.tsx` |
| 2 | **Solutions** | `/solucoes` | `solutions_magistrate_ai` | SUBSTITUIR `src/app/solucoes/page.tsx` |
| 3 | **Services** | `/servicos` | `servi_os_magistrate_ai` | SUBSTITUIR `src/app/servicos/page.tsx` |
| 4 | **Expertise** | `/expertise` | `expertise_magistrate_ai` | SUBSTITUIR `src/app/expertise/page.tsx` |
| 5 | **Insights** | `/insights` | `insights_magistrate_ai_1` + `_2` | SUBSTITUIR `src/app/insights/page.tsx` |
| 6 | **FAQ** | `/faq` | `perguntas_frequentes_magistrate_ai` | SUBSTITUIR `src/app/faq/page.tsx` |
| 7 | **Contact** | `/contato` | `contact_magistrate_ai` | SUBSTITUIR `src/app/contato/page.tsx` |
| 8 | **Home v1** (alternativa) | — | `p_gina_inicial_advocacia_trabalhista` | AVALIAR se será usado ou descartado |
| 9 | **Vanguard Legal** | — | `vanguard_legal` | AVALIAR se será usado ou descartado |

#### Para cada página:

1. Ler protótipo HTML correspondente
2. Mapear seções para componentes React (reutilizar os da Fase 1)
3. Converter Material Symbols → Lucide icons
4. Substituir dados hardcoded por props (Server Component)
5. Aplicar tokens do design system (classes CSS variáveis, não hardcoded)
6. Substituir "Magistrate AI" → logo/nome real
7. Testar responsividade: 375px, 768px, 1024px, 1440px
8. Verificar acessibilidade (alt, labels, focus, contrast)

**Entregável:** 7+ páginas públicas finalizadas, visual do design system aplicado.

---

### FASE 3: Portal do Cliente (7-10 dias)

**Objetivo:** Implementar as 12 páginas do portal do cliente.

#### Ordem de implementação

| # | Página | Rota | Protótipo Base | Ação |
|---|--------|------|---------------|------|
| 1 | **Dashboard** | `/portal/dashboard` | `dashboard_vibrante_magistrate_ai` (primário) + `dashboard_do_cliente` + `dashboard_din_mico` | SUBSTITUIR |
| 2 | **Meus Processos** | `/portal/processos` | `meus_processos_magistrate_ai` | SUBSTITUIR |
| 3 | **Timeline de Processos** | `/portal/processos/[id]` | `acompanhamento_de_processos_com_timeline_magistrate_ai` + `timeline_de_processos` | NOVO (detail page) |
| 4 | **Agendamentos** | `/portal/agendamentos` | `agendamentos_magistrate_ai` | SUBSTITUIR |
| 5 | **Financeiro** | `/portal/financeiro` | `financeiro_magistrate_ai` | SUBSTITUIR |
| 6 | **Contratos** | `/portal/contratos` | `gest_o_de_contratos_magistrate_ai` | SUBSTITUIR |
| 7 | **Serviços & Contratos** | `/portal/contratos/servicos` | `servi_os_e_contratos_magistrate_ai` | NOVO |
| 8 | **Gerador de Contratos** | `/portal/contratos/gerador` | `gerador_de_contratos_magistrate_ai` | SUBSTITUIR |
| 9 | **Perfil** | `/portal/perfil` | `meu_perfil_magistrate_ai` | SUBSTITUIR |
| 10 | **Insights** | `/portal/insights` | `insights_magistrate_ai_2` | NOVO |

#### Calculadoras (sub-rotas)

| # | Página | Rota | Protótipo | Ação |
|---|--------|------|-----------|------|
| 11 | **Horas Extras** | `/portal/calculadoras/horas-extras` | `calculadora_de_horas_extras` | SUBSTITUIR |
| 12 | **Férias** | `/portal/calculadoras/ferias` | `calculadora_de_f_rias` | SUBSTITUIR |
| 13 | **13º Salário** | `/portal/calculadoras/13-salario` | `calculadora_de_13_sal_rio` | SUBSTITUIR |

#### Para cada página do portal:

1. Ler protótipo HTML correspondente
2. Usar `PortalShell` como layout (sidebar + header automáticos)
3. Decompor em componentes React (StatCard, GlassCard, EditorialHeader, etc.)
4. Converter ícones Material → Lucide
5. Substituir dados mockados por placeholder `// TODO: integrar com Supabase`
6. Usar shadcn/ui para tabelas, formulários, accordions, toasts
7. Implementar loading states com `<Skeleton>` do shadcn
8. Testar responsividade e acessibilidade
9. Marcar para integração futura com backend real

**Entregável:** 13 páginas de portal implementadas com layout consistente.

---

### FASE 4: Normalização & QA (3-4 dias)

**Objetivo:** Garantir consistência visual total entre todas as páginas.

#### 4.1 Auditoria Visual

Para CADA página implementada:

- [ ] Segue a hierarquia de superfícies (surface → surface-container → surface-container-high)
- [ ] Usa tokens CSS variáveis (não hex hardcoded)
- [ ] Ícones são todos Lucide (nenhum Material Symbols remanescente)
- [ ] Logo é a real do projeto (não "Magistrate AI")
- [ ] Tipografia: Manrope para headlines, Inter para body
- [ ] Padrão Kicker → Headline → Body em todas as seções
- [ ] Ghost borders (border-white/5) em vez de borders sólidos
- [ ] Sem emojis como ícones
- [ ] `cursor-pointer` em todos os elementos clicáveis

#### 4.2 Responsividade

Testar todas as páginas em:
- 375px (iPhone SE)
- 390px (iPhone 14)
- 768px (iPad)
- 1024px (laptop)
- 1440px (desktop)
- 1920px (wide)

Portal: sidebar colapsa em mobile, topbar adapta.

#### 4.3 Acessibilidade

- [ ] Contraste mínimo 4.5:1 (WCAG AA)
- [ ] Todos os `<img>` com `alt`
- [ ] Todos os `<input>` com `<label>`
- [ ] `aria-label` em botões icon-only
- [ ] Tab order correto
- [ ] Focus rings visíveis
- [ ] `prefers-reduced-motion` respeitado

#### 4.4 Performance

- [ ] Imagens com `next/image` (WebP, lazy loading, sizes)
- [ ] Componentes pesados com `dynamic()` import
- [ ] Server Components onde possível
- [ ] Sem CSS inline desnecessário

**Entregável:** Todas as páginas auditadas e aprovadas.

---

### FASE 5: Integração com Backend (5-10 dias)

**Objetivo:** Conectar páginas do portal a dados reais do Supabase.

#### 5.1 Portal Dashboard

| Dado | Fonte | Tabela Supabase |
|------|-------|----------------|
| Processos ativos | `processos` | Contagem com filtro status |
| Próximas audiências | `audiencias` | Ordenado por data |
| Saldo financeiro | `financeiro` | Soma de valores |
| Atividade recente | `atividades` ou `logs` | Últimos registros |

#### 5.2 Páginas de Listagem

| Página | Tabela | Operações |
|--------|--------|-----------|
| Meus Processos | `processos` | LIST, FILTER, SEARCH |
| Contratos | `contratos` | LIST, FILTER |
| Financeiro | `contas_receber`, `contas_pagar` | LIST, FILTER, AGGREGATE |
| Agendamentos | `audiencias`, `agendamentos` | LIST, CREATE |

#### 5.3 Calculadoras

As calculadoras são client-side (não precisam de backend). Lógica de cálculo:
- Horas extras: base salário × percentual × horas
- Férias: salário ÷ 12 × meses + 1/3
- 13º salário: salário ÷ 12 × meses trabalhados

#### 5.4 Perfil

| Campo | Tabela |
|-------|--------|
| Dados pessoais | `auth.users` + `clientes` |
| Documentos | `documentos` (Storage) |
| Cofre digital | `documentos` com tag "cofre" |

#### 5.5 Autenticação do Portal

O portal usa CPF como entrada (`/portal` page com hero form). Fluxo:
1. Cliente digita CPF
2. Backend verifica se CPF existe em `clientes`
3. Se sim, cria session e redireciona para `/portal/dashboard`
4. Se não, mostra opção de cadastro

**Entregável:** Portal funcional com dados reais.

---

### FASE 6: Migração & Deploy (2-3 dias)

**Objetivo:** Substituir website antigo pelo novo e deploy.

#### 6.1 Remover páginas antigas

```
Arquivos a remover/substituir:
- src/components/website/hero.tsx (substituído por novo)
- src/components/website/depoimentos.tsx (substituído)
- src/components/website/direitos-essenciais.tsx (substituído)
- src/components/website/etapas-processuais.tsx (substituído)
- src/components/website/quem-somos.tsx (substituído)
- src/components/website/consultoria-empresarial.tsx (substituído)
- src/features/website/components/home/hero.tsx (substituído)
- src/features/website/components/home/services.tsx (substituído)
- src/features/website/components/home/about.tsx (substituído)
- src/features/website/components/home/testimonials.tsx (substituído)
```

#### 6.2 Redirect map

Se URLs mudaram, configurar redirects em `next.config.ts`:

```typescript
redirects: [
  // Adicionar se necessário
]
```

#### 6.3 Smoke test

- [ ] Todas as rotas públicas retornam 200
- [ ] Todas as rotas do portal retornam 200 (com auth)
- [ ] SEO meta tags presentes
- [ ] Open Graph tags corretos
- [ ] Favicon e manifest atualizados
- [ ] Google Analytics/Tag Manager configurado

**Entregável:** Website novo em produção.

---

## Resumo de Esforço

| Fase | Descrição | Estimativa | Dependência |
|------|-----------|-----------|-------------|
| 0 | Fundação (tokens, CSS) | 1-2 dias | — |
| 1 | Componentes compartilhados | 3-5 dias | Fase 0 |
| 2 | Páginas públicas (9) | 5-7 dias | Fase 1 |
| 3 | Portal do cliente (13) | 7-10 dias | Fase 1 |
| 4 | Normalização & QA | 3-4 dias | Fases 2+3 |
| 5 | Integração backend | 5-10 dias | Fase 3 |
| 6 | Migração & deploy | 2-3 dias | Fases 4+5 |
| **Total** | | **26-41 dias** | |

> **Nota:** Fases 2 e 3 podem ser executadas em paralelo após a Fase 1.

---

## Mapeamento Completo: Protótipo → Rota → Arquivo

| # | Protótipo | Rota Final | Arquivo Destino | Tipo |
|---|-----------|-----------|----------------|------|
| 1 | `p_gina_inicial_magistrado_ai_v2` | `/` | `src/app/page.tsx` → feature | SUBSTITUIR |
| 2 | `solutions_magistrate_ai` | `/solucoes` | `src/app/solucoes/page.tsx` | SUBSTITUIR |
| 3 | `servi_os_magistrate_ai` | `/servicos` | `src/app/servicos/page.tsx` | SUBSTITUIR |
| 4 | `expertise_magistrate_ai` | `/expertise` | `src/app/expertise/page.tsx` | SUBSTITUIR |
| 5 | `insights_magistrate_ai_1` | `/insights` | `src/app/insights/page.tsx` | SUBSTITUIR |
| 6 | `insights_magistrate_ai_2` | `/portal/insights` | `src/app/portal/insights/page.tsx` | NOVO |
| 7 | `perguntas_frequentes_magistrate_ai` | `/faq` | `src/app/faq/page.tsx` | SUBSTITUIR |
| 8 | `contact_magistrate_ai` | `/contato` | `src/app/contato/page.tsx` | SUBSTITUIR |
| 9 | `dashboard_vibrante_magistrate_ai` | `/portal/dashboard` | `src/app/portal/dashboard/page.tsx` | SUBSTITUIR |
| 10 | `dashboard_do_cliente_magistrate_ai` | `/portal/dashboard` | (merge com #9) | MERGE |
| 11 | `dashboard_din_mico_do_cliente_magistrate_ai` | `/portal/dashboard` | (merge com #9) | MERGE |
| 12 | `meus_processos_magistrate_ai` | `/portal/processos` | `src/app/portal/processos/page.tsx` | SUBSTITUIR |
| 13 | `acompanhamento_de_processos_com_timeline_magistrate_ai` | `/portal/processos/[id]` | `src/app/portal/processos/[id]/page.tsx` | NOVO |
| 14 | `timeline_de_processos_magistrate_ai` | `/portal/processos/[id]` | (merge com #13) | MERGE |
| 15 | `agendamentos_magistrate_ai` | `/portal/agendamentos` | `src/app/portal/agendamentos/page.tsx` | SUBSTITUIR |
| 16 | `financeiro_magistrate_ai` | `/portal/financeiro` | `src/app/portal/financeiro/page.tsx` | SUBSTITUIR |
| 17 | `gest_o_de_contratos_magistrate_ai` | `/portal/contratos` | `src/app/portal/contratos/page.tsx` | SUBSTITUIR |
| 18 | `servi_os_e_contratos_magistrate_ai` | `/portal/contratos/servicos` | `src/app/portal/contratos/servicos/page.tsx` | NOVO |
| 19 | `gerador_de_contratos_magistrate_ai` | `/portal/contratos/gerador` | `src/app/portal/contratos/gerador/page.tsx` | SUBSTITUIR |
| 20 | `meu_perfil_magistrate_ai` | `/portal/perfil` | `src/app/portal/perfil/page.tsx` | SUBSTITUIR |
| 21 | `calculadora_de_horas_extras_magistrate_ai` | `/portal/calculadoras/horas-extras` | `src/app/portal/calculadoras/horas-extras/page.tsx` | SUBSTITUIR |
| 22 | `calculadora_de_f_rias_magistrate_ai` | `/portal/calculadoras/ferias` | `src/app/portal/calculadoras/ferias/page.tsx` | SUBSTITUIR |
| 23 | `calculadora_de_13_sal_rio_magistrate_ai` | `/portal/calculadoras/13-salario` | `src/app/portal/calculadoras/13-salario/page.tsx` | SUBSTITUIR |
| 24 | `p_gina_inicial_advocacia_trabalhista` | — | AVALIAR: alternativa de home ou descartar | AVALIAR |

---

## Riscos & Mitigações

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Protótipos com inconsistências CSS | Médio | Sempre usar `design-system.md` como fonte de verdade |
| Material Symbols → Lucide sem 1:1 | Baixo | Tabela de mapeamento acima cobre 95% dos casos |
| Imagens dos protótipos (Google CDN) | Alto | Substituir por imagens locais em `/public/images/` |
| Dados hardcoded nos protótipos | Médio | Fase 5 dedicada à integração |
| Responsividade mobile não testada nos protótipos | Alto | Testar obrigatoriamente na Fase 4 |
| Portal sidebar no mobile | Médio | Implementar drawer/sheet mobile |
| SEO impactado por mudança de conteúdo | Médio | Manter mesmas URLs, usar redirects se necessário |
