# Refactor: Assinatura Digital Module to Feature-Sliced Design

## Why

O módulo de assinatura digital estava espalhado em múltiplos diretórios (`src/core/assinatura-digital/`, `src/components/assinatura-digital/`, `src/app/_lib/assinatura-digital/`, `src/app/_lib/stores/assinatura-digital/`, `src/types/assinatura-digital/`), dificultando a manutenção e compreensão do código. A nova arquitetura Feature-Sliced Design (FSD) centraliza todo o código relacionado em `src/features/assinatura-digital/`.

## What Changes

### **BREAKING**: Reorganização completa da estrutura de arquivos

- **Criação de `src/features/assinatura-digital/`**: Novo módulo centralizado com toda a funcionalidade
- **Remoção de código legado**: Após validação, os seguintes diretórios/arquivos serão removidos:
  - `src/core/assinatura-digital/` (exceto código ainda em uso por outros módulos)
  - `src/app/_lib/assinatura-digital/`
  - `src/app/_lib/stores/assinatura-digital/`
  - `src/types/assinatura-digital/`

### Nova Estrutura

```
src/features/assinatura-digital/
├── index.ts                  # Barrel export principal
├── types/
│   ├── index.ts
│   ├── domain.ts             # Tipos de domínio (Segmento, Template, etc)
│   ├── api.ts                # Tipos de API
│   └── store.ts              # Tipos do Zustand store
├── constants/
│   ├── index.ts
│   ├── estados-civis.ts
│   ├── nacionalidades.ts
│   ├── termos.ts
│   ├── step-config.ts
│   └── api-routes.ts
├── utils/
│   ├── index.ts
│   ├── formatters.ts         # CPF, CNPJ, telefone, CEP, data
│   ├── validators.ts         # Validações de documentos
│   └── device-fingerprint.ts # Fingerprint para conformidade legal
├── store/
│   ├── index.ts
│   └── formulario-store.ts   # Zustand store
├── service.ts                # Lógica de negócio
└── repository.ts             # Acesso ao banco de dados
```

### Imports Atualizados

**Antes:**

```typescript
import { Segmento } from "@/core/assinatura-digital/domain";
import { formatCPF } from "@/app/_lib/assinatura-digital/formatters/cpf";
import { useFormularioStore } from "@/app/_lib/stores/assinatura-digital";
```

**Depois:**

```typescript
import {
  Segmento,
  formatCPF,
  useFormularioStore,
} from "@/features/assinatura-digital";
```

## Impact

### Specs Afetadas

- `openspec/specs/assinatura-digital-assinatura/spec.md` - Módulo de assinatura
- `openspec/specs/assinatura-digital-admin/spec.md` - Admin de assinatura

### Código Afetado

- Todas as páginas em `src/app/(dashboard)/assinatura-digital/`
- Todas as páginas em `src/app/formulario/`
- Todos os componentes em `src/components/assinatura-digital/`
- API routes em `src/app/api/assinatura-digital/`

## Migration Plan

1. ✅ Criar nova estrutura em `src/features/assinatura-digital/`
2. ✅ Migrar tipos, constantes, utils, store, service e repository
3. ✅ Validar compilação TypeScript
4. ⬜ Atualizar imports nas páginas e componentes (próxima fase)
5. ⬜ Migrar componentes para a feature (próxima fase)
6. ⬜ Testar funcionalidades
7. ⬜ Remover código legado
