# Change: Refatoração Completa + Templates de Texto para Assinatura Digital

## Why

O módulo de assinatura digital apresenta problemas críticos de organização, segurança e manutenibilidade que precisam ser resolvidos:

1. **Segurança**: 7 TODOs de verificação de permissões não implementados em `actions.ts`
2. **Tipos fragmentados**: Tipos espalhados em 3 locais diferentes com interfaces duplicadas (`TemplateCampo` tem 2 versões)
3. **Componentes duplicados**: `components/form/inputs/` duplica `components/inputs/`
4. **Código monolítico**: `FieldMappingEditor.tsx` tem 2229 linhas, impossível de manter
5. **Sem integração com Processos**: Documentos assinados não têm relação com processos judiciais
6. **Funcionalidade limitada**: Apenas suporta templates PDF, sem criação de documentos de texto

Esta change resolve todos esses problemas e adiciona a funcionalidade de Templates de Texto.

## What Changes

### Fase 1: Correções Críticas de Segurança e Tipos

#### Verificação de Permissões
- Implementar verificação `formsign_admin` em todas as 7 actions sem proteção
- Criar helper `checkAssinaturaDigitalPermission()` reutilizável

#### Consolidação de Tipos
- Mover tipos de `src/types/assinatura-digital/` para `src/features/assinatura-digital/types/`
- Unificar `TemplateCampo` (manter versão portuguesa de `template.types.ts`)
- Remover definição duplicada em `types/domain.ts`
- Atualizar barrel export em `types/index.ts`

#### Remoção de Componentes Duplicados
- Excluir `components/form/inputs/client-search-input.tsx`
- Excluir `components/form/inputs/parte-contraria-search-input.tsx`
- Atualizar imports em `dynamic-form-renderer.tsx`

#### Integração com Processos
- Adicionar campo `processo_id` em templates e assinaturas
- Adicionar variáveis de processo: `@processo.numero`, `@processo.vara`, etc.
- Vincular documentos assinados a processos específicos

### Fase 2: Refatoração de Componentes

#### Dividir FieldMappingEditor
Dividir componente de 2229 linhas em estrutura modular:
- `FieldMappingEditor.tsx` - Orquestrador (~300 linhas)
- `PdfCanvas/` - Componentes de canvas
- `FieldProperties/` - Edição de propriedades
- `hooks/` - Lógica extraída (useFieldDrag, useZoomPan, useAutosave)

#### Extrair Hooks Comuns
- `useTemplates()` - Fetch e gerenciamento de templates
- `useFormularios()` - Fetch e gerenciamento de formulários
- `useSegmentos()` - Fetch e gerenciamento de segmentos
- `useDataFetch<T>()` - Hook genérico de fetch

#### Componentes Base para Dialogs
- `BaseDeleteDialog` - Dialog genérico de exclusão
- `BaseDuplicateDialog` - Dialog genérico de duplicação

### Fase 3: Templates de Texto (Nova Funcionalidade)

#### Novos Componentes
- **TemplateTypeSelector**: Seleção entre "Upload de PDF" e "Documento de Texto"
- **TemplateTextoCreateForm**: Formulário de criação com Plate Editor
- **TemplateTextoEditor**: Editor completo para templates texto
- **TemplateTextoToolbar**: Toolbar com formatação e inserção de variáveis
- **TemplateTextoPreviewModal**: Modal de preview do PDF gerado
- **VariaveisPlugin**: Plugin do Plate para menções (@variavel)

#### Novos Serviços
- **template-texto-pdf.service**: Conversão Plate → HTML → PDF via Puppeteer
- **template-texto-html.template**: Template HTML base para A4

#### Novas Actions e API Routes
- **templates-texto-actions**: Server actions para CRUD
- **preview-texto/route.ts**: API de preview PDF

### Fase 4: Limpeza e Documentação

- Remover debug logging excessivo de `FieldMappingEditor.tsx`
- Remover código comentado
- Extrair `inputClassName` para utilitário compartilhado
- Atualizar documentação

## Impact

- Affected specs: `assinatura-digital` (nova spec com 10 requirements)
- Affected code:
  - `src/features/assinatura-digital/` (todo o módulo)
  - `src/types/assinatura-digital/` (consolidar em features)
  - `src/app/(dashboard)/assinatura-digital/`
  - `src/app/api/assinatura-digital/`

## Compatibility Notes

- **100% retrocompatível** com templates PDF existentes
- Templates PDF continuam funcionando sem modificações
- Fluxo de assinatura detecta automaticamente o tipo de template
- Campos deprecated (`acao_id`) mantidos para retrocompatibilidade
- Integração com Processos é opcional (processo_id pode ser null)

## Metrics

| Métrica | Antes | Depois |
|---------|-------|--------|
| TODOs de segurança | 7 | 0 |
| Locais de tipos | 3 | 1 |
| Interfaces duplicadas | 2 | 1 |
| Linhas FieldMappingEditor | 2229 | ~300 |
| Componentes duplicados | 2 | 0 |
| Hooks inline | 3 | 0 |
