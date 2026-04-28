# Design System Master — ZattarOS

> **LOGIC:** Quando estiver construindo uma página específica, verifique primeiro `design-system/zattaros/pages/[page].md`.
> Se existir, suas regras **sobrescrevem** este Master. Caso contrário, siga estritamente as regras abaixo.

---

**Projeto:** ZattarOS (Synthropic)  
**Atualizado:** 2026-04-28  
**Stack:** Next.js 16 · React 19 · TypeScript 5 · Tailwind 4 · shadcn/ui (new-york) · Supabase

---

## Identidade Visual: Glass Briefing / Neon Magistrate

O ZattarOS usa o padrão **Glass Briefing** para painéis operacionais — layout single-column com cards
de vidro (`GlassPanel`), KPI strips no topo, insight banners contextuais e view controls fixos.

---

## Tema shadcn Instalado

O projeto importa `shadcn/tailwind.css` que registra **custom variants** essenciais:

| Variant | Selector gerado | Uso |
|---|---|---|
| `data-active:` | `[data-state="active"]` ou `[data-active]` | Tabs, itens de lista selecionados |
| `data-horizontal:` | `[data-orientation="horizontal"]` | Layout de componentes Radix |
| `data-vertical:` | `[data-orientation="vertical"]` | Layout de componentes Radix |
| `data-open:` | `[data-state="open"]` | Dropdowns, Collapsibles |
| `data-checked:` | `[data-state="checked"]` | Checkboxes, Radios |

Esses variants estão disponíveis para qualquer componente Radix UI/shadcn.

---

## Paleta de Cores

As cores são controladas por **variáveis CSS** do tema (Tailwind 4 + shadcn). Nunca usar HEX hardcoded.

| Token Tailwind | Papel | Valor light | Valor dark |
|---|---|---|---|
| `bg-background` | Fundo da página | `oklch(0.96 0.01 281)` — branco micro-tintado | `oklch(0.17 0.005 281)` — dark brand |
| `bg-card` | Fundo dos cards | `oklch(1 0 0)` — branco puro | `oklch(0.22 0.005 281)` |
| `text-foreground` | Texto primário | `oklch(0.15 0.01 281)` | `oklch(0.98 0 0)` |
| `text-muted-foreground` | Texto secundário | `oklch(0.42 0.01 281)` | `oklch(0.65 0.005 281)` |
| `bg-primary / text-primary` | Ação principal — **Roxo Zattar** | `oklch(0.48 0.26 281)` — #5523EB | `oklch(0.70 0.20 281)` |
| `bg-brand / text-brand` | Alias do roxo puro (decorativo) | `oklch(0.48 0.26 281)` | `oklch(0.70 0.20 281)` |
| `bg-muted` | Superfície neutra (TabsList, inputs) | `oklch(0.92 0.01 281)` | `oklch(0.28 0.005 281)` |
| `bg-success / text-success` | Verde | Concluído, realizado, OK | — |
| `bg-warning / text-warning` | Amarelo | Atenção, próximo prazo | — |
| `bg-destructive / text-destructive` | Vermelho | Crítico, vencido, erro | — |
| `bg-info / text-info` | Azul/roxo | Informativo, capture, link | — |
| `border-border` | Bordas | `oklch(0.87 0.01 281)` — tintado | `oklch(1 0 0 / 0.12)` |

**Opacidades comuns:** `/5`, `/8`, `/10`, `/15`, `/20`, `/25`, `/40`, `/50`, `/60`

---

## Tipografia — Tokens Canônicos

Os tokens abaixo são classes CSS definidas em `src/app/globals.css`. **Sempre preferir tokens a classes
Tailwind brutas** (`text-sm`, `text-xs`, `text-xl` etc.).

| Classe | Tamanho | Uso canônico |
|---|---|---|
| `text-kpi-value` | 24px, bold, tabular-nums | Valores em KPI cards (AnimatedNumber) |
| `text-meta-label` | 11px, semibold, uppercase, tracking 0.14em | Labels de KPI cards, cabeçalhos de seção |
| `text-overline` | 11px, semibold, uppercase, tracking 0.08em | Labels ALL-CAPS secundários |
| `text-caption` | 13px, muted-foreground | Subtítulos de página, texto auxiliar |
| `text-helper` | 13px | Dicas, descrições de formulário |
| `text-widget-sub` | 12px | Subtítulo de widget |
| `text-mono-num` | 10px, font-mono, tabular-nums | Números de processo, datas, IDs |
| `text-micro-caption` | 10px | Timestamps terciários, contadores |
| `text-micro-badge` | 9px, font-medium | Texto dentro de badges e tags |

**Headings de página:** `<Heading level="page">` do componente `@/components/ui/typography`  
**Subtítulo de página:** `<Text variant="caption" as="p" className="mt-0.5">`

---

## Tokens de Componentes Obrigatórios

### GlassPanel
```tsx
<GlassPanel depth={1}>        // card padrão
<GlassPanel depth={2}>        // card em destaque / selecionado
<GlassPanel depth={3}>        // painel hero / hero card
```
- **Nunca usar `bg-card` diretamente** em painéis principais — usar `GlassPanel`
- Padding direcional padrão em KPI cards: `px-4 py-3.5`

### KPI Strip (padrão canônico — baseado em ExpedientesPulseStrip)
```tsx
// Label
<p className="text-meta-label">Nome do KPI</p>

// Valor
<p className="text-kpi-value leading-none tracking-tight">
  <AnimatedNumber value={n} />
</p>

// Barra de proporção
<div className="flex-1 h-1 rounded-full bg-muted/30 overflow-hidden">
  <div className="h-full rounded-full {color}/25 transition-all duration-700" style={{ width: `${pct}%` }} />
</div>
<span className="text-micro-badge tabular-nums text-muted-foreground/50 shrink-0">{pct}%</span>
```
- Grid: `grid grid-cols-2 lg:grid-cols-4 gap-3`
- Ícone: `<IconContainer size="md" className="bg-{color}/8">` com ícone `size-4 text-{color}/50`

### Header de módulo (padrão canônico — baseado em ExpedientesContent)
```tsx
<div className="flex items-end justify-between gap-4">
  <div>
    <Heading level="page">Nome do Módulo</Heading>
    <Text variant="caption" as="p" className="mt-0.5">{subtitle}</Text>
  </div>
  <Button size="sm" className="rounded-xl" onClick={...}>
    <Plus className="size-3.5" />
    Nova Entidade
  </Button>
</div>
```

### View Controls (padrão canônico)
```tsx
<div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
  <FilterBar ... />
  <div className="flex items-center gap-2 flex-1 justify-end">
    <SearchInput ... />
    <ViewToggle ... />
  </div>
</div>
```

### Insight Banners
```tsx
<InsightBanner type="alert">  // vermelho — crítico
<InsightBanner type="warning">  // amarelo — atenção
```

### Tabs (shadcn padrão)

```tsx
// Padrão — pill com bg-muted, trigger ativo com bg-background
<Tabs defaultValue="tab1">
  <TabsList>                         // rounded-lg (sobrescrito pelo globals.css)
    <TabsTrigger value="tab1">Tab 1</TabsTrigger>
    <TabsTrigger value="tab2">Tab 2</TabsTrigger>
  </TabsList>
  <TabsContent value="tab1">...</TabsContent>
</Tabs>

// Variante linha (underline)
<TabsList variant="line">
  <TabsTrigger value="tab1">Tab 1</TabsTrigger>
</TabsList>
```

**Day-picker (flex-col triggers)** — padrão da view Semana:
```tsx
// Triggers precisam ser flex-col (empilham nome do dia + data).
// h-auto! e rounded-2xl! sobrescrevem h-9 e rounded-full da base shadcn.
<TabsList className="w-full! h-auto! rounded-2xl!">
  <TabsTrigger
    value={key}
    className={cn(
      'flex h-auto! flex-1 flex-col items-center gap-0.5 px-3 py-2',
      today && 'bg-primary/12',
    )}
  >
    <span className={cn('text-overline capitalize', today && 'text-primary')}>
      {format(day, 'EEE', { locale: ptBR })}
    </span>
    <span className={cn('text-caption font-semibold tabular-nums', today && 'text-primary')}>
      {format(day, 'd')}
    </span>
  </TabsTrigger>
</TabsList>
```

> **Por que `!` (important)?** Os modificadores `w-full!`, `h-auto!`, `rounded-2xl!`
> geram `!important` no CSS. A variante base shadcn usa `w-fit`, `h-9` (horizontal) e
> `rounded-full` em `@layer utilities` — mesma camada, maior especificidade pelo selector
> condicional `group-data-horizontal/tabs:h-9`. O `!important` garante a sobrescrita.

### Dialogs (sem Sheet)
- Todos os painéis de detalhe e formulários usam `DialogFormShell` centralizado
- **Nunca usar `Sheet`** — violação de regra arquitetural

---

## Padrões de Layout

### Espaçamento entre seções
- `space-y-5` entre blocos principais de uma página
- `gap-3` entre cards de KPI grid
- `gap-4` entre o header e o KPI strip

### Responsividade
- Mobile: `grid-cols-1` → Tablet: `sm:grid-cols-2` → Desktop: `lg:grid-cols-4`
- KPI strips sempre `grid-cols-2 lg:grid-cols-4`
- View controls: `flex-col sm:flex-row`

---

## Anti-Padrões (NÃO USAR)

- ❌ `text-sm` / `text-xs` / `text-xl` brutos onde existem tokens DS equivalentes
- ❌ `bg-card` em painéis principais — usar `GlassPanel`
- ❌ `Sheet` — usar `DialogFormShell`
- ❌ Cores hardcoded (`#hex`) — usar variáveis CSS do tema
- ❌ Badges com cores hardcoded — usar `getSemanticBadgeVariant()`
- ❌ `font-display text-xl font-bold` para valores KPI — usar `text-kpi-value`
- ❌ `<Text variant="helper">` para subtítulos de página — usar `<Text variant="caption">`
- ❌ `uppercase tracking-wider font-medium` manual — usar `text-meta-label`
- ❌ Imports `@/features/`, `@/backend/`, `@/core/` — violação arquitetural

---

## Pre-Delivery Checklist

Antes de entregar qualquer código de UI, verificar:

- [ ] Tokens tipográficos DS usados (text-meta-label, text-kpi-value, text-caption, etc.)
- [ ] GlassPanel depth correto (1=padrão, 2=destaque, 3=hero)
- [ ] Header: Heading level="page" + Text variant="caption" mt-0.5
- [ ] KPI labels: text-meta-label (não text-sm uppercase manual)
- [ ] KPI valores: text-kpi-value (não text-xl font-display)
- [ ] Nenhum Sheet — somente DialogFormShell
- [ ] cursor-pointer em todos os elementos clicáveis
- [ ] Hover com transições 150-300ms
- [ ] Contraste mínimo 4.5:1 em texto normal
- [ ] Focus states visíveis (focus-visible:ring-1)
- [ ] prefers-reduced-motion respeitado
- [ ] Responsivo: 375px, 768px, 1024px, 1440px
- [ ] Tabs day-picker usam `h-auto! rounded-2xl!` no TabsList e `h-auto!` nos triggers
- [ ] `--brand` (oklch 0.48 0.26 281) para roxo Zattar; `--primary` para ações dark
