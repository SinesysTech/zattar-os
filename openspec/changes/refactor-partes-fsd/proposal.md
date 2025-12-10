# Change: Refatorar Modulo de Partes para Feature-Sliced Design

## Why

O modulo de partes (clientes, partes contrarias, terceiros e representantes) esta espalhado em multiplos diretorios com acoplamento inconsistente. A nova arquitetura Feature-Sliced Design (FSD) centraliza todo o codigo relacionado em `src/features/partes/`, facilitando manutencao e garantindo que o codigo reflita a identidade visual do sistema.

## What Changes

### Estrutura de Diretorios

**DE (estrutura atual):**
```
src/app/(dashboard)/partes/components/    # Componentes de UI
src/app/_lib/hooks/use-*.ts               # Hooks espalhados
src/app/_lib/utils/format-clientes.ts     # Utils espalhados
src/components/modules/partes/            # Componentes de modulo
src/core/partes/                          # Domain logic
```

**PARA (nova estrutura FSD):**
```
src/features/partes/
├── components/           # Todos componentes do modulo
│   ├── clientes/        # Componentes especificos de clientes
│   ├── partes-contrarias/
│   ├── terceiros/
│   ├── representantes/
│   └── shared/          # Componentes compartilhados (ProcessosRelacionadosCell, etc)
├── hooks/               # Hooks do modulo
├── utils/               # Utilitarios (formatacao, validacao)
├── types/               # Tipos especificos do modulo
├── api/                 # Funcoes de API (fetch helpers)
└── index.ts             # Barrel exports
```

### Componentes Migrados

- `clientes-toolbar-filters.tsx` -> `features/partes/components/clientes/`
- `partes-contrarias-tab.tsx` -> `features/partes/components/partes-contrarias/`
- `partes-contrarias-toolbar-filters.tsx` -> `features/partes/components/partes-contrarias/`
- `terceiros-tab.tsx` -> `features/partes/components/terceiros/`
- `terceiros-toolbar-filters.tsx` -> `features/partes/components/terceiros/`
- `representantes-tab.tsx` -> `features/partes/components/representantes/`
- `representantes-toolbar-filters.tsx` -> `features/partes/components/representantes/`
- `processos-relacionados-cell.tsx` -> `features/partes/components/shared/`
- `clientes-table-wrapper.tsx` -> `features/partes/components/clientes/`
- `cliente-form.tsx` -> `features/partes/components/clientes/`

### Hooks Migrados

- `use-partes-contrarias.ts` -> `features/partes/hooks/`
- `use-terceiros.ts` -> `features/partes/hooks/`
- `use-representantes.ts` -> `features/partes/hooks/`

### Utils Migrados

- `format-clientes.ts` -> `features/partes/utils/`

### Pages Simplificadas

As pages em `src/app/(dashboard)/partes/` serao simplificadas para apenas:
1. Importar componentes de `@/features/partes`
2. Fazer data fetching server-side quando necessario
3. Renderizar o layout com PageShell

## Impact

- **Specs afetadas:** `frontend-partes`
- **Codigo afetado:**
  - `src/app/(dashboard)/partes/**/*.tsx` - Pages serao atualizadas
  - `src/app/_lib/hooks/` - Hooks serao movidos
  - `src/app/_lib/utils/` - Utils serao movidos
  - `src/components/modules/partes/` - Sera removido
  - `src/app/(dashboard)/partes/components/` - Sera removido
- **Sem breaking changes:** API routes e core/partes permanecem inalterados
- **Retrocompatibilidade:** Nao sera mantida - arquivos antigos serao deletados

## Beneficios

1. **Colocacao:** Todo codigo de partes em um unico lugar
2. **Manutencao:** Alteracoes em partes afetam apenas `features/partes/`
3. **Clareza:** Estrutura previsivel e padronizada
4. **Escalabilidade:** Facil replicar para outros modulos (processos, audiencias, etc)
