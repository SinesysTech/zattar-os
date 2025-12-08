# ResponsiveFilterPanel

A responsive filter panel component that adapts between desktop and mobile layouts.

## Features

- **Desktop (≥768px)**: Displays filters inline with collapsible groups
- **Mobile (<768px)**: Shows a "Filtros" button that opens a Sheet/Drawer
- **Badge Count**: Displays the number of active filters
- **Clear Filters**: Easy way to clear all selected filters
- **Customizable**: Support for custom filter group rendering

## Usage

### Basic Usage

```tsx
import { ResponsiveFilterPanel } from '@/components/ui/responsive-filter-panel'

const filterGroups = [
  {
    label: 'Status',
    options: [
      { value: 'ativo', label: 'Ativo' },
      { value: 'inativo', label: 'Inativo' },
    ],
  },
  {
    label: 'Tipo',
    options: [
      { value: 'tipo1', label: 'Tipo 1' },
      { value: 'tipo2', label: 'Tipo 2' },
    ],
  },
]

function MyPage() {
  const [selectedFilters, setSelectedFilters] = useState<string[]>([])

  return (
    <ResponsiveFilterPanel
      filterGroups={filterGroups}
      selectedFilters={selectedFilters}
      onFiltersChange={setSelectedFilters}
      title="Filtros"
      description="Filtre os resultados"
    />
  )
}
```

### Integration with TableToolbar

The `ResponsiveFilterPanel` is integrated into `TableToolbar` via the `filterButtonsMode="panel"` prop:

```tsx
<TableToolbar
  searchValue={busca}
  onSearchChange={setBusca}
  filterGroups={filterGroups}
  selectedFilters={selectedFilters}
  onFiltersChange={setSelectedFilters}
  filterButtonsMode="panel"
  filterPanelTitle="Filtros de Processos"
  filterPanelDescription="Filtre processos por TRT, grau, responsável e mais"
/>
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `filterGroups` | `FilterGroup[]` | Yes | Array of filter groups to display |
| `selectedFilters` | `string[]` | Yes | Array of currently selected filter IDs |
| `onFiltersChange` | `(filters: string[]) => void` | Yes | Callback when filters change |
| `title` | `string` | No | Title for the filter panel (default: "Filtros") |
| `description` | `string` | No | Description for the filter panel (mobile only) |
| `className` | `string` | No | Additional CSS classes |
| `renderFilterGroup` | `function` | No | Custom render function for filter groups |

## Types

```typescript
interface FilterGroup {
  label: string
  options: FilterOption[]
}

interface FilterOption {
  value: string
  label: string
  searchText?: string
}
```

## Responsive Behavior

### Desktop (≥768px)
- Filters are displayed inline
- All filter groups are visible
- Clear button appears when filters are selected
- Compact layout suitable for sidebar or panel

### Mobile (<768px)
- Shows a "Filtros" button with badge count
- Clicking opens a Sheet from the left side
- Filters are displayed in a scrollable area
- Clear button in footer when filters are selected
- Sheet can be closed by clicking overlay or close button

## Accessibility

- Keyboard navigation supported
- Screen reader friendly
- ARIA labels for interactive elements
- Focus management in Sheet

## Examples

### With Custom Rendering

```tsx
<ResponsiveFilterPanel
  filterGroups={filterGroups}
  selectedFilters={selectedFilters}
  onFiltersChange={setSelectedFilters}
  renderFilterGroup={(group, selected, onToggle) => (
    <div>
      <h4>{group.label}</h4>
      {group.options.map(option => (
        <CustomFilterOption
          key={option.value}
          option={option}
          selected={selected.includes(option.value)}
          onToggle={() => onToggle(option.value)}
        />
      ))}
    </div>
  )}
/>
```

### In a Listing Page

```tsx
export default function ProcessosPage() {
  const [selectedFilters, setSelectedFilters] = useState<string[]>([])
  const [busca, setBusca] = useState('')

  const filterGroups = useMemo(() => buildProcessosFilterGroups(), [])

  return (
    <div className="space-y-4">
      <TableToolbar
        searchValue={busca}
        onSearchChange={setBusca}
        filterGroups={filterGroups}
        selectedFilters={selectedFilters}
        onFiltersChange={setSelectedFilters}
        filterButtonsMode="panel"
        filterPanelTitle="Filtros de Processos"
      />
      
      <ResponsiveTable
        data={processos}
        columns={columns}
        // ... other props
      />
    </div>
  )
}
```

## Related Components

- `TableToolbar` - Main toolbar component that can use ResponsiveFilterPanel
- `Sheet` - Underlying component for mobile drawer
- `ScrollArea` - Used for scrollable filter content

## Requirements Validation

This component validates:
- **Requirement 12.3**: Filters and search displayed on mobile SHALL be grouped in a collapsible filter panel
- **Property 55**: List filters collapsible - For any filters and search displayed on mobile, they should be grouped in a collapsible filter panel
