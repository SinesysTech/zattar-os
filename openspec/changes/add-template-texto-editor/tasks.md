# Tasks: Refatoração Completa + Templates de Texto

## Fase 1: Correções Críticas de Segurança e Tipos

### 1.1 Verificação de Permissões
- [ ] 1.1.1 Criar helper `checkAssinaturaDigitalPermission()` em `src/features/assinatura-digital/utils/permissions.ts`
- [ ] 1.1.2 Implementar verificação em `listarSegmentosAction()` (actions.ts:44)
- [ ] 1.1.3 Implementar verificação em `criarSegmentoAction()` (actions.ts:63)
- [ ] 1.1.4 Implementar verificação em `atualizarSegmentoAction()` (actions.ts:84)
- [ ] 1.1.5 Implementar verificação em `listarTemplatesAction()` (actions.ts:107)
- [ ] 1.1.6 Implementar verificação em `criarTemplateAction()` (actions.ts:126)
- [ ] 1.1.7 Implementar verificação em `atualizarTemplateAction()` (actions.ts:184)
- [ ] 1.1.8 Implementar verificação em `excluirTemplateAction()` (actions.ts:219)

### 1.2 Consolidação de Tipos
- [ ] 1.2.1 Mover `src/types/assinatura-digital/pdf-preview.types.ts` para `src/features/assinatura-digital/types/`
- [ ] 1.2.2 Mover `src/types/assinatura-digital/form-schema.types.ts` para `src/features/assinatura-digital/types/`
- [ ] 1.2.3 Mover `src/types/assinatura-digital/segmento.types.ts` para `src/features/assinatura-digital/types/`
- [ ] 1.2.4 Mover `src/types/assinatura-digital/cliente-adapter.types.ts` para `src/features/assinatura-digital/types/`
- [ ] 1.2.5 Excluir pasta `src/types/assinatura-digital/` após migração
- [ ] 1.2.6 Atualizar imports em todos os arquivos afetados

### 1.3 Unificação de TemplateCampo
- [ ] 1.3.1 Remover interface `TemplateCampo` duplicada de `types/domain.ts` (linhas 103-116)
- [ ] 1.3.2 Atualizar barrel export `types/index.ts` para usar apenas `template.types.ts`
- [ ] 1.3.3 Atualizar imports em `FieldMappingEditor.tsx`
- [ ] 1.3.4 Atualizar imports em `PdfCanvasArea.tsx`
- [ ] 1.3.5 Atualizar imports em `PropertiesPopover.tsx`
- [ ] 1.3.6 Atualizar imports em `editor-helpers.ts`
- [ ] 1.3.7 Atualizar imports em `mock-data-generator.ts`
- [ ] 1.3.8 Atualizar imports em `template-pdf.service.ts`

### 1.4 Remoção de Componentes Duplicados
- [ ] 1.4.1 Excluir `src/features/assinatura-digital/components/form/inputs/client-search-input.tsx`
- [ ] 1.4.2 Excluir `src/features/assinatura-digital/components/form/inputs/parte-contraria-search-input.tsx`
- [ ] 1.4.3 Excluir pasta `src/features/assinatura-digital/components/form/inputs/` se vazia
- [ ] 1.4.4 Atualizar imports em `dynamic-form-renderer.tsx` para usar `../inputs/`

### 1.5 Integração com Processos
- [ ] 1.5.1 Adicionar campo `processo_id` em interface `Template` (template.types.ts)
- [ ] 1.5.2 Adicionar campo `processo_id` em interface `AssinaturaDigital` (domain.ts)
- [ ] 1.5.3 Adicionar variáveis de processo em `TipoVariavel`:
  - `processo.numero`
  - `processo.vara`
  - `processo.comarca`
  - `processo.data_autuacao`
  - `processo.valor_causa`
- [ ] 1.5.4 Criar migration SQL para adicionar `processo_id` nas tabelas
- [ ] 1.5.5 Atualizar serviço de geração de PDF para incluir dados do processo

---

## Fase 2: Refatoração de Componentes

### 2.1 Dividir FieldMappingEditor
- [ ] 2.1.1 Criar `src/features/assinatura-digital/components/editor/hooks/useFieldDrag.ts`
- [ ] 2.1.2 Criar `src/features/assinatura-digital/components/editor/hooks/useFieldSelection.ts`
- [ ] 2.1.3 Criar `src/features/assinatura-digital/components/editor/hooks/useZoomPan.ts`
- [ ] 2.1.4 Criar `src/features/assinatura-digital/components/editor/hooks/useAutosave.ts`
- [ ] 2.1.5 Criar `src/features/assinatura-digital/components/editor/hooks/index.ts`
- [ ] 2.1.6 Criar `src/features/assinatura-digital/components/editor/PdfCanvas/CanvasToolbar.tsx`
- [ ] 2.1.7 Criar `src/features/assinatura-digital/components/editor/PdfCanvas/FieldDragLayer.tsx`
- [ ] 2.1.8 Mover `PdfCanvasArea.tsx` para `PdfCanvas/PdfCanvasArea.tsx`
- [ ] 2.1.9 Criar `src/features/assinatura-digital/components/editor/PdfCanvas/index.ts`
- [ ] 2.1.10 Criar `src/features/assinatura-digital/components/editor/FieldProperties/FieldTypeSelector.tsx`
- [ ] 2.1.11 Mover `PropertiesPopover.tsx` para `FieldProperties/PropertiesPopover.tsx`
- [ ] 2.1.12 Criar `src/features/assinatura-digital/components/editor/FieldProperties/index.ts`
- [ ] 2.1.13 Criar `src/features/assinatura-digital/components/editor/TemplateInfo/AutosaveIndicator.tsx`
- [ ] 2.1.14 Mover `TemplateInfoPopover.tsx` para `TemplateInfo/TemplateInfoPopover.tsx`
- [ ] 2.1.15 Criar `src/features/assinatura-digital/components/editor/TemplateInfo/index.ts`
- [ ] 2.1.16 Refatorar `FieldMappingEditor.tsx` para usar novos componentes e hooks

### 2.2 Extrair Hooks Comuns
- [ ] 2.2.1 Criar `src/features/assinatura-digital/hooks/use-data-fetch.ts` (hook genérico)
- [ ] 2.2.2 Criar `src/features/assinatura-digital/hooks/use-templates.ts`
- [ ] 2.2.3 Criar `src/features/assinatura-digital/hooks/use-formularios.ts`
- [ ] 2.2.4 Criar `src/features/assinatura-digital/hooks/use-segmentos.ts`
- [ ] 2.2.5 Criar `src/features/assinatura-digital/hooks/index.ts`
- [ ] 2.2.6 Refatorar `templates/client-page.tsx` para usar hooks extraídos
- [ ] 2.2.7 Refatorar `formularios/client-page.tsx` para usar hooks extraídos

### 2.3 Componentes Base para Dialogs
- [ ] 2.3.1 Criar `src/features/assinatura-digital/components/dialogs/BaseDeleteDialog.tsx`
- [ ] 2.3.2 Criar `src/features/assinatura-digital/components/dialogs/BaseDuplicateDialog.tsx`
- [ ] 2.3.3 Criar `src/features/assinatura-digital/components/dialogs/index.ts`
- [ ] 2.3.4 Refatorar `template-delete-dialog.tsx` para usar `BaseDeleteDialog`
- [ ] 2.3.5 Refatorar `formulario-delete-dialog.tsx` para usar `BaseDeleteDialog`
- [ ] 2.3.6 Refatorar `template-duplicate-dialog.tsx` para usar `BaseDuplicateDialog`
- [ ] 2.3.7 Refatorar `formulario-duplicate-dialog.tsx` para usar `BaseDuplicateDialog`

---

## Fase 3: Templates de Texto (Nova Funcionalidade)

### 3.1 Extensão do Schema e Tipos
- [ ] 3.1.1 Adicionar interface `TemplateTexto` em `template.types.ts`:
  - `conteudo_plate: Descendant[]`
  - `variaveis_usadas: TipoVariavel[]`
  - `configuracao_pagina: ConfiguracaoPagina`
- [ ] 3.1.2 Criar type guards `isTemplatePdf()` e `isTemplateTexto()`
- [ ] 3.1.3 Adicionar tipos `VariavelMention` e `VariavelNode`
- [ ] 3.1.4 Criar schema Zod `templateTextoSchema` em `domain.ts`

### 3.2 Componentes de Seleção e Criação
- [ ] 3.2.1 Criar `src/app/(dashboard)/assinatura-digital/templates/components/template-type-selector.tsx`
- [ ] 3.2.2 Refatorar `template-create-dialog.tsx` para incluir seleção de tipo
- [ ] 3.2.3 Criar `src/features/assinatura-digital/components/editor/TemplateTextoCreateForm.tsx`

### 3.3 Sistema de Variáveis no Editor
- [ ] 3.3.1 Criar `src/features/assinatura-digital/components/editor/VariaveisPlugin.tsx`
- [ ] 3.3.2 Criar `src/features/assinatura-digital/components/editor/TemplateTextoToolbar.tsx`

### 3.4 Editor de Templates de Texto
- [ ] 3.4.1 Criar `src/features/assinatura-digital/components/editor/TemplateTextoEditor.tsx`
- [ ] 3.4.2 Criar `src/app/(dashboard)/assinatura-digital/templates/[id]/edit-texto/page.tsx`
- [ ] 3.4.3 Criar `src/features/assinatura-digital/components/editor/TemplateTextoPreviewModal.tsx`

### 3.5 Serviço de Conversão PDF
- [ ] 3.5.1 Criar `src/features/assinatura-digital/services/template-texto-html.template.ts`
- [ ] 3.5.2 Criar `src/features/assinatura-digital/services/template-texto-pdf.service.ts`

### 3.6 Actions e API Routes
- [ ] 3.6.1 Criar `src/features/assinatura-digital/actions/templates-texto-actions.ts`
- [ ] 3.6.2 Criar `src/app/api/assinatura-digital/templates/[id]/preview-texto/route.ts`

### 3.7 Integração com Fluxo de Assinatura
- [ ] 3.7.1 Atualizar `service.ts` para detectar tipo de template
- [ ] 3.7.2 Integrar geração de PDF texto com manifesto de assinatura

### 3.8 Interface de Listagem
- [ ] 3.8.1 Atualizar `templates/client-page.tsx` com coluna de tipo
- [ ] 3.8.2 Adicionar filtro por tipo de template
- [ ] 3.8.3 Implementar ações contextuais por tipo

---

## Fase 4: Limpeza e Documentação

### 4.1 Limpeza de Código
- [ ] 4.1.1 Remover debug logging de `FieldMappingEditor.tsx`
- [ ] 4.1.2 Remover código comentado (useEffect linhas 417-445)
- [ ] 4.1.3 Criar `src/features/assinatura-digital/utils/input-styles.ts` com className compartilhado
- [ ] 4.1.4 Atualizar `input-cpf.tsx` para usar `inputClassName`
- [ ] 4.1.5 Atualizar `input-telefone.tsx` para usar `inputClassName`
- [ ] 4.1.6 Atualizar `input-data.tsx` para usar `inputClassName`
- [ ] 4.1.7 Atualizar `input-cpf-cnpj.tsx` para usar `inputClassName`

### 4.2 Correção de Tipos
- [ ] 4.2.1 Criar `src/features/assinatura-digital/utils/campos-parser.ts`
- [ ] 4.2.2 Atualizar `types/types.ts` para tipar `form_schema` como `DynamicFormSchema`

### 4.3 Testes
- [ ] 4.3.1 Criar testes unitários para `template-texto-pdf.service.ts`
- [ ] 4.3.2 Criar testes de integração para templates texto
- [ ] 4.3.3 Criar testes E2E em `e2e/assinatura-digital/templates-texto.spec.ts`

### 4.4 Documentação
- [ ] 4.4.1 Criar `docs/assinatura-digital/templates-texto.md`
- [ ] 4.4.2 Atualizar README do módulo com nova estrutura
