# Tasks: Refatorar Sistema de Criacao de Templates

> **NOTA**: A implementacao foi feita em `src/app/(dashboard)/assinatura-digital/feature/` ao inves de `src/features/assinatura-digital/`. A arquitetura e equivalente.

## 1. Consolidar Schemas de Validacao

- [x] 1.1 `createTemplateSchema` consolidado em `feature/types/domain.ts`
- [x] 1.2 Validacoes condicionais (PDF vs Markdown) implementadas
- [x] 1.3 `uploadPdfSchema` criado e exportado via `feature/index.ts`
- [x] 1.4 `templateFormSchema` wrapper criado e exportado
- [x] 1.5 Schemas exportados via barrel export em `feature/index.ts` (linhas 109-117)

## 2. Criar Componente de Upload de PDF

- [x] 2.1 `PdfUploadField` criado em `feature/components/editor/pdf-upload-field.tsx`
- [x] 2.2 Validacao de tipo de arquivo (apenas PDF)
- [x] 2.3 Validacao de tamanho implementada
- [x] 2.4 Integracao com API de upload
- [x] 2.5 Preview do arquivo selecionado
- [x] 2.6 Estados de loading e erro
- [x] 2.7 Botao para remover arquivo

## 3. Criar Componente de Formulario de Template

- [x] 3.1 `TemplateFormFields` criado em `feature/components/templates/template-form-fields.tsx`
- [x] 3.2 Campos basicos (nome, descricao, segmento, tipo)
- [x] 3.3 `MarkdownRichTextEditor` renderizado condicionalmente
- [x] 3.4 `PdfUploadField` renderizado condicionalmente
- [x] 3.5 Exibicao de erros de validacao
- [x] 3.6 Suporte React Hook Form via props
- [x] 3.7 Layout responsivo

## 4. Criar Dialogo de Criacao de Template

- [x] 4.1 `TemplateCreateDialog` criado em `feature/components/templates/template-create-dialog.tsx`
- [x] 4.2 Usa padrao de dialog do projeto
- [x] 4.3 React Hook Form + Zod
- [x] 4.4 Busca segmentos via `listarSegmentosAction`
- [x] 4.5 Submissao via `criarTemplateAction`
- [x] 4.6 Estados de loading e erro
- [x] 4.7 Revalidacao de cache apos sucesso
- [x] 4.8 Toasts de sucesso/erro

## 5. Integrar Dialogo na Pagina de Listagem

- [x] 5.1 Estado `createOpen` em `templates/client-page.tsx` (linha 353)
- [x] 5.2 Botao "Novo Template" com dropdown PDF/Markdown (linhas 509-540)
- [x] 5.3 Import de `TemplateCreateDialog` da feature (linha 41)
- [x] 5.4 Navegacao para `/templates/new` removida

## 6. Remover Codigo Duplicado

- [x] 6.1 `templates/new/markdown/page.tsx` removido
- [x] 6.2 `templates/new/pdf/page.tsx` removido
- [x] 6.3 Diretorio `templates/new/` removido completamente
- [x] 6.4 N/A - nao existia dialog duplicado
- [x] 6.5 `CreateTemplateForm.tsx` mantido para uso interno (exportado em feature/index.ts)

## 7. Atualizar Barrel Exports

- [x] 7.1 `TemplateCreateDialog` exportado em `feature/index.ts` (linha 224)
- [x] 7.2 `TemplateFormFields` exportado em `feature/index.ts` (linha 224)
- [x] 7.3 `PdfUploadField` exportado em `feature/index.ts` (linha 217)
- [x] 7.4 Schemas exportados (linhas 109-117)

## 8. Atualizar Rotas de Navegacao

- [x] 8.1 Sidebar nao tem links para `/templates/new`
- [x] 8.2 Links `/templates/new/markdown` removidos
- [x] 8.3 Links `/templates/new/pdf` removidos
- [x] 8.4 N/A - breadcrumbs nao precisaram atualizacao

## 9. Adicionar Testes

- [ ] 9.1-9.10 Testes unitarios pendentes (backlog - baixa prioridade)

## 10. Documentacao e Validacao Final

- [x] 10.1 Componentes documentados via JSDoc em index.ts
- [x] 10.2 JSDoc presente nos componentes principais
- [x] 10.3 Fluxo PDF testado manualmente - funcional
- [x] 10.4 Fluxo Markdown testado manualmente - funcional
- [x] 10.5 Responsividade validada
- [x] 10.6 Code review concluido (via revisao OpenSpec)
