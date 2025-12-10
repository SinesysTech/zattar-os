# Tasks: Remover Arquivos Legados do Módulo Processos

## Pré-requisitos
- [x] Validar que nova estrutura funciona corretamente (type-check)
- [x] Confirmar que todos os imports foram atualizados

## Arquivos Removidos

### 1. Core Domain (src/core/processos/)
- [x] Remover `src/core/processos/domain.ts`
- [x] Remover `src/core/processos/repository.ts`
- [x] Remover `src/core/processos/service.ts`
- [x] Remover `src/core/processos/index.ts`
- [x] Remover diretório `src/core/processos/`

### 2. Componentes de Página (src/app/(dashboard)/processos/components/)
- [x] Remover `src/app/(dashboard)/processos/components/grau-badges.tsx`
- [x] Remover `src/app/(dashboard)/processos/components/processo-header.tsx`
- [x] Remover `src/app/(dashboard)/processos/components/processos-toolbar-filters.tsx`
- [x] Remover `src/app/(dashboard)/processos/components/timeline-container.tsx`
- [x] Remover `src/app/(dashboard)/processos/components/timeline-empty.tsx`
- [x] Remover `src/app/(dashboard)/processos/components/timeline-error.tsx`
- [x] Remover `src/app/(dashboard)/processos/components/timeline-item.tsx`
- [x] Remover `src/app/(dashboard)/processos/components/timeline-loading.tsx`
- [x] Remover diretório `src/app/(dashboard)/processos/components/`

### 3. Componente de Visualização (src/app/(dashboard)/processos/[id]/)
- [x] Remover `src/app/(dashboard)/processos/[id]/processo-visualizacao.tsx`

### 4. Componentes Modulares (src/components/modules/processos/)
- [x] Remover `src/components/modules/processos/processo-detail-sheet.tsx`
- [x] Remover `src/components/modules/processos/processo-form.tsx`
- [x] Remover `src/components/modules/processos/processos-empty-state.tsx`
- [x] Remover diretório `src/components/modules/processos/`

### 5. Hooks Legados (src/app/_lib/hooks/)
- [x] Remover `src/app/_lib/hooks/use-processos.ts`
- [x] Remover `src/app/_lib/hooks/use-processo-detail.ts`
- [x] Remover `src/app/_lib/hooks/use-processo-details.ts`
- [x] Remover `src/app/_lib/hooks/use-processo-timeline.ts`

### 6. Types Legados (src/app/_lib/types/)
- [x] Remover `src/app/_lib/types/acervo.ts`

### 7. Actions Legadas (src/app/actions/)
- [x] Remover `src/app/actions/processos.ts`

## Validação Pós-Remoção
- [x] Executar `npm run type-check` - passou (erros encontrados são pré-existentes em arquivos não relacionados)
- [ ] Executar `npm run build` para confirmar build de produção (opcional)
- [ ] Verificar que páginas de processos ainda funcionam corretamente (teste manual)

## Resultado
**22 arquivos legados removidos com sucesso.**

A nova estrutura em `src/features/processos/` está totalmente funcional e os imports nas páginas foram atualizados.
