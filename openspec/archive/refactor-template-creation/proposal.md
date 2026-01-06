# Change: Refatorar Sistema de Criação de Templates de Assinatura Digital

## Why

A página de criação de templates (`src/app/(dashboard)/assinatura-digital/templates/new/markdown/page.tsx`) apresenta 466 linhas com múltiplas responsabilidades misturadas. Existem 3 componentes diferentes fazendo criação de templates (duplicação), não utiliza os padrões estabelecidos do projeto (`PageShell`, `DialogFormShell`), e não segue a arquitetura Feature-Sliced Design. A lógica de upload está inline, sem separação de responsabilidades, e o componente é totalmente client-side sem aproveitar Server Components do Next.js 16.

## What Changes

### Consolidação de Componentes
- Consolidar 3 componentes duplicados em uma solução única e coesa
- Criar `TemplateCreateDialog` usando `DialogFormShell` (padrão do projeto)
- Criar `TemplateFormFields` para apresentação do formulário
- Criar `PdfUploadField` como componente reutilizável para upload de PDFs

### Schemas de Validação
- Consolidar schemas em `types/domain.ts`
- Adicionar `uploadPdfSchema` para validação de upload
- Criar `templateFormSchema` wrapper para UI

### Remoção de Código Duplicado
- **BREAKING**: Remover `src/app/(dashboard)/assinatura-digital/templates/new/markdown/page.tsx`
- **BREAKING**: Remover `src/app/(dashboard)/assinatura-digital/templates/new/pdf/page.tsx`
- **BREAKING**: Remover `src/app/(dashboard)/assinatura-digital/templates/components/template-create-dialog.tsx`
- Avaliar remoção de `src/features/assinatura-digital/components/editor/CreateTemplateForm.tsx`

### Mudança de Fluxo de Navegação
- **BREAKING**: Ação de criar template agora abre diálogo modal ao invés de navegar para página separada
- Remover rotas `/assinatura-digital/templates/new/markdown` e `/assinatura-digital/templates/new/pdf`

### Barrel Exports
- Atualizar `src/features/assinatura-digital/index.ts` com novos exports

## Impact

### Affected Specs
- `assinatura-digital` (nova capability a ser documentada)

### Affected Code
- `src/features/assinatura-digital/types/domain.ts` - Novos schemas
- `src/features/assinatura-digital/components/editor/` - Novo `PdfUploadField`
- `src/features/assinatura-digital/components/templates/` - Novos componentes
- `src/features/assinatura-digital/index.ts` - Barrel exports
- `src/app/(dashboard)/assinatura-digital/templates/client-page.tsx` - Integrar diálogo
- `src/app/(dashboard)/assinatura-digital/templates/new/` - **Diretório a ser removido**

### Benefícios Esperados

| Aspecto | Antes | Depois |
|---------|-------|--------|
| Linhas de código | 466 linhas em 1 arquivo | ~150 linhas distribuídas em 3 componentes |
| Duplicação | 3 componentes fazendo a mesma coisa | 1 solução consolidada |
| Padrões | Não segue padrões do projeto | Usa `DialogFormShell`, FSD, Server Actions |
| Testabilidade | Difícil de testar (tudo junto) | Componentes isolados e testáveis |
| Manutenibilidade | Baixa (lógica misturada) | Alta (separação de responsabilidades) |
| UX | Página separada | Modal integrado (melhor fluxo) |
| Reutilização | Baixa | Alta (componentes reutilizáveis) |
