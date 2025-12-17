# Tasks: Refatorar Sistema de Criação de Templates

## 1. Consolidar Schemas de Validação

- [ ] 1.1 Revisar `src/features/assinatura-digital/types/domain.ts` e garantir que `createTemplateSchema` está completo
- [ ] 1.2 Adicionar validações específicas para campos condicionais (PDF vs Markdown)
- [ ] 1.3 Criar schema `uploadPdfSchema` para validação de upload
- [ ] 1.4 Criar `templateFormSchema` wrapper para UI
- [ ] 1.5 Exportar schemas via `src/features/assinatura-digital/index.ts`

## 2. Criar Componente de Upload de PDF

- [ ] 2.1 Criar `src/features/assinatura-digital/components/editor/pdf-upload-field.tsx`
- [ ] 2.2 Implementar validação de tipo de arquivo (apenas PDF)
- [ ] 2.3 Implementar validação de tamanho (máximo 10MB)
- [ ] 2.4 Integrar com API `/api/assinatura-digital/templates/upload`
- [ ] 2.5 Implementar preview do arquivo selecionado
- [ ] 2.6 Implementar estados de loading e erro
- [ ] 2.7 Implementar botão para remover arquivo

## 3. Criar Componente de Formulário de Template

- [ ] 3.1 Criar `src/features/assinatura-digital/components/templates/template-form-fields.tsx`
- [ ] 3.2 Renderizar campos básicos (nome, descrição, segmento, tipo)
- [ ] 3.3 Renderizar `MarkdownRichTextEditor` condicionalmente (tipo markdown)
- [ ] 3.4 Renderizar `PdfUploadField` condicionalmente (tipo pdf)
- [ ] 3.5 Integrar exibição de erros de validação
- [ ] 3.6 Suportar React Hook Form via props
- [ ] 3.7 Implementar layout responsivo (`grid-cols-1 md:grid-cols-2`)

## 4. Criar Diálogo de Criação de Template

- [ ] 4.1 Criar `src/features/assinatura-digital/components/templates/template-create-dialog.tsx`
- [ ] 4.2 Usar `DialogFormShell` como wrapper
- [ ] 4.3 Gerenciar estado do formulário com React Hook Form + Zod
- [ ] 4.4 Buscar segmentos via `listarSegmentosAction`
- [ ] 4.5 Submeter formulário via `criarTemplateAction`
- [ ] 4.6 Gerenciar estados de loading e erro
- [ ] 4.7 Revalidar cache após sucesso
- [ ] 4.8 Exibir toast de sucesso/erro

## 5. Integrar Diálogo na Página de Listagem

- [ ] 5.1 Adicionar estado para controlar abertura do diálogo em `client-page.tsx`
- [ ] 5.2 Adicionar botão "Novo Template" que abre o diálogo
- [ ] 5.3 Importar `TemplateCreateDialog` de `@/features/assinatura-digital`
- [ ] 5.4 Remover navegação para `/templates/new/markdown`

## 6. Remover Código Duplicado

- [ ] 6.1 Remover `src/app/(dashboard)/assinatura-digital/templates/new/markdown/page.tsx`
- [ ] 6.2 Remover `src/app/(dashboard)/assinatura-digital/templates/new/pdf/page.tsx`
- [ ] 6.3 Remover diretório `src/app/(dashboard)/assinatura-digital/templates/new/`
- [ ] 6.4 Remover `src/app/(dashboard)/assinatura-digital/templates/components/template-create-dialog.tsx` se existir
- [ ] 6.5 Avaliar remoção de `src/features/assinatura-digital/components/editor/CreateTemplateForm.tsx`

## 7. Atualizar Barrel Exports

- [ ] 7.1 Exportar `TemplateCreateDialog` em `src/features/assinatura-digital/index.ts`
- [ ] 7.2 Exportar `TemplateFormFields` em `src/features/assinatura-digital/index.ts`
- [ ] 7.3 Exportar `PdfUploadField` em `src/features/assinatura-digital/index.ts`
- [ ] 7.4 Exportar novos schemas

## 8. Atualizar Rotas de Navegação

- [ ] 8.1 Verificar sidebar/menu por links para `/templates/new`
- [ ] 8.2 Remover links para `/assinatura-digital/templates/new/markdown`
- [ ] 8.3 Remover links para `/assinatura-digital/templates/new/pdf`
- [ ] 8.4 Atualizar breadcrumbs se necessário

## 9. Adicionar Testes

- [ ] 9.1 Criar `src/features/assinatura-digital/components/templates/__tests__/template-create-dialog.test.tsx`
- [ ] 9.2 Criar `src/features/assinatura-digital/components/templates/__tests__/template-form-fields.test.tsx`
- [ ] 9.3 Criar `src/features/assinatura-digital/components/editor/__tests__/pdf-upload-field.test.tsx`
- [ ] 9.4 Testar validação de campos obrigatórios
- [ ] 9.5 Testar upload de PDF com sucesso
- [ ] 9.6 Testar erro ao fazer upload (arquivo muito grande, tipo inválido)
- [ ] 9.7 Testar criação de template markdown
- [ ] 9.8 Testar criação de template PDF
- [ ] 9.9 Testar seleção de segmento
- [ ] 9.10 Testar cancelamento do formulário

## 10. Documentação e Validação Final

- [ ] 10.1 Atualizar `src/features/assinatura-digital/components/README.md` com novos componentes
- [ ] 10.2 Adicionar comentários JSDoc nos componentes
- [ ] 10.3 Testar fluxo completo (criar template PDF)
- [ ] 10.4 Testar fluxo completo (criar template Markdown)
- [ ] 10.5 Validar responsividade (mobile, tablet, desktop)
- [ ] 10.6 Code review e ajustes finais
