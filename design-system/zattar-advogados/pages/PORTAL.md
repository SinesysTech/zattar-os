# Design System - Portal do Cliente

> **Override Rules:** These rules override MASTER.md for the client portal (`/app/*` routes).

---

**Page:** Portal do Cliente
**Route:** `/app/*`
**Last Updated:** 2026-01-27
**Status:** Production

---

## Filosofia de Design

O portal do cliente segue a filosofia platonica de que **o Belo, o Bom e o Justo andam juntos**:

- **Belo (Kalos):** Interface limpa, proporcional e harmoniosa
- **Bom (Agathos):** Funcional, acessivel e intuitivo
- **Justo (Dikaios):** Consistente, previsivel e confiavel

Esta triade se manifesta em cada componente atraves de:
- Espacamento proporcional (grid de 4px)
- Tipografia hierarquica clara
- Transicoes suaves e naturais
- Feedback visual imediato e consistente

---

## Estrutura do Layout

### Hierarquia de Componentes

```
AppLayout
  |-- SidebarProvider
  |     |-- AppSidebar (navegacao principal)
  |     |-- SidebarInset
  |           |-- DashboardHeader (glassmorphism)
  |           |-- #portal-content (area de conteudo)
  |                 |-- PageShell (wrapper de pagina)
  |                       |-- [Conteudo da pagina]
```

### Especificacoes do Layout

| Componente | Altura | Largura | Background |
|------------|--------|---------|------------|
| Header | 56px (`h-14`) | 100% | `bg-background/95 backdrop-blur-xl` (scroll) |
| Sidebar (expandida) | 100vh | 240px | Dark theme (always) |
| Sidebar (colapsada) | 100vh | 48px | Dark theme (always) |
| Content Area | calc(100vh - 56px) | Restante | `bg-muted/30` |

---

## Header com Glassmorphism

O header do portal usa o mesmo padrao da landing page:

```tsx
// Estado dinamico baseado no scroll
const [isScrolled, setIsScrolled] = useState(false);

// Classes condicionais
className={cn(
  "transition-all duration-200",
  isScrolled
    ? "bg-background/95 backdrop-blur-xl border-b border-border/50 shadow-sm"
    : "bg-background border-b border-border/30"
)}
```

### Elementos do Header

| Elemento | Posicao | Comportamento |
|----------|---------|---------------|
| SidebarTrigger | Esquerda | Toggle sidebar |
| Search (Cmd+K) | Centro-esquerda | Command palette |
| ThemeCustomizer | Direita | Dropdown |
| Notifications | Direita | Bell com badge |
| AiSphere | Direita | Toggle CopilotKit |
| UserMenu | Direita extrema | Dropdown com perfil |

---

## PageShell - Wrapper de Paginas

O `PageShell` e o container padrao para todas as paginas:

```tsx
<PageShell
  title="Processos"
  description="Gerencie todos os processos do escritorio"
  badge={<Badge>Beta</Badge>}
  actions={<Button>Novo Processo</Button>}
>
  {/* Conteudo */}
</PageShell>
```

### Tipografia do PageShell

| Elemento | Classes |
|----------|---------|
| Title (h1) | `text-2xl sm:text-3xl font-bold tracking-tight font-heading` |
| Description | `text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl` |
| Badge | Componente Badge padrao |
| Actions | Flex container com `gap-2` |

---

## Cards do Portal

Cards seguem o design system com hover sutil:

```css
.card {
  background: var(--card);
  border: 1px solid hsl(var(--border) / 0.5);
  border-radius: 0.75rem; /* rounded-xl */
  padding: 1.5rem; /* py-6 px-6 */
  box-shadow: 0 1px 2px rgba(0,0,0,0.05); /* shadow-sm */
  transition: all 200ms ease;
}

.card:hover {
  box-shadow: 0 4px 6px rgba(0,0,0,0.1); /* shadow-md */
  border-color: var(--border);
}
```

### CardTitle

Usa `font-heading` para consistencia com titulos:

```css
.card-title {
  font-family: var(--font-heading);
  font-weight: 600;
  letter-spacing: -0.01em; /* tracking-tight */
  line-height: 1;
}
```

---

## Navegacao da Sidebar

### Estrutura

```
Sidebar
  |-- SidebarHeader (logo)
  |-- SidebarContent
  |     |-- NavMain (principal)
  |     |-- NavProjects (servicos)
  |     |-- NavProjects (gestao) [super admin only]
  |-- SidebarRail
```

### Estados dos Links

| Estado | Estilo |
|--------|--------|
| Default | `text-sidebar-foreground/70` |
| Hover | `bg-sidebar-accent text-sidebar-accent-foreground` |
| Active | `bg-sidebar-accent text-sidebar-accent-foreground font-medium` |
| Disabled | `opacity-50 pointer-events-none` |

---

## Area de Conteudo

### Scroll Behavior

```tsx
<div
  id="portal-content"
  className="overflow-y-auto scroll-smooth"
>
```

O ID `portal-content` e usado pelo header para detectar scroll.

### Padding e Gaps

| Propriedade | Valor | Uso |
|-------------|-------|-----|
| Padding | `p-6` (24px) | Area de conteudo |
| Gap entre secoes | `gap-6` (24px) | Espacamento vertical |
| Gap em grids | `gap-4` (16px) | Cards e elementos |

---

## Grids Responsivos

### Dashboard Grid (4 colunas)

```tsx
<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
  <Card />
  <Card />
  <Card />
  <Card />
</div>
```

### Content Grid (3 colunas)

```tsx
<div className="grid gap-4 lg:grid-cols-3">
  <ContentArea className="lg:col-span-2" />
  <Sidebar />
</div>
```

---

## Tabelas de Dados

### Responsive Table Pattern

```tsx
<ResponsiveTable>
  <ResponsiveTableHeader>
    <ResponsiveTableRow>
      <ResponsiveTableHead>Nome</ResponsiveTableHead>
      {/* ... */}
    </ResponsiveTableRow>
  </ResponsiveTableHeader>
  <ResponsiveTableBody>
    {/* rows */}
  </ResponsiveTableBody>
</ResponsiveTable>
```

### Estilo de Tabelas

| Elemento | Classes |
|----------|---------|
| Header | `bg-muted/50 font-medium text-muted-foreground` |
| Row | `border-b border-border/50 hover:bg-muted/30` |
| Cell | `px-4 py-3` |
| Actions | `text-right` |

---

## Formularios

### Input Fields

```tsx
<Input
  className="h-10 px-3 rounded-md border-border/50 focus:border-primary"
/>
```

### Labels

```tsx
<Label className="text-sm font-medium text-foreground">
  Nome do Cliente
</Label>
```

### Form Sections

```tsx
<div className="space-y-4">
  <div className="space-y-2">
    <Label>Campo</Label>
    <Input />
  </div>
</div>
```

---

## Estados de Loading

### Skeleton Cards

```tsx
<Card className="animate-pulse">
  <CardHeader>
    <div className="h-4 w-1/3 bg-muted rounded" />
  </CardHeader>
  <CardContent>
    <div className="space-y-2">
      <div className="h-3 w-full bg-muted rounded" />
      <div className="h-3 w-2/3 bg-muted rounded" />
    </div>
  </CardContent>
</Card>
```

### Loading Spinners

Usar componente `Spinner` ou `Loader2` do Lucide com `animate-spin`.

---

## Estados Vazios

```tsx
<div className="flex flex-col items-center justify-center py-12 text-center">
  <div className="rounded-full bg-muted p-4 mb-4">
    <FolderOpen className="h-8 w-8 text-muted-foreground" />
  </div>
  <h3 className="font-semibold text-lg mb-1">Nenhum processo encontrado</h3>
  <p className="text-sm text-muted-foreground max-w-sm mb-4">
    Comece adicionando um novo processo ao sistema.
  </p>
  <Button>Novo Processo</Button>
</div>
```

---

## Badges e Status

### Tipos de Badge

| Tipo | Uso | Cores |
|------|-----|-------|
| Default | Informacao geral | `bg-primary/10 text-primary` |
| Success | Concluido, ativo | `bg-green-500/10 text-green-600` |
| Warning | Pendente, atencao | `bg-amber-500/10 text-amber-600` |
| Destructive | Erro, urgente | `bg-red-500/10 text-red-600` |
| Outline | Neutro, secundario | `border border-border` |

---

## Dialogs e Modais

### Dialog Padrao

```tsx
<Dialog>
  <DialogContent className="sm:max-w-[425px]">
    <DialogHeader>
      <DialogTitle className="font-heading">Titulo</DialogTitle>
      <DialogDescription>Descricao do dialog</DialogDescription>
    </DialogHeader>
    {/* content */}
    <DialogFooter>
      <Button variant="outline">Cancelar</Button>
      <Button>Confirmar</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

## Animacoes e Transicoes

### Duracoes

| Tipo | Duracao | Uso |
|------|---------|-----|
| Micro | 150ms | Hovers, clicks |
| Normal | 200ms | State changes, toggles |
| Smooth | 300ms | Panels, dialogs |

### Reduced Motion

Todas as animacoes respeitam `prefers-reduced-motion`:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Acessibilidade

### Focus States

```css
*:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}
```

### Touch Targets

- Minimo: 44x44px
- Botoes: `min-h-[44px]` ou `h-10` com padding adequado
- Links de navegacao: padding `px-4 py-2`

### ARIA

- Sidebar: `aria-label="Navegacao principal"`
- Search: `aria-label="Buscar (Cmd+K)"`
- Modais: `aria-describedby` e `aria-labelledby`

---

## Checklist Pre-Deploy

### Visual
- [ ] Cards tem hover sutil (shadow-md)
- [ ] Titulos usam font-heading
- [ ] Espacamento consistente (gap-4, gap-6)
- [ ] Dark mode funciona corretamente

### Interacao
- [ ] Todos clicaveis tem cursor-pointer
- [ ] Focus states visiveis
- [ ] Transicoes suaves (200ms)
- [ ] Estados de loading implementados

### Acessibilidade
- [ ] Touch targets >= 44px
- [ ] Contraste de texto >= 4.5:1
- [ ] ARIA labels em elementos interativos
- [ ] Navegacao por teclado funciona

### Performance
- [ ] Skeleton loaders em async content
- [ ] Lazy loading de imagens
- [ ] Virtualizacao em listas longas
