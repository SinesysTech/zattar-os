# Audiencias Filter Bar + Responsavel — Design Spec

**Goal:** Substituir TabPills de status por filter bar no padrao processos, adicionar filtros de Responsavel/TRT/Modalidade, e mostrar responsavel nos cards e detail dialog.

## Architecture

Replicar o padrao `processos-filter-bar.tsx` (componentes internos: `FilterChip`, `FilterDropdownTrigger`) dentro do modulo audiencias como `audiencias-filter-bar.tsx`. Cada filtro e um componente interno isolado. A filter bar recebe `AudienciasFilters` + `onChange` e renderiza todos os filtros numa flex row.

## Components

### 1. NEW: `audiencias-filter-bar.tsx`

Componentes internos (copiados de processos, mesma API):
- `FilterChip` — botao com label, badge count, X para limpar
- `FilterDropdownTrigger` — trigger com chevron/X, ring ao abrir

Filtros:
- **StatusFilter** — single-select dropdown: Marcada, Finalizada, Cancelada (com counts)
- **ResponsavelFilter** — single-select com avatar, Command search, "Sem responsavel" (copiado de processos, labels adaptados: "Minhas audiencias" em vez de "Meus processos")
- **TRTFilter** — multi-select com Command search, checkboxes (identico a processos)
- **ModalidadeFilter** — single-select dropdown: Virtual, Presencial, Hibrida

Interface:
```typescript
export interface AudienciasFilters {
  status: StatusAudiencia | null;
  responsavel: 'meus' | 'sem_responsavel' | number | null;
  trt: string[];
  modalidade: 'virtual' | 'presencial' | 'hibrida' | null;
}

interface AudienciasFilterBarProps {
  filters: AudienciasFilters;
  onChange: (filters: AudienciasFilters) => void;
  usuarios: Usuario[];
  currentUserId: number;
  counts: {
    marcadas: number;
    finalizadas: number;
    canceladas: number;
    semResponsavel: number;
  };
}
```

### 2. MODIFY: `audiencias-client.tsx`

- Remove `TabPills` de status (linhas 155-159, 241)
- Adiciona `AudienciasFilterBar` no lugar
- Adiciona estado `filters` com `useState<AudienciasFilters>`
- Filtragem client-side: aplica status, responsavel, trt, modalidade sobre `allAudiencias`
- Passa `responsavelNomesMap` para `AudienciasSemanaView`
- Passa `usuarios` para o detail dialog (para alterar responsavel)

### 3. MODIFY: `audiencias-semana-view.tsx` (WeekDayCard)

- Props adicionais: `responsavelNomes: Map<number, string>`
- No `WeekDayCard`: mostrar nome do responsavel ou "Sem resp." no footer, ao lado dos badges TRT/Modalidade
- Visual: `text-[9px] text-muted-foreground/55` inline com icone User

### 4. MODIFY: `audiencia-detail-dialog.tsx`

- No bloco de responsavel (linhas 302-320): adicionar botao "Alterar" que abre `AudienciasAlterarResponsavelDialog`
- Passar props necessarias: `audienciaId`, `usuarios`, `onSuccess` (refetch)

## Data Flow

```
page.tsx (SSR: usuarios, audiencias)
  -> AudienciasClient
       -> useState<AudienciasFilters> (local state)
       -> AudienciasFilterBar (controlled: filters + onChange)
       -> client-side filter chain: status -> responsavel -> trt -> modalidade
       -> filtered audiencias -> views
```

## Visual Layout

```
[Header: Audiencias + subtitle + Nova Audiencia btn]
[KPI Strip]
[Insight Banners]
[FilterBar: Status | Responsavel | Tribunal | Modalidade]  [SearchInput] [ViewToggle]
[Content: view selecionada]
```

A filter bar fica na mesma linha que SearchInput e ViewToggle, com `flex-wrap` para mobile.

## Scope Boundaries

- NAO refatora processos (fica como esta)
- NAO refatora expedientes nesta fase (Fase 3 futura)
- NAO cria componentes shared — replica o padrao processos dentro de audiencias
- Filtros sao client-side (os dados ja vem todos do hook `useAudienciasUnified`)
