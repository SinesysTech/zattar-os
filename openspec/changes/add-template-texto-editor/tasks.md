# Tasks: Adicionar Templates de Texto

## 1. Extensão do Schema e Tipos

- [ ] 1.1 Atualizar `src/features/assinatura-digital/types/template.types.ts` com:
  - Interface `TemplateTexto` (conteudo_plate, variaveis_usadas, configuracao_pagina)
  - Type guards `isTemplatePdf()` e `isTemplateTexto()`
  - Tipos `VariavelMention` e `VariavelNode` para sistema de variáveis inline
- [ ] 1.2 Criar `src/features/assinatura-digital/domain.ts` com:
  - Schema Zod `templateTextoSchema` para validação de conteúdo Plate
  - Schema unificado `templateSchema` com discriminated union por `tipo_template`

## 2. Componentes de Seleção e Criação

- [ ] 2.1 Criar `src/app/(dashboard)/assinatura-digital/templates/components/template-type-selector.tsx`:
  - Cards clicáveis para "Upload de PDF" e "Documento de Texto"
  - Estado `selectedType` com visual feedback de seleção
- [ ] 2.2 Refatorar `src/app/(dashboard)/assinatura-digital/templates/components/template-create-dialog.tsx`:
  - Adicionar step inicial com `TemplateTypeSelector`
  - Renderização condicional por tipo selecionado
- [ ] 2.3 Criar `src/features/assinatura-digital/components/editor/TemplateTextoCreateForm.tsx`:
  - Campos: nome, descrição, status
  - Integração com Plate Editor
  - Botão de salvar que serializa conteúdo

## 3. Sistema de Variáveis no Editor

- [ ] 3.1 Criar `src/features/assinatura-digital/components/editor/VariaveisPlugin.tsx`:
  - Plugin customizado do Plate para menções (@variavel)
  - Autocompletar com lista de `TipoVariavel`
  - Renderização destacada (badge/chip inline)
  - Tracking de variáveis usadas
- [ ] 3.2 Criar `src/features/assinatura-digital/components/editor/TemplateTextoToolbar.tsx`:
  - Botões de formatação (negrito, itálico, sublinhado)
  - Dropdown/combobox de variáveis disponíveis
  - Botão "Inserir Variável"

## 4. Editor de Templates de Texto

- [ ] 4.1 Criar `src/features/assinatura-digital/components/editor/TemplateTextoEditor.tsx`:
  - Componente principal de edição
  - Carregamento de `conteudo_plate` do banco
  - Integração com toolbar e plugin de variáveis
  - Autosave opcional
- [ ] 4.2 Criar `src/app/(dashboard)/assinatura-digital/templates/[id]/edit-texto/page.tsx`:
  - Layout com sidebar (info, variáveis, configurações)
  - Botão de preview
- [ ] 4.3 Criar `src/features/assinatura-digital/components/editor/TemplateTextoPreviewModal.tsx`:
  - Geração de PDF via API
  - Renderização com `PdfPreviewDynamic`
  - Controles de zoom e navegação

## 5. Serviço de Conversão PDF

- [ ] 5.1 Criar `src/features/assinatura-digital/services/template-texto-html.template.ts`:
  - Template HTML base com estilos A4
  - Função `renderPlateToHtml()` com substituição de variáveis
  - CSS para formatação profissional
- [ ] 5.2 Criar `src/features/assinatura-digital/services/template-texto-pdf.service.ts`:
  - Função `generatePdfFromTexto()`:
    1. Serializar Plate → HTML
    2. Substituir variáveis
    3. Aplicar CSS A4
    4. Gerar PDF via Puppeteer
  - Pool de instâncias reutilizáveis do Puppeteer

## 6. Actions e API Routes

- [ ] 6.1 Criar `src/features/assinatura-digital/actions/templates-texto-actions.ts`:
  - `actionCriarTemplateTexto()`
  - `actionAtualizarTemplateTexto()`
  - `actionPreviewTemplateTexto()`
- [ ] 6.2 Criar `src/app/api/assinatura-digital/templates/[id]/preview-texto/route.ts`:
  - Endpoint GET para preview PDF
  - Cache Redis para evitar regeneração

## 7. Integração com Fluxo de Assinatura

- [ ] 7.1 Atualizar `src/features/assinatura-digital/service.ts`:
  - Detectar `tipo_template` e chamar serviço apropriado
  - Manter compatibilidade com templates PDF
  - Aplicar manifesto de assinatura em ambos os tipos

## 8. Interface de Listagem

- [ ] 8.1 Atualizar `src/app/(dashboard)/assinatura-digital/templates/client-page.tsx`:
  - Coluna "Tipo" com badges (PDF/Texto)
  - Filtro por tipo de template
  - Ações contextuais por tipo (edit vs edit-texto)

## 9. Testes

- [ ] 9.1 Criar testes unitários em `src/features/assinatura-digital/__tests__/unit/template-texto.service.test.ts`:
  - Conversão Plate → HTML
  - Substituição de variáveis
  - Geração de PDF (mock Puppeteer)
- [ ] 9.2 Criar testes de integração em `src/features/assinatura-digital/__tests__/integration/templates-texto.integration.test.ts`:
  - CRUD de templates texto
  - Geração de preview
- [ ] 9.3 Criar testes E2E em `e2e/assinatura-digital/templates-texto.spec.ts`:
  - Fluxo completo: criar → editar → preview → assinar

## 10. Documentação

- [ ] 10.1 Criar `docs/assinatura-digital/templates-texto.md`:
  - Diferença entre templates PDF e Texto
  - Guia de uso do sistema de variáveis
  - Exemplos de templates comuns
  - Troubleshooting de conversão PDF
