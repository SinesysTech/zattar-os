# Tasks: Refatorar Modulo de Partes para Feature-Sliced Design

## 1. Criar Estrutura de Diretorios

- [x] 1.1 Criar `src/features/partes/` com subdiretorios
- [x] 1.2 Criar `src/features/partes/index.ts` (barrel exports)

## 2. Migrar Componentes Compartilhados

- [x] 2.1 Migrar `processos-relacionados-cell.tsx` para `features/partes/components/shared/`
- [x] 2.2 Criar `features/partes/components/shared/index.ts`

## 3. Migrar Utils

- [x] 3.1 Migrar `format-clientes.ts` para `features/partes/utils/`
- [x] 3.2 Criar `features/partes/utils/index.ts`

## 4. Migrar Hooks

- [x] 4.1 Migrar `use-partes-contrarias.ts` para `features/partes/hooks/`
- [x] 4.2 Migrar `use-terceiros.ts` para `features/partes/hooks/`
- [x] 4.3 Migrar `use-representantes.ts` para `features/partes/hooks/`
- [x] 4.4 Criar `features/partes/hooks/index.ts`

## 5. Migrar Componentes de Clientes

- [x] 5.1 Migrar `clientes-toolbar-filters.tsx` para `features/partes/components/clientes/`
- [x] 5.2 Migrar `clientes-table-wrapper.tsx` para `features/partes/components/clientes/`
- [x] 5.3 Migrar `cliente-form.tsx` para `features/partes/components/clientes/`
- [x] 5.4 Criar `features/partes/components/clientes/index.ts`

## 6. Migrar Componentes de Partes Contrarias

- [x] 6.1 Migrar `partes-contrarias-tab.tsx` para `features/partes/components/partes-contrarias/`
- [x] 6.2 Migrar `partes-contrarias-toolbar-filters.tsx` para `features/partes/components/partes-contrarias/`
- [x] 6.3 Criar `features/partes/components/partes-contrarias/index.ts`

## 7. Migrar Componentes de Terceiros

- [x] 7.1 Migrar `terceiros-tab.tsx` para `features/partes/components/terceiros/`
- [x] 7.2 Migrar `terceiros-toolbar-filters.tsx` para `features/partes/components/terceiros/`
- [x] 7.3 Criar `features/partes/components/terceiros/index.ts`

## 8. Migrar Componentes de Representantes

- [x] 8.1 Migrar `representantes-tab.tsx` para `features/partes/components/representantes/`
- [x] 8.2 Migrar `representantes-toolbar-filters.tsx` para `features/partes/components/representantes/`
- [x] 8.3 Criar `features/partes/components/representantes/index.ts`

## 9. Atualizar Pages

- [x] 9.1 Atualizar `src/app/(dashboard)/partes/clientes/page.tsx`
- [x] 9.2 Atualizar `src/app/(dashboard)/partes/partes-contrarias/page.tsx`
- [x] 9.3 Atualizar `src/app/(dashboard)/partes/terceiros/page.tsx`
- [x] 9.4 Atualizar `src/app/(dashboard)/partes/representantes/page.tsx`
- [x] 9.5 Atualizar pages de detalhes `[id]/page.tsx`

## 10. Criar Barrel Export Principal

- [x] 10.1 Atualizar `src/features/partes/index.ts` com todos os exports

## 11. Validacao

- [x] 11.1 Rodar `npm run type-check` e corrigir erros
- [x] 11.2 Testar navegacao entre paginas de partes
- [x] 11.3 Testar CRUD de clientes
- [x] 11.4 Testar listagem de partes contrarias
- [x] 11.5 Testar listagem de terceiros
- [x] 11.6 Testar listagem de representantes

## 12. Limpeza

- [x] 12.1 Deletar `src/app/(dashboard)/partes/components/`
- [x] 12.2 Deletar `src/components/modules/partes/`
- [x] 12.3 Deletar hooks migrados de `src/app/_lib/hooks/`
- [x] 12.4 Deletar utils migrados de `src/app/_lib/utils/`
