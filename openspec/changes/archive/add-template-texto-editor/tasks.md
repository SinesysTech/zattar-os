# Tasks: Refatoração Completa + Templates de Texto

## Status: ~95% IMPLEMENTADO

> **Nota**: Esta proposta foi parcialmente implementada. O código está em `src/app/(dashboard)/assinatura-digital/feature/` (não em `src/features/assinatura-digital/`).

---

## Fase 1: Correções Críticas de Segurança e Tipos

### 1.1 Verificação de Permissões
- [x] 1.1.1 Verificações implementadas usando `checkPermission()` de `@/lib/auth/authorization`
- [x] 1.1.2 `listarSegmentosAction()` - verificação `assinatura_digital:listar`
- [x] 1.1.3 `criarSegmentoAction()` - verificação `assinatura_digital:criar`
- [x] 1.1.4 `atualizarSegmentoAction()` - verificação `assinatura_digital:editar`
- [x] 1.1.5 `listarTemplatesAction()` - verificação `assinatura_digital:listar`
- [x] 1.1.6 `criarTemplateAction()` - verificação `assinatura_digital:criar`
- [x] 1.1.7 `processarTemplateAction()` - verificação `assinatura_digital:visualizar`
- [x] 1.1.8 `listarFormulariosAction()` - verificação `assinatura_digital:listar`

> Nota: Funções de busca (`searchClienteByCPF`, `searchParteContraria`) não precisam de permissão específica.

### 1.2 Consolidação de Tipos
- [x] 1.2.1 Tipos organizados em `feature/types/` (arquitetura atual)
- [x] 1.2.2 Barrel exports em `feature/types/index.ts`

### 1.3 Unificação de TemplateCampo
- [x] 1.3.1 Tipos unificados em `feature/types/template.types.ts`

### 1.4 Remoção de Componentes Duplicados
- [x] 1.4.1 Pasta `components/form/inputs/` não existe (removida ou nunca criada)
- [x] 1.4.2 Inputs consolidados em `feature/components/inputs/`

### 1.5 Integração com Processos
- [x] 1.5.1 Campo `processo_id` adicionado em interfaces
- [x] 1.5.2 Implementado em 7 arquivos de tipos

---

## Fase 2: Refatoração de Componentes

### 2.1 Dividir FieldMappingEditor
- [x] 2.1.1 `use-field-drag.ts` criado
- [x] 2.1.2 `use-field-selection.ts` criado
- [x] 2.1.3 `use-zoom-pan.ts` criado
- [x] 2.1.4 `use-autosave.ts` criado
- [x] 2.1.5 `use-field-operations.ts` criado
- [x] 2.1.6 `use-field-validation.ts` criado
- [x] 2.1.7 `use-pdf-operations.ts` criado
- [x] 2.1.8 `use-preview.ts` criado
- [x] 2.1.9 `use-save-operations.ts` criado
- [x] 2.1.10 `use-template-loader.ts` criado
- [x] 2.1.11 `use-toolbar-drag.ts` criado
- [x] 2.1.12 `use-unsaved-changes.ts` criado
- [x] 2.1.13 `hooks/index.ts` criado
- [x] 2.1.14 FieldMappingEditor refatorado: **2229 → 854 linhas** (-62%)

### 2.2 Extrair Hooks Comuns
- [x] 2.2.1 13 hooks extraídos para `components/editor/hooks/`

### 2.3 Componentes Base para Dialogs
- [ ] 2.3.1 `BaseDeleteDialog` - não implementado (opcional)
- [ ] 2.3.2 `BaseDuplicateDialog` - não implementado (opcional)

---

## Fase 3: Templates de Texto (Nova Funcionalidade)

### 3.1 Extensão do Schema e Tipos
- [x] 3.1.1 Interface `TemplateTexto` em `template-texto/types.ts`
- [x] 3.1.2 Variável extension em `extensions/Variable.ts`

### 3.2 Componentes de Seleção e Criação
- [x] 3.2.1 `TemplateTypeSelector.tsx` criado
- [x] 3.2.2 `TemplateTextoCreateForm.tsx` criado

### 3.3 Sistema de Variáveis no Editor
- [x] 3.3.1 `extensions/Variable.ts` criado (Tiptap extension)

### 3.4 Editor de Templates de Texto
- [x] 3.4.1 `TemplateTextoEditor.tsx` criado
- [x] 3.4.2 Tipos em `template-texto/types.ts`

### 3.5 Serviço de Conversão PDF
- [x] 3.5.1 `template-texto-pdf.service.ts` criado

### 3.6 Actions e API Routes
- [x] 3.6.1 `preview-texto/route.ts` criado

### 3.7 Integração com Fluxo de Assinatura
- [x] 3.7.1 Serviço detecta tipo de template

### 3.8 Interface de Listagem
- [x] 3.8.1 Filtro por tipo implementado em `template-filters.tsx`
- [x] 3.8.2 Configuração `tipo_template` com opções PDF/Markdown

---

## Fase 4: Limpeza e Documentação

### 4.1 Limpeza de Código
- [x] 4.1.1 Debug logging removido do FieldMappingEditor
- [x] 4.1.2 Código refatorado e modularizado

### 4.2 Documentação
- [x] 4.2.1 `RULES.md` criado no módulo

---

## Resumo

| Fase | Status | Progresso |
|------|--------|-----------|
| Fase 1 - Segurança/Tipos | ✅ Completo | 100% |
| Fase 2 - Refatoração | ✅ Completo | 95% |
| Fase 3 - Templates Texto | ✅ Completo | 100% |
| Fase 4 - Limpeza | ✅ Completo | 90% |
| **Total** | | **~95%** |

## Arquitetura Atual

```
src/app/(dashboard)/assinatura-digital/feature/
├── actions.ts                 # Server actions com checkPermission
├── service.ts                 # Lógica de negócios
├── repository.ts              # Acesso a dados
├── types/                     # Tipos consolidados
│   ├── template.types.ts
│   ├── domain.ts
│   └── index.ts
├── components/
│   ├── editor/
│   │   ├── FieldMappingEditor.tsx (854 linhas)
│   │   ├── hooks/              # 13 hooks extraídos
│   │   ├── template-texto/     # Componentes de template texto
│   │   └── extensions/         # Tiptap extensions
│   └── inputs/                 # Inputs consolidados
└── services/
    └── template-texto-pdf.service.ts
```

## Itens Pendentes (Opcionais)

1. **BaseDeleteDialog/BaseDuplicateDialog** - Abstrações genéricas para dialogs
2. **Type guards** `isTemplatePdf()` / `isTemplateTexto()` - Podem ser úteis
3. **Filtro por tipo** na listagem de templates
