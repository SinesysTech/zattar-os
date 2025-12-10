# Tasks: Remover Arquivos Legados do Módulo Processos

## Pré-requisitos
- [x] Validar que nova estrutura funciona corretamente (type-check)
- [x] Confirmar que todos os imports foram atualizados

## Arquivos a Remover

### 1. Core Domain (src/core/processos/)
- [ ] Remover `src/core/processos/domain.ts`
- [ ] Remover `src/core/processos/repository.ts`
- [ ] Remover `src/core/processos/service.ts`
- [ ] Remover `src/core/processos/index.ts`
- [ ] Remover diretório `src/core/processos/` (se vazio)

### 2. Componentes de Página (src/app/(dashboard)/processos/components/)
- [ ] Remover `src/app/(dashboard)/processos/components/grau-badges.tsx`
- [ ] Remover `src/app/(dashboard)/processos/components/processo-header.tsx`
- [ ] Remover `src/app/(dashboard)/processos/components/processos-toolbar-filters.tsx`
- [ ] Remover `src/app/(dashboard)/processos/components/timeline-container.tsx`
- [ ] Remover `src/app/(dashboard)/processos/components/timeline-empty.tsx`
- [ ] Remover `src/app/(dashboard)/processos/components/timeline-error.tsx`
- [ ] Remover `src/app/(dashboard)/processos/components/timeline-item.tsx`
- [ ] Remover `src/app/(dashboard)/processos/components/timeline-loading.tsx`
- [ ] Remover diretório `src/app/(dashboard)/processos/components/` (se vazio)

### 3. Componente de Visualização (src/app/(dashboard)/processos/[id]/)
- [ ] Remover `src/app/(dashboard)/processos/[id]/processo-visualizacao.tsx`

### 4. Componentes Modulares (src/components/modules/processos/)
- [ ] Remover `src/components/modules/processos/processo-detail-sheet.tsx`
- [ ] Remover `src/components/modules/processos/processo-form.tsx`
- [ ] Remover `src/components/modules/processos/processos-empty-state.tsx`
- [ ] Remover diretório `src/components/modules/processos/` (se vazio)

### 5. Hooks Legados (src/app/_lib/hooks/)
- [ ] Remover `src/app/_lib/hooks/use-processos.ts`
- [ ] Remover `src/app/_lib/hooks/use-processo-detail.ts`
- [ ] Remover `src/app/_lib/hooks/use-processo-details.ts`
- [ ] Remover `src/app/_lib/hooks/use-processo-timeline.ts`

### 6. Types Legados (src/app/_lib/types/)
- [ ] Remover `src/app/_lib/types/acervo.ts`

### 7. Actions Legadas (src/app/actions/)
- [ ] Remover `src/app/actions/processos.ts`

## Validação Pós-Remoção
- [ ] Executar `npm run type-check` para confirmar que nada quebrou
- [ ] Executar `npm run build` para confirmar build de produção
- [ ] Verificar que páginas de processos ainda funcionam corretamente

## Notas
- Todos os arquivos listados são órfãos (não mais referenciados por código ativo)
- A nova estrutura em `src/features/processos/` contém toda funcionalidade migrada
- APIs em `src/app/api/acervo/` permanecem inalteradas (não fazem parte desta migração)
