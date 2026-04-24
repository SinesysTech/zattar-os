# ZattarOS Design System — Glass Briefing

> Design system para o **ZattarOS**, sistema de gestão jurídica corporativa desenvolvido pela **Synthropic** para a Zattar Advogados. Estética "Glass Briefing" — glassmorphism sutil sobre fundação sólida, OKLCH colors ancoradas em hue 281° (Zattar Purple), tipografia Montserrat+Inter.

---

## Sobre o produto

**ZattarOS** é a mesa de trabalho digital de advogados brasileiros. Oferece controle total e visualização do acompanhamento de **processos**, com prazos, audiências, expedientes, perícias, partes, chat interno, portal do cliente, e integração com tribunais (TRT, TST, STJ, STF, TJ-*). Toda a linguagem de negócio é em **PT-BR**.

**Stack**: Next.js 16 (App Router + Turbopack) · React 19 · TypeScript 5 · Supabase (PostgreSQL + RLS + pgvector) · Redis · Tailwind CSS 4 · shadcn/ui (estilo new-york) · Lucide React

**Superfícies do produto**:
1. **Admin (autenticado)** — dashboard jurídico para advogados (cases, calendário, chat, financeiro)
2. **Portal do Cliente** — escopo visual separado (tokens `--portal-*`)
3. **Website público** (`.website-root-scale`) — marketing
4. **Rotas públicas** — assinatura digital por token, formulários públicos

## Fontes de contexto (sources)

- **Repositório**: `SynthropicTechnology/zattar-os` branch `master` — https://github.com/SynthropicTechnology/zattar-os
- **Este arquivo (`README.md`)**: Single Source of Truth narrativa — manifesto, content, visual, iconography
- **Tokens canônicos**: `src/app/globals.css` (226 CSS variables + classes `.glass-*`)
- **Mirror TS**: `src/lib/design-system/tokens.ts`, `token-registry.ts`, `semantic-tones.ts`, `variants.ts`
- **Matriz de tokens**: `design-system/extensions.md` (auto-gerado, 226 tokens documentados)
- **Checklist de auditoria visual**: `design-system/VISUAL-REVIEW.md`
- **Enforcement**: `npm run audit:design-system` (bloqueador no CI)
- **Componentes fundacionais**: `src/components/ui/typography.tsx`, `src/components/shared/glass-panel.tsx`, `brand-mark.tsx`
- **Playground viva**: `src/app/(dev)/library/*` (tokens, badges, shells)
- **Inspiração cruzada**: `uploads/DESIGN-stripe.md` (referência de rigor tipográfico — não copiado)

## Princípios (Manifesto Glass Briefing)

1. **Vidro sobre pedra** — Glassmorphism sutil sobre fundação sólida. Transparência para elegância, nunca para confusão.
2. **Dados primeiro, decoração nunca** — Cada pixel serve informação. Sem badges fake, sem teatro corporativo.
3. **Roxo com propósito** — Zattar Purple `#5523eb` só onde há intenção: CTAs, foco, estados ativos.
4. **Hierarquia por opacidade** — Não multiplicamos cores; modulamos opacidade do mesmo token (ex: `bg-primary/15 → /10 → /8 → /6 → /5 → /4 → /3`).
5. **Mobile-honest** — Responsive real. Escondemos o que não cabe, nunca comprimimos até ilegibilidade.
6. **Tipografia é arquitetura** — Montserrat para títulos, Inter para conteúdo.
7. **Animação é feedback, não espetáculo** — 150–300ms, `transform`/`opacity` apenas. Respeitar `prefers-reduced-motion`.
8. **Tokens > classes > hex** — Semantic tokens vencem utility classes vencem valores literais. Nunca o inverso.

---

## CONTENT FUNDAMENTALS

### Língua e tom
- **Português brasileiro, sempre.** Toda a UI, copy, labels, microcopy, erros, vazios — PT-BR.
- **Profissional-premium, nunca corporativo-frio.** A voz é de um escritório de advocacia sério, com fluência em tecnologia, mas sem arrogância de tech-bro.
- **Direto, conciso, factual.** Advogados consomem dados. Sem floreios, sem "empower your practice" — o produto fala a linguagem de peças, prazos, autos e comarcas.

### Pessoa verbal
- **Você** (informal-formal, padrão BR) — tratamento ao usuário nas ações ("Você pode adicionar…").
- **Imperativo direto** em botões e CTAs ("Adicionar parte", "Cancelar audiência", "Enviar intimação").
- **Terceira pessoa impessoal** em descrições de entidade ("Processos ativos", "Expedientes pendentes").

### Casing
- **Título de página (H1)**: Primeira-maiúscula ("Processos", "Audiências", "Dashboard").
- **Section titles (H2)**: Primeira-maiúscula ("Meus processos ativos").
- **Meta labels / overlines**: **UPPERCASE com tracking 0.14em** ("TRIBUNAL", "RESPONSÁVEL", "LOCALIDADE"). A classe `.text-meta-label` enforça isso.
- **Badges**: UPPERCASE curto ("ATIVO", "SUSPENSO", "CONCLUIDO") — valores do domínio.
- **Botões**: Sentence case ("Adicionar parte", "Salvar alterações") — nunca Title Case, nunca gritando.

### Emoji e iconografia
- **Zero emoji como ícone de UI.** Proibido.
- **Lucide React exclusivamente** como biblioteca de ícones. Uma única biblioteca, sem mistura.
- **Unicode chars não são usados como ícones** — nem `•` decorativo quando existe icon container; nem `→` quando existe `<ArrowRight/>`.

### Vocabulário de domínio (glossário)
| Termo PT-BR | O que é |
|---|---|
| Processo | Legal case |
| Parte / Polo ativo / Polo passivo | Parties to a case |
| Autor / Réu | Plaintiff / Defendant |
| Audiência | Court hearing |
| Expediente | Official notice from the court |
| Prazo | Legal deadline |
| Perícia | Expert examination |
| Tribunal | Court (TRT1, TST, STJ, STF, TJ-MG, etc.) |
| Instância / Grau | Court level (1º grau, 2º grau) |
| CNJ | Conselho Nacional de Justiça |
| Comarca | Judicial district |
| Intimação / Citação / Notificação | Types of official communications |
| Perito / Testemunha / Representante | Third-party actors |
| Parcela / Repasse | Financial installments |
| Assinatura Digital | Electronic signature (Zattar rota pública) |
| Pedrinho | Assistente IA interno (rail lateral direito, não é rota separada) |

### Exemplos reais de copy
- Título de card de processo: `"0001234-56.2024.5.01.0001"` — número CNJ puro, sem prefixo.
- Meta label: `TRIBUNAL` · valor: `TRT1`
- Status badge: `ATIVO`, `SUSPENSO`, `ARQUIVADO`, `CONCLUIDO`, `AGENDADA`, `REALIZADA`, `CANCELADA`
- Empty state: "Nenhum processo cadastrado" · ação: "Adicionar processo" (não "Criar seu primeiro processo!")
- Subtítulo de widget: "Últimas 24h" (não "In the last 24 hours", não "Recent activity").

---

## VISUAL FOUNDATIONS

### Paleta (OKLCH, hue 281° ancorada)

**Brand** — Zattar Purple `oklch(0.48 0.26 281)` ≈ `#5523eb`. Dark mode: `oklch(0.70 0.20 281)` ≈ `#9f85ff`. Orange action `oklch(0.60 0.22 45)` ≈ `#e67e40` é o único accent complementar.

**Neutros** — todos micro-tintados com hue 281° e chroma 0.005–0.01 para coesão cromática. Background light `oklch(0.96 0.01 281)`, cards `oklch(1 0 0)`, borders `oklch(0.87 0.01 281)`.

**Status** — `--success` verde (145°), `--warning` âmbar (75°), `--info` azul (250°), `--destructive` vermelho (25°).

**User Palette** — 18 cores cromaticamente espaçadas (L≈0.65, C=0.18) para tags, labels de evento, cores escolhíveis pelo usuário.

**Event colors** — aliases da palette para semântica jurídica: `--event-audiencia` (azul claro), `--event-expediente` (âmbar), `--event-prazo` (vermelho), `--event-obrigacao` (laranja), `--event-pericia` (violeta), `--event-agenda` (índigo).

**Entity colors** — por tipo de parte jurídica: `--entity-cliente` (primary), `--entity-parte-contraria` (warning), `--entity-terceiro` (info), `--entity-representante` (success).

### Tipografia

- **Inter** (sans) — corpo, forms, tables. `var(--font-sans)`.
- **Montserrat** (heading + display) — títulos, KPIs grandes. `var(--font-heading)`.
- **Manrope** (headline) — headlines em seções especiais e no assistente Pedrinho. `var(--font-headline)`.
- **Geist Mono** — código, números de processo, datas. `var(--font-mono)`.

**Root font-size real no app**: `18px` (não 16!). Todos `rem` são inflados. Para preview web neste projeto, normalizamos em 16px; o CSS final em produção deve usar `html{font-size:18px}`.

Enforcement: usar `<Heading level="page|section|card|subsection|widget">` e `<Text variant="kpi-value|meta-label|caption|label|overline|micro-badge|…">`. Compor `font-heading text-2xl` manualmente é bloqueado por `audit:design-system`.

### Espaçamento (grid 4px)
- Scale: 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64
- **Página**: `p-4 sm:p-6 lg:p-8`, gap `6/8`
- **Card padrão**: `p-4 sm:p-6`, gap `3/4`
- **Card compacto** (kanban, grids densos): `p-3`, gap `2`
- **Dialog**: `p-6`, gap `4`
- **Max-width de página admin**: `1400px` (`max-w-350`)
- **Detail panel**: largura fixa `380px`

### Bordas e raio
- Base `--radius: 0.5rem` (8px), runtime-ajustável via `data-theme-radius`.
- Hierarquia: **2XL (16px)** containers glass/outer · **XL (12px)** cards, botões grandes · **LG (8px)** inputs · **MD (6px)** botões pequenos, badges · **SM (4px)** mínimo · **full** pills/dots.
- **Nunca** raios pill em cards ou botões retangulares.
- **Padrões de borda**: `border-border/20` (sutil padrão), `border-border/30` (depth-2), `border-border/10` (mínima), `border-border/[0.06]` (fantasma).

### Sombras & elevação
- Escala: `shadow-none`, `shadow-sm`, `shadow`, `shadow-md`, `shadow-lg`
- **PROIBIDO**: `shadow-xl`, `shadow-2xl`.
- Sombras glass customizadas em `glass-kpi` / `glass-widget` / `glass-dialog` usam combinação de `box-shadow` externo + `inset` interno para simular brilho de borda em light mode.
- Ambient shadow: `0 20px 40px rgba(0,0,0,0.08)` (`.shadow-ambient`).

### Glass System (o coração do Glass Briefing)
- `.glass-kpi` — bg `rgba(255,255,255,0.70)` light / `0.06` dark, blur 12px. Uso: KPI cards, stats.
- `.glass-widget` — bg `0.62` / `0.04`, blur 16px. Uso: widget containers (padrão).
- `.glass-card` — bg `0.72`, blur 20px. Uso: cards premium.
- `.glass-dialog` — bg `0.92` / `0.92` dark, blur 24px. Uso: modais.
- `.glass-dropdown` — bg `0.95`, blur 20px. Uso: dropdowns com contraste alto.

`<GlassPanel depth>`:
- **depth 1** (default): `glass-widget bg-transparent border-border/20` — containers
- **depth 2**: `glass-kpi bg-transparent border-border/30` — KPIs
- **depth 3**: `bg-primary/[0.04] backdrop-blur-xl border-primary/10` — destaque máximo

Regras:
- Sempre com border sutil (`border-border/20` ou `border-border/30`).
- Sombra inset para "brilho de borda" em light mode.
- **Nunca** `bg-white/10` em light mode (fica invisível — há regra CSS que inverte `bg-white/*` para `rgba(0,0,0,*)` em light automaticamente).
- Floating overlays (popovers, dropdowns, tooltips) removem `backdrop-filter` automaticamente via `[data-slot]` rules.

### Animações
- Durações: 150ms (fast hover), 200ms (padrão), 300ms (panels glass), 500ms (charts), 1200ms (AnimatedNumber).
- Easing: `ease-in-out` padrão · `ease-out` em progress · cubic-out em counting.
- **Nunca** animar `width/height/top/left` — usar `transform`+`opacity`.
- Hover card: `scale-[1.01]` + `shadow-md`.
- `prefers-reduced-motion` respeitado globalmente.

### Hover & press
- **Hover de card**: `hover:shadow-md` + escala sutil `1.01` + hover de glass intensifica bg (0.62 → 0.75).
- **Hover de botão primary**: fica em `--primary-dim` (escurecer ~5% lightness).
- **Hover subtle**: `hover:bg-muted/50`, `hover:bg-white/4` em containers dark.
- **Press**: não há "shrink" por padrão. Use ring `focus-visible:ring-2 focus-visible:ring-ring`.
- **Opacity reveal**: `opacity-0 group-hover:opacity-100` para actions secundárias em cards.

### Transparência e blur
- Blur **só** em glass surfaces (não em containers sólidos).
- Floating overlays (dropdowns, popovers, tooltips) **desligam** backdrop-filter para garantir legibilidade.
- **Video Call** ignora light/dark — sempre escuro (`--video-*` tokens).

### Imagery & backgrounds
- **Sem ilustrações hand-drawn.** Sem gradientes dramáticos de hero.
- Superfícies admin são predominantemente brancas/claras com glass overlay sutil.
- `<AmbientBackdrop>` cria wash roxo ambient atrás de seções (primary/faint).
- **Sidebar** é sempre escura em ambos os temas — "premium dark-always".

### Cards
- **Radius**: `rounded-2xl` para GlassPanel, `rounded-xl` para cards normais, `rounded-lg` para cards menores.
- **Border**: `border border-border/20` padrão.
- **BG**: branco puro (`--card`) sólido OU glass translúcido.
- **Padding**: `p-4 sm:p-6` padrão, `p-3` compacto.
- **Sombra**: `shadow-sm` em repouso, `shadow-md` em hover.

### Layout
- **Admin max-width**: 1400px (`max-w-350`) centralizado.
- **Sidebar + main**: sidebar escura fixa esquerda, main com padding generoso.
- **Grid de cards**: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3`.
- **Detail layout**: `grid gap-3 lg:grid-cols-[1fr_380px]` (conteúdo + detail panel sticky).

---

## ICONOGRAPHY

### Biblioteca oficial: Lucide React
- **Única biblioteca permitida** para ícones de UI.
- Disponível via CDN: `https://unpkg.com/lucide@latest/dist/umd/lucide.js` ou `https://cdn.jsdelivr.net/npm/lucide@latest/dist/umd/lucide.min.js`.
- Stroke weight padrão: `2`. Stroke linecap/linejoin: `round`.

### Escala de tamanho
| Size | Pixels | Uso |
|---|---|---|
| `size-2` | 8px | Dots decorativos |
| `size-2.5` | 10px | Contato inline em cards |
| `size-3` | 12px | Footer metrics |
| `size-3.5` | 14px | Botões, search input |
| `size-4` / 16px | 16px | **Padrão** — headers, actions |
| `h-5 w-5` | 20px | Ícones maiores |
| `h-6 w-6` | 24px | Section headers |
| `h-8 w-8` | 32px | Dialog actions, empty states |
| `h-10 w-10` | 40px | Empty state principal |

### Icon containers (componente `<IconContainer size>`)
- **LG** (40px): `size-10 rounded-xl` — cards de processo
- **MD** (32px): `size-8 rounded-lg` — listas, rows
- **SM** (24px): `size-6 rounded-md` — inline, badges
- **XS** (20px): `size-5 rounded` — indicators

### Cores de ícone
- Padrão: `text-muted-foreground`
- Sutil: `text-muted-foreground/50`
- Muito sutil: `text-muted-foreground/40`
- Fantasma: `text-muted-foreground/55`
- Primary: `text-primary`
- Semântico: `text-success | text-warning | text-info | text-destructive`
- Dinâmico: `style={{ color }}` por config do usuário (palette)

### Emoji e unicode
- **Emoji como ícone de UI: PROIBIDO.** Zero tolerância — mesmo em empty states ou celebratórios.
- **Unicode chars como ícone (→, •, ×): evitar.** Usar Lucide (`ArrowRight`, `Dot`, `X`).
- Unicode é aceitável em conteúdo literal (texto do usuário, copy de tribunal).

### Logo e brand marks
- **Logo Zattar**: "Z." em preto/escuro (ou branco em dark surface), com **ponto roxo** em `var(--primary)` após o Z. Proporção ~5:2 (500×200 intrínseco).
- Arquivos no repo original:
  - `/logos/Sem Fundo SVG/logo-zattar-light.svg` — versão light (para superfícies escuras)
  - `/logos/Sem Fundo SVG/logo-zattar-dark.svg` — versão dark (para superfícies claras)
  - `/logos/Sem Fundo SVG/logo-z-dark.svg` — Z colapsado para sidebar small
- **Componente**: `<BrandMark variant="auto|light|dark" size="sm|md|lg|xl" href collapsible priority />`
- Ícone do app (`icon.png` / favicon): Z preto com ponto roxo em canvas quadrado — disponível em `assets/zattar-icon.png` deste projeto.

### Substituições declaradas
- **Fontes**: Inter, Montserrat, Manrope e Geist Mono são **todas Google Fonts** — carregadas via CDN nos kits. Geist Mono originalmente vem da família Vercel/Geist; usamos a variante Google Fonts "Geist Mono" (equivalente). ⚠️ **Flag ao usuário**: confirmar se licença de fonte está OK; fornecer WOFF2 próprios se necessário.
- **Logos SVG**: os arquivos `/logos/Sem Fundo SVG/*.svg` do repo não foram importados (precisariam de acesso a `/public/logos`, fora do `src/`). Neste projeto reconstruímos o logo inline usando tipografia (`Z.` em Montserrat bold + dot roxo) como fallback fiel à estética. ⚠️ **Flag ao usuário**: para produção, substituir por SVGs oficiais.

---

## Index / Manifesto dos arquivos

```
.
├── README.md                 ← este arquivo
├── SKILL.md                  ← invocação como skill (Agent Skills compatible)
├── colors_and_type.css       ← CSS vars + classes tipográficas (importável)
├── assets/
│   └── zattar-icon.png       ← ícone do app (Z. com dot roxo)
├── fonts/                    ← (vazio — fontes vêm via Google Fonts CDN; ver CONTENT)
├── preview/                  ← cards da aba Design System (registered)
│   ├── brand-logo.html
│   ├── palette-primary.html
│   ├── palette-neutrals.html
│   ├── palette-status.html
│   ├── palette-user.html
│   ├── palette-event.html
│   ├── type-headings.html
│   ├── type-body.html
│   ├── type-meta.html
│   ├── spacing-scale.html
│   ├── radius-scale.html
│   ├── shadow-scale.html
│   ├── glass-system.html
│   ├── buttons.html
│   ├── badges.html
│   ├── inputs.html
│   └── cards.html
└── ui_kits/
    └── zattar-os/
        ├── README.md         ← o que está no kit
        ├── index.html        ← demo interativa (dashboard + sidebar)
        ├── Sidebar.jsx
        ├── GlassPanel.jsx
        ├── KpiCard.jsx
        ├── ProcessCard.jsx
        ├── Chip.jsx
        ├── Button.jsx
        ├── IconContainer.jsx
        └── shared.jsx        ← BrandMark, helpers, icon set wrapper
```

(Arquivos importados do repo original estão em `src/` para referência futura.)

### Componentes divergentes do produto real

Três protótipos JSX do bundle original **não representam o produto final** e foram desativados como referência canônica:

- **`PulseStrip.jsx`** (activity feed com log de intimações/movimentações) — **não existe no app**. Decisão: escopo futuro se o roadmap de dashboard jurídico pedir. Remove da spec por enquanto. O componente homônimo em `src/components/dashboard/pulse-strip.tsx` é um **KPI metrics strip** (totalizadores), não activity feed.

- **`Topbar.jsx`** (header genérico com search global + title/subtitle + user inline) — o app evoluiu para **`DashboardHeader`** Pedrinho-centric (logo + módulos + toggle do assistente Pedrinho). A busca é **per-página** (cada módulo tem seu `SearchInput`). Decisão: atualizar spec para refletir modelo Pedrinho-centric, não reintroduzir Topbar genérico.

- **Magistrate AI** (item do secondary nav no Sidebar.jsx) — **não existe no código**. Era um nome de conceito legado. O assistente real se chama **Pedrinho** e vive como rail lateral direito, não como item de nav. Removido.

---

## Próximos passos / caveats
- Ver `SKILL.md` para invocação em Claude Code.
- Ver `ui_kits/zattar-os/index.html` para a demo interativa.
- Caveats: sem acesso à pasta `/public/logos/` do repo (fora da importação), logos são reconstruídos inline.
