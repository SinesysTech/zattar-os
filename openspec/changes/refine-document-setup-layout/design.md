# Design: Refinamento do Layout de Configuração de Documento

## Context

O módulo de assinatura digital possui um fluxo de 3 etapas:
1. **Upload** (OK) - Página funcional e visualmente adequada
2. **Edição** (REFINAR) - Canvas + sidebar para configurar signatários e campos
3. **Revisão** (REFINAR) - Preview final com links de assinatura

O protótipo de referência estabelece um padrão visual que não está totalmente refletido na implementação atual.

## Goals / Non-Goals

### Goals
- Implementar layout consistente entre páginas de edição e revisão
- Aplicar hierarquia visual clara com seções delimitadas
- Manter funcionalidade existente (drag-drop, seleção, zoom)
- Melhorar UX com dicas contextuais (ProTip)
- Garantir responsividade mobile

### Non-Goals
- Alterar lógica de negócio ou fluxo de dados
- Modificar estrutura do banco de dados
- Adicionar novas funcionalidades além do escopo visual
- Refatorar hooks de interação (useFieldDrag, useFieldSelection, etc.)

## Especificações Visuais do Protótipo

### Layout Geral
```
┌──────────────────────────────────────────────────────────────────────────┐
│  Service_Agreement_v2.pdf                                                │
│  Editado há 2 minutos                                                    │
├────────────────────────────────────────────────┬─────────────────────────┤
│                                                │  Document Setup         │
│                                                │  Configure signers...   │
│          ┌─────────────────────┐               │                         │
│          │ ████████████████    │               │  WHO IS SIGNING? + Add  │
│          │                     │               │  ┌───────────────────┐  │
│          │ ─────────────────── │               │  │ JD Jane Doe (You) │  │ ← Card ativo (bg verde escuro)
│          │ ─────────────────── │               │  │    jane@...       │  │
│          │                     │               │  └───────────────────┘  │
│          │ 1. SCOPE OF SERVICES│               │  ┌───────────────────┐  │
│          │ ─────────────────── │               │  │ MR Mark Ross      │  │ ← Card inativo (bg branco)
│          │ ─────────────────── │               │  │    mark@...       │  │
│          │ ─────────────────── │               │  └───────────────────┘  │
│          │                     │               │                         │
│          │ 2. PAYMENT TERMS    │               │  DRAG & DROP FIELDS     │
│          │ ─────────────────── │               │  ┌─────────┐ ┌────────┐ │
│          │                     │               │  │✍ Sign   │ │🔲 Init │ │
│          └─────────────────────┘               │  └─────────┘ └────────┘ │
│                                                │  ┌─────────┐ ┌────────┐ │
│              (Canvas com PDF)                  │  │📅 Date  │ │Tt Text │ │
│                                                │  └─────────┘ └────────┘ │
│                                                │                         │
│                                                │  🟠 ProTip: Hold Shift  │
│                                                │     to select multiple  │
│                                                │     fields...           │
│                                                │                         │
│                                                │  ┌─────────────────────┐│
│                                                │  │  Review & Send  ➤   ││
│                                                │  └─────────────────────┘│
└────────────────────────────────────────────────┴─────────────────────────┘
```

## Decisions

### D1: Header do Canvas

**Especificação extraída do protótipo (simplificada):**
```tsx
<header className="flex items-center justify-between px-6 py-4 bg-white border-b">
  <div>
    <h1 className="text-base font-medium text-foreground">
      {documento.arquivo_nome}
    </h1>
    <p className="text-sm text-muted-foreground">
      Editado {formatRelativeTime(documento.updated_at)}
    </p>
  </div>
</header>
```

**Nota:** Preview Mode removido - não há necessidade funcional.

### D2: Sidebar "Document Setup"

**Estrutura completa:**
```tsx
<aside className="w-80 border-l bg-background flex flex-col h-full">
  {/* Header */}
  <div className="p-6 pb-4">
    <h2 className="text-lg font-semibold">Document Setup</h2>
    <p className="text-sm text-muted-foreground">
      Configure signers and fields
    </p>
  </div>

  {/* Scrollable Content */}
  <div className="flex-1 overflow-y-auto px-6">
    {/* Signers Section */}
    {/* Fields Section */}
    {/* ProTip */}
  </div>

  {/* Footer CTA */}
  <div className="p-6 pt-4 border-t">
    <Button className="w-full">
      Review & Send <Send className="ml-2 h-4 w-4" />
    </Button>
  </div>
</aside>
```

**Nota:** Button padrão já usa `bg-primary`. Não especificar cores.

### D3: Seção "WHO IS SIGNING?"

**Header da seção:**
```tsx
<div className="flex items-center justify-between mb-3">
  <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
    Who is signing?
  </span>
  <Button variant="ghost" size="sm" className="h-auto p-0 text-primary hover:text-primary/80">
    + Add
  </Button>
</div>
```

**Nota:** Usar `text-primary` (Zattar Purple) para links/ações, não cores hardcoded.

**SignerCard - Estado ATIVO (selecionado):**
```tsx
// Usar cor do signatário (chart-*) com opacidade para estado ativo
<div className="flex items-center gap-3 p-3 rounded-lg bg-primary text-primary-foreground cursor-pointer">
  <Avatar className="h-10 w-10 bg-primary-foreground/20">
    <AvatarFallback className="text-primary-foreground">JD</AvatarFallback>
  </Avatar>
  <div className="flex-1 min-w-0">
    <p className="font-medium truncate">Jane Doe (You)</p>
    <p className="text-sm text-primary-foreground/80 truncate">jane.doe@company.com</p>
  </div>
</div>
```

**SignerCard - Estado INATIVO:**
```tsx
// Usar tokens semânticos: background, muted, foreground
<div className="flex items-center gap-3 p-3 rounded-lg bg-background hover:bg-accent transition-colors cursor-pointer">
  <Avatar className="h-10 w-10 bg-chart-2"> {/* Cor do signatário */}
    <AvatarFallback className="text-primary-foreground">MR</AvatarFallback>
  </Avatar>
  <div className="flex-1 min-w-0">
    <p className="font-medium text-foreground truncate">Mark Ross</p>
    <p className="text-sm text-muted-foreground truncate">mark.ross@client.com</p>
  </div>
</div>
```

**Nota:** Usar tokens `bg-primary`, `bg-accent`, `text-foreground`, `text-muted-foreground` do design system.

### D4: Seção "DRAG & DROP FIELDS"

**Grid 2x2:**
```tsx
<div className="mt-6">
  <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
    Drag & Drop Fields
  </span>
  <div className="grid grid-cols-2 gap-3 mt-3">
    <FieldCard icon={PenTool} label="Signature" />
    <FieldCard icon={Grid3X3} label="Initials" />
    <FieldCard icon={Calendar} label="Date" />
    <FieldCard icon={Type} label="Textbox" />
  </div>
</div>
```

**FieldCard individual:**
```tsx
<div className="flex items-center gap-2 p-3 border rounded-lg cursor-grab
                hover:border-muted-foreground/50 hover:bg-muted/30 transition-colors">
  <Icon className="h-4 w-4 text-muted-foreground" />
  <span className="text-sm font-medium">{label}</span>
</div>
```

### D5: ProTip Component

**Usar token `--highlight` (Action Orange) do design system:**
```tsx
<div className="flex items-start gap-3 p-4 mt-6 rounded-lg bg-highlight/10">
  <div className="h-5 w-5 rounded-full bg-highlight flex items-center justify-center shrink-0">
    <span className="h-2 w-2 rounded-full bg-white" />
  </div>
  <p className="text-sm text-muted-foreground">
    <span className="font-medium text-highlight">ProTip:</span>
    {' '}Hold{' '}
    <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">Shift</kbd>
    {' '}to select multiple fields and align them perfectly.
  </p>
</div>
```

**Nota:** `--highlight` é o Action Orange do design system Zattar.

### D6: Botão CTA "Review & Send"

**Usar tokens do design system (Primary = Zattar Purple):**
```tsx
<Button className="w-full h-12 text-base">
  Review & Send
  <ChevronRight className="ml-2 h-5 w-5" />
</Button>
```

**Nota:** O Button padrão já usa `bg-primary` (Zattar Purple). Não usar cores hardcoded.

### D7: Cores dos Signatários

**Usar tokens `chart-*` do design system:**
```typescript
// Cores mapeadas para os tokens existentes em globals.css
const SIGNER_COLORS = [
  { name: 'primary', bg: 'bg-chart-1', text: 'text-primary-foreground' },   // Roxo Zattar
  { name: 'highlight', bg: 'bg-chart-2', text: 'text-primary-foreground' }, // Laranja
  { name: 'charcoal', bg: 'bg-chart-3', text: 'text-primary-foreground' },  // Charcoal
  { name: 'green', bg: 'bg-chart-4', text: 'text-primary-foreground' },     // Verde
  { name: 'gray', bg: 'bg-chart-5', text: 'text-primary-foreground' },      // Cinza
]
```

**Nota:** Reutilizar tokens `--chart-*` já definidos no design system ao invés de cores Tailwind hardcoded.

## Página de Revisão (Inferida)

Baseado no padrão do editor, a página de revisão deve seguir estrutura similar:

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Document Review                                                         │
│  Service_Agreement_v2.pdf                                                │
├────────────────────────────────────────────────┬─────────────────────────┤
│                                                │  Review Summary         │
│          ┌─────────────────────┐               │                         │
│          │ PDF Preview         │               │  DOCUMENT INFO          │
│          │ (read-only)         │               │  • Title: Service...    │
│          │                     │               │  • Status: Ready        │
│          │ [campos posicionados]│               │  • Fields: 4 total     │
│          │                     │               │                         │
│          └─────────────────────┘               │  SIGNERS (2)            │
│                                                │  ┌───────────────────┐  │
│                                                │  │ JD Jane Doe       │  │
│                                                │  │    [Copy Link] 🔗 │  │
│                                                │  └───────────────────┘  │
│                                                │  ┌───────────────────┐  │
│                                                │  │ MR Mark Ross      │  │
│                                                │  │    [Copy Link] 🔗 │  │
│                                                │  └───────────────────┘  │
│                                                │                         │
│                                                │  ┌─────────────────────┐│
│                                                │  │ ← Back to Edit      ││
│                                                │  │ Finalize & Send  ➤  ││
│                                                │  └─────────────────────┘│
└────────────────────────────────────────────────┴─────────────────────────┘
```

## Risks / Trade-offs

### R1: Complexidade de Refatoração
- **Risco:** Alterar estrutura do sidebar pode quebrar funcionalidades existentes
- **Mitigação:** Manter hooks de interação intactos, apenas reorganizar JSX

### R2: Performance em Mobile
- **Risco:** Sheet com muitos elementos pode ter performance ruim
- **Mitigação:** Virtualizar lista de signatários se > 10

### R3: Consistência com Outras Páginas
- **Risco:** Novo layout pode divergir de outras áreas do sistema
- **Mitigação:** Usar componentes base do shadcn/ui, seguir spec `ui-components`

## Migration Plan

1. Criar novos componentes em paralelo (ProTip, SectionHeader)
2. Refatorar SignerCard e FieldPaletteCard com backward compatibility
3. Aplicar mudanças no FloatingSidebar
4. Ajustar EditorPageLayout com header de contexto
5. Refatorar página de revisão seguindo mesmo padrão
6. Validar fluxo completo
7. Remover código legado

**Rollback:** Reverter commits se detectado problema crítico

## Decisões Finais

1. **Preview Mode:** Removido - não há necessidade funcional
2. **Limite de Signatários:** Sem limite, scroll natural quando necessário
3. **Campos na Palette:** Manter os campos já existentes (Signature, Initials) - sem implementar novos
