# Visualizações Temporais - System Design

Este documento descreve os padrões e componentes para criar visualizações temporais (calendários, timelines, etc.) no sistema.

## Componentes Disponíveis

### 1. TemporalViewShell

Container unificado para visualizações temporais. Combina alternância de visualização, navegação e filtros em um layout consistente.

**Localização:** `src/components/shared/temporal-view-shell.tsx`

**Props:**
| Prop | Tipo | Descrição |
|------|------|-----------|
| `viewSwitcher` | `ReactNode` | Componente ViewSwitcher |
| `dateNavigation` | `ReactNode?` | Componente DateNavigation (opcional para lista) |
| `search` | `ReactNode?` | Componente de busca |
| `filters` | `ReactNode?` | Componente de filtros |
| `extraActions` | `ReactNode?` | Botões extras |
| `children` | `ReactNode` | Conteúdo principal |
| `variant` | `'default' \| 'compact'` | Variante de layout |

**Exemplo:**
```tsx
import { TemporalViewShell, ViewSwitcher, DateNavigation } from '@/components/shared';

<TemporalViewShell
  viewSwitcher={
    <ViewSwitcher value={view} onValueChange={setView} />
  }
  dateNavigation={
    <DateNavigation
      onPrevious={handlePrevious}
      onNext={handleNext}
      onToday={handleToday}
      displayText={displayText}
    />
  }
  filters={<MyFilters />}
>
  {/* Conteúdo da visualização */}
</TemporalViewShell>
```

### 2. ViewSwitcher

Componente para alternar entre visualizações (semana, mês, ano, lista).

**Localização:** `src/components/shared/view-switcher.tsx`

**Props:**
| Prop | Tipo | Descrição |
|------|------|-----------|
| `value` | `ViewType` | Visualização atual |
| `onValueChange` | `(value: ViewType) => void` | Callback de mudança |
| `views` | `ViewOption[]?` | Visualizações disponíveis |
| `showIcons` | `boolean?` | Mostrar ícones |

**Tipos:**
```typescript
type ViewType = 'semana' | 'mes' | 'ano' | 'lista';

interface ViewOption {
  value: ViewType;
  label: string;
  icon?: ReactNode;
}
```

### 3. DateNavigation

Componente para navegação temporal (anterior, próximo, hoje).

**Localização:** `src/components/shared/date-navigation.tsx`

**Props:**
| Prop | Tipo | Descrição |
|------|------|-----------|
| `onPrevious` | `() => void` | Callback anterior |
| `onNext` | `() => void` | Callback próximo |
| `onToday` | `() => void` | Callback hoje |
| `displayText` | `string` | Texto do período |
| `mode` | `NavigationMode?` | Modo de navegação |

### 4. WeekDaysCarousel

Carrossel interativo de dias da semana.

**Localização:** `src/components/shared/week-days-carousel.tsx`

**Props:**
| Prop | Tipo | Descrição |
|------|------|-----------|
| `currentDate` | `Date` | Data de referência |
| `selectedDate` | `Date` | Data selecionada |
| `onDateSelect` | `(date: Date) => void` | Callback de seleção |
| `weekStartsOn` | `0 \| 1` | Início da semana (0=Dom, 1=Seg) |
| `renderBadge` | `(date: Date) => ReactNode?` | Render badge por dia |
| `variant` | `'default' \| 'compact' \| 'minimal'` | Variante de estilo |

**Exemplo com badges:**
```tsx
const renderBadge = (date: Date) => {
  const count = getEventCount(date);
  if (count === 0) return null;
  return <Badge variant="secondary">{count}</Badge>;
};

<WeekDaysCarousel
  currentDate={currentDate}
  selectedDate={selectedDate}
  onDateSelect={setSelectedDate}
  weekStartsOn={1}
  renderBadge={renderBadge}
/>
```

## Padrões de Uso

### Estrutura de Módulo com Calendário

Todo módulo que implementa visualizações de calendário deve seguir esta estrutura:

```
src/features/{modulo}/
├── components/
│   ├── {modulo}-content.tsx        # Componente principal com TemporalViewShell
│   ├── {modulo}-calendar-week-view.tsx
│   ├── {modulo}-calendar-month-view.tsx
│   ├── {modulo}-calendar-year-view.tsx
│   └── {modulo}-list-wrapper.tsx
```

### Exemplo de Implementação

```tsx
// features/audiencias/components/audiencias-content.tsx
'use client';

import {
  TemporalViewShell,
  TemporalViewContent,
  TemporalViewLoading,
  TemporalViewError,
  ViewSwitcher,
  DateNavigation,
  type ViewType,
} from '@/components/shared';

export function AudienciasContent({ visualizacao: initialView }: Props) {
  const [visualizacao, setVisualizacao] = useState<ViewType>(initialView);
  const [currentDate, setCurrentDate] = useState(new Date());

  // ... lógica de navegação e dados

  return (
    <TemporalViewShell
      viewSwitcher={
        <ViewSwitcher value={visualizacao} onValueChange={setVisualizacao} />
      }
      dateNavigation={
        visualizacao !== 'lista' ? (
          <DateNavigation {...navigationProps} />
        ) : undefined
      }
    >
      {visualizacao === 'lista' ? (
        <ListWrapper />
      ) : isLoading ? (
        <TemporalViewLoading />
      ) : error ? (
        <TemporalViewError message={error} />
      ) : (
        <TemporalViewContent>
          {visualizacao === 'semana' && <WeekView />}
          {visualizacao === 'mes' && <MonthView />}
          {visualizacao === 'ano' && <YearView />}
        </TemporalViewContent>
      )}
    </TemporalViewShell>
  );
}
```

## Diferenças entre Módulos

### Audiências
- Trabalham com **horários específicos** (timeline)
- Visualização de semana mostra grade de horas
- Cards posicionados por horário de início/fim

### Expedientes
- Trabalham com **prazos** (datas sem horário)
- Visualização de semana mostra lista por dia
- Foco em contagem e status de expedientes

## Componentes Auxiliares

### TemporalViewContent
Wrapper para conteúdo com scroll e padding.

```tsx
<TemporalViewContent padding>
  {/* Conteúdo */}
</TemporalViewContent>
```

### TemporalViewHeader
Header customizado dentro do conteúdo.

```tsx
<TemporalViewHeader
  title="Expedientes de Segunda, 15 de Janeiro"
  rightElement={<Badge>{total}</Badge>}
/>
```

### TemporalViewLoading / TemporalViewError
Estados de loading e erro padronizados.

```tsx
{isLoading && <TemporalViewLoading message="Carregando..." />}
{error && <TemporalViewError message={error} onRetry={refetch} />}
```

## Acessibilidade

- Todos os componentes suportam navegação por teclado
- WeekDaysCarousel usa `role="listbox"` e `aria-selected`
- DateNavigation inclui `aria-label` nos botões
- ViewSwitcher usa tabs com roles apropriados

## Responsividade

- TemporalViewShell tem layouts diferentes para mobile e desktop
- WeekDaysCarousel é scrollável em telas pequenas
- ViewSwitcher pode esconder labels em mobile (apenas ícones)
- DateNavigation tem variante compacta para espaços reduzidos

## Hooks Auxiliares

### useWeekNavigation
Hook para gerenciar estado de navegação semanal.

```tsx
const {
  currentDate,
  setCurrentDate,
  selectedDate,
  setSelectedDate,
  weekStart,
  weekEnd,
  goToToday,
} = useWeekNavigation(initialDate, weekStartsOn);
```

## Checklist de Implementação

Ao criar um novo módulo com calendário:

- [ ] Criar `{modulo}Content` usando `TemporalViewShell`
- [ ] Implementar visualizações de semana, mês, ano e lista
- [ ] Integrar `WeekDaysCarousel` na visualização de semana
- [ ] Usar `DateNavigation` para navegação temporal
- [ ] Implementar estados de loading e erro
- [ ] Testar responsividade em mobile
- [ ] Garantir acessibilidade via teclado
