# Tasks: Refatorar módulo de Contratos para Feature-Sliced Design

## 1. Migração (Concluída)

- [x] 1.1 Criar estrutura de pastas `src/features/contratos/`
- [x] 1.2 Migrar types (domain.ts + tipos frontend) → `types.ts`
- [x] 1.3 Migrar utils de formatação → `utils.ts`
- [x] 1.4 Migrar hooks (use-contratos) → `hooks.ts`
- [x] 1.5 Migrar server actions → `actions.ts`
- [x] 1.6 Migrar repository → `repository.ts`
- [x] 1.7 Migrar service → `service.ts`
- [x] 1.8 Migrar componentes → `components/`
- [x] 1.9 Criar index.ts com re-exports públicos
- [x] 1.10 Atualizar página `page.tsx` para usar novos imports

## 2. Validação (Concluída)

- [x] 2.1 Verificar compilação TypeScript sem erros relacionados a contratos
- [x] 2.2 Verificar que a página de contratos carrega corretamente

## 3. Limpeza (Pendente - Após Aprovação)

- [ ] 3.1 Remover `src/core/contratos/` (domain.ts, service.ts, repository.ts, index.ts)
- [ ] 3.2 Remover `src/components/modules/contratos/` (todos os arquivos)
- [ ] 3.3 Remover `src/app/_lib/types/contratos.ts`
- [ ] 3.4 Remover `src/app/_lib/utils/format-contratos.ts`
- [ ] 3.5 Remover `src/app/_lib/hooks/use-contratos.ts`
- [ ] 3.6 Remover `src/app/actions/contratos.ts`
- [ ] 3.7 Remover `src/app/(dashboard)/contratos/components/contratos-toolbar-filters.tsx`
- [ ] 3.8 Verificar se há outros arquivos referenciando os arquivos removidos
- [ ] 3.9 Executar build final para confirmar que tudo funciona

## 4. Documentação

- [ ] 4.1 Atualizar CLAUDE.md se necessário com nova estrutura de features
