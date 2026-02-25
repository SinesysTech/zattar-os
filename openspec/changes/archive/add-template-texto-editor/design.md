# Design: Refatoração Completa + Templates de Texto

## Context

O módulo de assinatura digital (`src/features/assinatura-digital/`) apresenta problemas críticos identificados em análise:

**Problemas de Segurança:**

- 7 TODOs de verificação de permissões em `actions.ts`

**Problemas de Organização:**

- Tipos fragmentados em 3 locais diferentes
- Interface `TemplateCampo` duplicada (versão portuguesa e inglesa)
- Componentes duplicados em `components/form/inputs/`
- `FieldMappingEditor.tsx` com 2229 linhas

**Problemas de Integração:**

- Sem vínculo com processos judiciais
- Templates apenas via upload de PDF

**Stakeholders**: Equipe de desenvolvimento, usuários administrativos.

**Constraints**:

- Manter 100% de compatibilidade com templates PDF existentes
- Seguir arquitetura FSD (Feature-Sliced Design)
- Utilizar componentes shadcn/ui existentes
- Manter conformidade legal (hash SHA-256, manifesto de assinatura)

## Goals / Non-Goals

### Goals

- Corrigir vulnerabilidades de segurança (permissões)
- Consolidar tipos em único local (`src/features/assinatura-digital/types/`)
- Unificar `TemplateCampo` (versão portuguesa)
- Dividir `FieldMappingEditor` em componentes menores
- Adicionar integração com Processos
- Permitir criação de templates de texto com Plate Editor
- Gerar PDFs A4 profissionais a partir de templates texto

### Non-Goals

- Migrar templates PDF existentes para texto
- Suportar formatação avançada (tabelas complexas, imagens inline) na v1
- Refatorar outros módulos do sistema

## Decisions

### 1. Consolidação de Tipos

**Decisão**: Mover todos os tipos de `src/types/assinatura-digital/` para `src/features/assinatura-digital/types/`.

**Rationale**: Seguir arquitetura FSD - cada feature deve conter seus próprios tipos.

**Arquivos afetados:**

- `pdf-preview.types.ts` → mover
- `form-schema.types.ts` → mover
- `segmento.types.ts` → mover
- `cliente-adapter.types.ts` → mover

### 2. Unificação de TemplateCampo

**Decisão**: Manter versão portuguesa de `template.types.ts`, remover duplicata de `domain.ts`.

**Rationale**:

- Versão portuguesa está alinhada com campos do banco de dados (snake_case)
- Já é usada nos componentes principais (`FieldMappingEditor`, `PdfCanvasArea`)

**Estrutura mantida:**

```typescript
// template.types.ts (MANTER)
interface TemplateCampo {
  id: string;
  nome?: string;
  tipo:
    | "texto"
    | "assinatura"
    | "foto"
    | "texto_composto"
    | "data"
    | "cpf"
    | "cnpj";
  variavel?: TipoVariavel;
  posicao?: PosicaoCampo;
  estilo?: EstiloCampo;
  valor_padrao?: string;
  conteudo_composto?: ConteudoComposto;
  obrigatorio?: boolean;
}
```

**Atualização do barrel export:**

```typescript
// types/index.ts
export type { TemplateCampo } from "./template.types";
// Remover: export type { TemplateCampo } from './domain';
// Remover: export type { TemplateCampo as TemplateCampoPdf } from './template.types';
```

### 3. Integração com Processos

**Decisão**: Adicionar campo `processo_id` opcional em templates e assinaturas.

**Rationale**: Documentos assinados frequentemente estão relacionados a processos judiciais (prestação de contas, procurações, termos).

**Novas variáveis em `TipoVariavel`:**

```typescript
| "processo.numero"
| "processo.vara"
| "processo.comarca"
| "processo.data_autuacao"
| "processo.valor_causa"
| "processo.tipo"
```

**Migration SQL:**

```sql
ALTER TABLE assinatura_digital_templates ADD COLUMN processo_id UUID REFERENCES processos(id);
ALTER TABLE assinatura_digital_assinaturas ADD COLUMN processo_id UUID REFERENCES processos(id);
```

### 4. Divisão do FieldMappingEditor

**Decisão**: Dividir em estrutura modular com hooks extraídos.

**Nova estrutura:**

```
components/editor/
├── FieldMappingEditor.tsx      # Orquestrador (~300 linhas)
├── hooks/
│   ├── useFieldDrag.ts         # Lógica de drag/drop
│   ├── useFieldSelection.ts    # Seleção de campos
│   ├── useZoomPan.ts           # Zoom e pan do canvas
│   ├── useAutosave.ts          # Autosave debounced
│   └── index.ts
├── PdfCanvas/
│   ├── PdfCanvasArea.tsx       # Renderização do canvas
│   ├── CanvasToolbar.tsx       # Toolbar de zoom/navegação
│   ├── FieldDragLayer.tsx      # Overlay de drag
│   └── index.ts
├── FieldProperties/
│   ├── PropertiesPopover.tsx   # Edição de propriedades
│   ├── FieldTypeSelector.tsx   # Seletor de tipo
│   └── index.ts
└── TemplateInfo/
    ├── TemplateInfoPopover.tsx # Metadados
    ├── AutosaveIndicator.tsx   # Status de salvamento
    └── index.ts
```

### 5. Templates de Texto

**Decisão**: Usar Plate Editor com plugin de menções para variáveis, Puppeteer para geração de PDF.

**Armazenamento:**

```typescript
interface TemplateTexto {
  tipo_template: "markdown";
  conteudo_plate: Descendant[]; // JSON do Plate
  variaveis_usadas: TipoVariavel[]; // Tracking
  configuracao_pagina: {
    margem: number; // em cm
    fonte: string; // Helvetica, Arial, Times
    tamanho_fonte: number; // em pt
  };
}
```

**Fluxo de conversão:**

```
Plate JSON → HTML (serializer) → CSS A4 → Puppeteer → PDF
```

### 6. Verificação de Permissões

**Decisão**: Criar helper `checkAssinaturaDigitalPermission()` reutilizável.

**Implementação:**

```typescript
// utils/permissions.ts
export async function checkAssinaturaDigitalPermission(
  supabase: SupabaseClient,
  userId: string,
  action: "read" | "write" | "delete",
): Promise<boolean> {
  const { data } = await supabase
    .from("usuarios")
    .select("papel, permissoes")
    .eq("id", userId)
    .single();

  return (
    data?.papel === "admin" ||
    data?.permissoes?.includes("assinatura_digital_admin")
  );
}
```

## Risks / Trade-offs

| Risco                                         | Mitigação                                               |
| --------------------------------------------- | ------------------------------------------------------- |
| Quebra de imports após consolidação de tipos  | Script de atualização automática; testes de build       |
| FieldMappingEditor pode ter bugs após divisão | Testes unitários por hook; testes E2E do fluxo completo |
| Puppeteer é pesado (memória)                  | Pool de instâncias; limite de concorrência              |
| Variáveis de processo podem não existir       | Validação no momento de uso; fallback para string vazia |

## Migration Plan

### Fase 1: Tipos e Segurança (Sem breaking changes)

1. Criar helper de permissões
2. Implementar verificações em actions
3. Copiar (não mover) tipos para novo local
4. Atualizar imports gradualmente
5. Remover tipos antigos após validação

### Fase 2: Componentes (Refatoração interna)

1. Extrair hooks primeiro (baixo risco)
2. Criar novos componentes
3. Atualizar FieldMappingEditor para usar novos componentes
4. Remover código duplicado após validação

### Fase 3: Nova Funcionalidade (Aditiva)

1. Implementar tipos e schemas
2. Criar componentes de UI
3. Implementar serviço de PDF
4. Integrar com fluxo existente

### Fase 4: Limpeza (Após estabilização)

1. Remover debug logging
2. Extrair className compartilhado
3. Atualizar documentação

**Rollback**: Cada fase pode ser revertida independentemente. Templates PDF continuam funcionando em qualquer cenário.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ESTRUTURA ATUAL (ANTES)                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  src/types/assinatura-digital/     src/features/assinatura-digital/types/   │
│  ├── pdf-preview.types.ts          ├── domain.ts (TemplateCampo v2)         │
│  ├── form-schema.types.ts          ├── template.types.ts (TemplateCampo v1) │
│  └── segmento.types.ts             └── types.ts                             │
│                                                                              │
│  src/features/assinatura-digital/components/                                 │
│  ├── form/inputs/                  ├── inputs/                              │
│  │   ├── client-search-input.tsx   │   ├── client-search-input.tsx (DUP!)  │
│  │   └── parte-contraria-...       │   └── parte-contraria-...             │
│  └── editor/                                                                 │
│      └── FieldMappingEditor.tsx (2229 linhas!)                              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

                                    ↓ REFATORAÇÃO ↓

┌─────────────────────────────────────────────────────────────────────────────┐
│                          ESTRUTURA NOVA (DEPOIS)                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  src/features/assinatura-digital/                                            │
│  ├── types/                                                                  │
│  │   ├── domain.ts              # Schemas Zod, enums                        │
│  │   ├── template.types.ts      # TemplateCampo (única versão)              │
│  │   ├── pdf-preview.types.ts   # Movido de src/types/                      │
│  │   ├── form-schema.types.ts   # Movido de src/types/                      │
│  │   └── index.ts               # Barrel export unificado                   │
│  │                                                                           │
│  ├── hooks/                     # NOVO                                       │
│  │   ├── use-templates.ts                                                    │
│  │   ├── use-formularios.ts                                                  │
│  │   ├── use-segmentos.ts                                                    │
│  │   └── index.ts                                                            │
│  │                                                                           │
│  ├── components/                                                             │
│  │   ├── inputs/                # Única fonte (sem duplicação)               │
│  │   ├── dialogs/               # NOVO: BaseDeleteDialog, BaseDuplicateDialog│
│  │   └── editor/                                                             │
│  │       ├── FieldMappingEditor.tsx  (~300 linhas)                          │
│  │       ├── hooks/             # useFieldDrag, useZoomPan, etc.            │
│  │       ├── PdfCanvas/         # PdfCanvasArea, CanvasToolbar              │
│  │       ├── FieldProperties/   # PropertiesPopover, FieldTypeSelector      │
│  │       ├── TemplateInfo/      # TemplateInfoPopover, AutosaveIndicator    │
│  │       └── texto/             # NOVO: TemplateTextoEditor, VariaveisPlugin│
│  │                                                                           │
│  └── utils/                                                                  │
│      ├── permissions.ts         # NOVO: checkAssinaturaDigitalPermission    │
│      ├── input-styles.ts        # NOVO: className compartilhado             │
│      └── campos-parser.ts       # NOVO: parseCampos seguro                  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Open Questions

- [x] Versão de TemplateCampo a manter? → Portuguesa (template.types.ts)
- [x] Consolidar tipos onde? → `src/features/assinatura-digital/types/`
- [x] Integração com Processos nesta change? → Sim
- [x] Dividir FieldMappingEditor como? → Em ~5 componentes com hooks extraídos
- [ ] Limite de tamanho para templates de texto?
- [ ] Quais fontes disponibilizar para templates texto?
