# Tasks: Refatorar Modulo de Partes para Feature-Sliced Design

## 1. Criar Estrutura de Diretorios

- [ ] 1.1 Criar `src/features/partes/` com subdiretorios
- [ ] 1.2 Criar `src/features/partes/index.ts` (barrel exports)

## 2. Migrar Componentes Compartilhados

- [ ] 2.1 Migrar `processos-relacionados-cell.tsx` para `features/partes/components/shared/`
- [ ] 2.2 Criar `features/partes/components/shared/index.ts`

## 3. Migrar Utils

- [ ] 3.1 Migrar `format-clientes.ts` para `features/partes/utils/`
- [ ] 3.2 Criar `features/partes/utils/index.ts`

## 4. Migrar Hooks

- [ ] 4.1 Migrar `use-partes-contrarias.ts` para `features/partes/hooks/`
- [ ] 4.2 Migrar `use-terceiros.ts` para `features/partes/hooks/`
- [ ] 4.3 Migrar `use-representantes.ts` para `features/partes/hooks/`
- [ ] 4.4 Criar `features/partes/hooks/index.ts`

## 5. Migrar Componentes de Clientes

- [ ] 5.1 Migrar `clientes-toolbar-filters.tsx` para `features/partes/components/clientes/`
- [ ] 5.2 Migrar `clientes-table-wrapper.tsx` para `features/partes/components/clientes/`
- [ ] 5.3 Migrar `cliente-form.tsx` para `features/partes/components/clientes/`
- [ ] 5.4 Criar `features/partes/components/clientes/index.ts`

## 6. Migrar Componentes de Partes Contrarias

- [ ] 6.1 Migrar `partes-contrarias-tab.tsx` para `features/partes/components/partes-contrarias/`
- [ ] 6.2 Migrar `partes-contrarias-toolbar-filters.tsx` para `features/partes/components/partes-contrarias/`
- [ ] 6.3 Criar `features/partes/components/partes-contrarias/index.ts`

## 7. Migrar Componentes de Terceiros

- [ ] 7.1 Migrar `terceiros-tab.tsx` para `features/partes/components/terceiros/`
- [ ] 7.2 Migrar `terceiros-toolbar-filters.tsx` para `features/partes/components/terceiros/`
- [ ] 7.3 Criar `features/partes/components/terceiros/index.ts`

## 8. Migrar Componentes de Representantes

- [ ] 8.1 Migrar `representantes-tab.tsx` para `features/partes/components/representantes/`
- [ ] 8.2 Migrar `representantes-toolbar-filters.tsx` para `features/partes/components/representantes/`
- [ ] 8.3 Criar `features/partes/components/representantes/index.ts`

## 9. Atualizar Pages

- [ ] 9.1 Atualizar `src/app/(dashboard)/partes/clientes/page.tsx`
- [ ] 9.2 Atualizar `src/app/(dashboard)/partes/partes-contrarias/page.tsx`
- [ ] 9.3 Atualizar `src/app/(dashboard)/partes/terceiros/page.tsx`
- [ ] 9.4 Atualizar `src/app/(dashboard)/partes/representantes/page.tsx`
- [ ] 9.5 Atualizar pages de detalhes `[id]/page.tsx`

## 10. Criar Barrel Export Principal

- [ ] 10.1 Atualizar `src/features/partes/index.ts` com todos os exports

## 11. Validacao

- [ ] 11.1 Rodar `npm run type-check` e corrigir erros
- [ ] 11.2 Testar navegacao entre paginas de partes
- [ ] 11.3 Testar CRUD de clientes
- [ ] 11.4 Testar listagem de partes contrarias
- [ ] 11.5 Testar listagem de terceiros
- [ ] 11.6 Testar listagem de representantes

## 12. Limpeza

- [ ] 12.1 Deletar `src/app/(dashboard)/partes/components/`
- [ ] 12.2 Deletar `src/components/modules/partes/`
- [ ] 12.3 Deletar hooks migrados de `src/app/_lib/hooks/`
- [ ] 12.4 Deletar utils migrados de `src/app/_lib/utils/`
