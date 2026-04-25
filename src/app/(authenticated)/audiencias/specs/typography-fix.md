# Spec: Correção de Hierarquia Tipográfica em Diálogos de Audiência

## Problema Identificado

Os diálogos de audiência (`audiencia-detail-dialog.tsx`, `nova-audiencia-dialog.tsx`, `editar-audiencia-dialog.tsx`) têm inconsistências na hierarquia tipográfica e não seguem o padrão canônico do sistema.

### Diagnóstico

| Arquivo | Shell Usado | Problemas |
|---------|-------------|-----------|
| `audiencia-detail-dialog.tsx` | `DialogDetailShell` | ✅ Shell correto, mas labels inline `text-[13px]` e `text-[11.5px]` |
| `nova-audiencia-dialog.tsx` | `DialogFormShell` | ✅ Shell correto, mas `FieldLabel` usa `text-[13px]` em vez de `Text variant="label"` |
| `editar-audiencia-dialog.tsx` | `Dialog` nativo | ❌ Deveria usar `DialogFormShell` |

## Padrão Canônico (DialogFormShell)

### Header
```tsx
<DialogFormShell
  title="Título da entidade"
  description="Descrição a11y (sr-only)"
  maxWidth="2xl"
  density="comfortable"
>
```

### Seções
```tsx
<DialogSection title="Título da seção" icon={Icon}>
  {/* Conteúdo */}
</DialogSection>
```

### Labels
- **Labels de campos**: `Text variant="label"` (14px, `font-medium`)
- **Subtítulos de seção**: `Text variant="overline"` (11px, uppercase)
- **Textos auxiliares**: `Text variant="caption"` (13px)

### Footer
```tsx
footer={
  <Button type="submit" form="form-id" disabled={isLoading}>
    Salvar
  </Button>
}
```

## Correções Necessárias

### 1. `editar-audiencia-dialog.tsx` — Migrar para DialogFormShell

**Antes:**
```tsx
<Dialog open={open} onOpenChange={handleClose}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Editar Audiência</DialogTitle>
      <DialogDescription>...</DialogDescription>
    </DialogHeader>
    <form onSubmit={handleSubmit}>
      {/* ... */}
      <DialogFooter>
        <Button variant="outline">Cancelar</Button>
        <Button type="submit">Salvar</Button>
      </DialogFooter>
    </form>
  </DialogContent>
</Dialog>
```

**Depois:**
```tsx
<DialogFormShell
  open={open}
  onOpenChange={handleClose}
  title="Editar Audiência"
  description={isCapturada ? "Audiência capturada do PJE..." : "Altere os dados da audiência."}
  maxWidth="2xl"
  footer={
    <Button type="submit" form="editar-audiencia-form" disabled={isLoading}>
      {isLoading && <LoadingSpinner className="mr-2" />}
      Salvar
    </Button>
  }
>
  <form id="editar-audiencia-form" onSubmit={handleSubmit}>
    {/* ... */}
  </form>
</DialogFormShell>
```

### 2. `nova-audiencia-dialog.tsx` — Corrigir FieldLabel

**Antes:**
```tsx
function FieldLabel({ htmlFor, children }: { htmlFor?: string; children: React.ReactNode }) {
  return (
    <Label htmlFor={htmlFor} className="text-[13px] font-medium text-foreground/80 mb-1.5 block">
      {children}
    </Label>
  );
}
```

**Depois:**
```tsx
function FieldLabel({ htmlFor, children }: { htmlFor?: string; children: React.ReactNode }) {
  return (
    <Label htmlFor={htmlFor} className="mb-1.5 block">
      <Text variant="label" className="text-foreground/80">
        {children}
      </Text>
    </Label>
  );
}
```

### 3. `audiencia-detail-dialog.tsx` — Corrigir labels inline

**Problemas encontrados:**
- `text-[15px]` no hero (deveria ser `text-body-lg` = 20px)
- `text-[11.5px]` em botões (deveria ser `text-micro-caption` = 10px)
- Labels de campos usando `Text variant="label"` (14px) — correto, mas alguns usam `text-[13px]`

## Checklist de Validação

- [ ] Todos os diálogos usam `DialogFormShell` ou `DialogDetailShell` (não `Dialog` nativo)
- [ ] Labels de campos usam `Text variant="label"` (14px)
- [ ] Subtítulos de seção usam `Text variant="overline"` (11px)
- [ ] Textos auxiliares usam `Text variant="caption"` (13px)
- [ ] Botões pequenos usam `text-micro-caption` (10px)
- [ ] Hero usa `text-body-lg` (20px) ou `text-body` (18px)
- [ ] Nenhum valor de font-size inline (ex: `text-[13px]`, `text-[11.5px]`)
- [ ] `DialogFormShell` tem `footer` com botão de submit
- [ ] `DialogFormShell` tem `description` para a11y

## Arquivos a Modificar

1. `src/app/(authenticated)/audiencias/components/editar-audiencia-dialog.tsx`
2. `src/app/(authenticated)/audiencias/components/nova-audiencia-dialog.tsx`
3. `src/app/(authenticated)/audiencias/components/audiencia-detail-dialog.tsx`
