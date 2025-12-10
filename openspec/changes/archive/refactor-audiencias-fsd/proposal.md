# Refatorar Módulo Audiências para Feature-Sliced Design

## Why

O módulo de audiências está atualmente espalhado em múltiplos diretórios (`src/components/modules/audiencias/`, `src/app/_lib/hooks/`, `src/app/_lib/types/`, `src/app/actions/`, `src/app/(dashboard)/audiencias/components/`), dificultando a manutenção e escalabilidade. A migração para Feature-Sliced Design (FSD) centralizará toda a lógica relacionada a audiências em `src/features/audiencias/`, seguindo o padrão já estabelecido em outros módulos como `partes` e `contratos`.

## What Changes

### Estrutura Nova

```
src/features/audiencias/
├── components/
│   ├── audiencia-card.tsx
│   ├── audiencia-detail-sheet.tsx
│   ├── audiencia-form.tsx
│   ├── audiencia-modalidade-badge.tsx
│   ├── audiencia-status-badge.tsx
│   ├── audiencias-calendar-month-view.tsx
│   ├── audiencias-calendar-week-view.tsx
│   ├── audiencias-calendar-year-view.tsx
│   ├── audiencias-content.tsx
│   ├── audiencias-list-view.tsx
│   ├── audiencias-month-day-cell.tsx
│   ├── audiencias-toolbar-filters.tsx
│   ├── audiencias-visualizacao-ano.tsx
│   ├── audiencias-visualizacao-mes.tsx
│   ├── audiencias-visualizacao-semana.tsx
│   ├── audiencia-detalhes-dialog.tsx
│   ├── nova-audiencia-dialog.tsx
│   ├── editar-endereco-dialog.tsx
│   ├── editar-observacoes-dialog.tsx
│   └── index.ts
├── hooks/
│   ├── use-audiencias.ts
│   ├── use-tipos-audiencias.ts
│   └── index.ts
├── actions/
│   ├── audiencias.ts
│   └── index.ts
├── types/
│   ├── index.ts
│   └── (re-exports de @/core/audiencias/domain)
├── lib/
│   └── index.ts
└── index.ts
```

### Arquivos a Remover (após migração)

1. `src/components/modules/audiencias/` - Todo o diretório
2. `src/app/_lib/hooks/use-audiencias.ts`
3. `src/app/_lib/hooks/use-tipos-audiencias.ts`
4. `src/app/_lib/types/audiencias.ts`
5. `src/app/actions/audiencias.ts`
6. `src/app/(dashboard)/audiencias/components/` - Todo o diretório

### Arquivos Mantidos

- `src/core/audiencias/` - Módulo de domínio (repository, service, domain) permanece inalterado
- `backend/audiencias/` - Serviços backend permanecem inalterados
- `src/app/api/audiencias/` - APIs REST permanecem inalteradas
- `src/app/(dashboard)/audiencias/*.tsx` - Páginas de rota (apenas atualizarão imports)

## Impact

### Specs Afetadas
- Nenhuma spec de comportamento é alterada, apenas reorganização de código

### Código Afetado
- `src/app/(dashboard)/audiencias/semana/page.tsx` - Atualizar imports
- `src/app/(dashboard)/audiencias/mes/page.tsx` - Atualizar imports
- `src/app/(dashboard)/audiencias/ano/page.tsx` - Atualizar imports
- `src/app/(dashboard)/audiencias/lista/page.tsx` - Atualizar imports

### Benefícios
- Código centralizado e mais fácil de manter
- Padrão consistente com outros módulos (partes, contratos)
- Melhor organização para escalar funcionalidades futuras
- Imports mais limpos e diretos via barrel exports
