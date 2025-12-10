# Change: Remover Arquivos Legados do Módulo Processos

## Why
O módulo de processos foi migrado com sucesso para a nova arquitetura Feature-Sliced Design (FSD) em `src/features/processos/`. Os arquivos legados em múltiplos locais (`src/core/`, `src/app/(dashboard)/processos/components/`, `src/components/modules/processos/`, `src/app/_lib/hooks/`, `src/app/_lib/types/`, `src/app/actions/`) estão duplicados e podem causar confusão de imports, inconsistências e manutenção desnecessária. Esta proposta remove os arquivos legados após validação completa da nova estrutura.

## What Changes
- **REMOVER** 4 arquivos em `src/core/processos/` (domain, repository, service, index)
- **REMOVER** 8 arquivos em `src/app/(dashboard)/processos/components/` (componentes de timeline e toolbar)
- **REMOVER** 1 arquivo em `src/app/(dashboard)/processos/[id]/` (processo-visualizacao.tsx legado)
- **REMOVER** 3 arquivos em `src/components/modules/processos/` (componentes de sheet, form, empty-state)
- **REMOVER** 4 arquivos em `src/app/_lib/hooks/` (hooks de processos)
- **REMOVER** 1 arquivo em `src/app/_lib/types/` (acervo.ts)
- **REMOVER** 1 arquivo em `src/app/actions/` (processos.ts)

**Total: 22 arquivos a serem removidos**

## Impact
- Affected specs:
  - Nenhuma spec afetada - esta é uma limpeza de código duplicado

- Affected code:
  - Nenhum código funcional afetado - todos os imports já foram atualizados para usar `@/features/processos/`
  - Arquivos a serem removidos são órfãos (não mais referenciados)

- Breaking changes: **NENHUMA**
  - Nova estrutura em `src/features/processos/` já está em uso
  - Páginas já foram atualizadas para usar os novos imports
  - Type-check passou sem erros relacionados ao módulo processos

## Validation Completed
- [x] Nova estrutura criada em `src/features/processos/`
- [x] Domain, repository, service migrados
- [x] Componentes migrados para `features/processos/components/`
- [x] Hooks migrados para `features/processos/hooks/`
- [x] Types migrados para `features/processos/types/`
- [x] Actions migradas para `features/processos/actions/`
- [x] Imports nas páginas atualizados
- [x] TypeScript type-check passou (erros encontrados são em arquivos não relacionados)
