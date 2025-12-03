'use client';

// Componente de header de coluna com ordenação e filtragem

import * as React from 'react';
import { Column } from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ArrowUpDown, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/app/_lib/utils/utils';

interface SortOption {
  label: string;
  value: string;
}

interface FilterOption {
  label: string;
  value: string | null;
  type?: 'text' | 'select';
}

interface DataTableColumnHeaderWithFilterProps<TData, TValue> {
  column?: Column<TData, TValue>;
  title: string;
  sortOptions?: SortOption[];
  filterOptions?: FilterOption[];
  onSort?: (field: string, direction: 'asc' | 'desc') => void;
  onFilter?: (field: string, value: string | null) => void;
  currentSort?: { field: string; direction: 'asc' | 'desc' } | null;
  currentFilter?: { field: string; value: string | null } | null;
}

export function DataTableColumnHeaderWithFilter<TData, TValue>({
  column,
  title,
  sortOptions = [],
  filterOptions = [],
  onSort,
  onFilter,
  currentSort: _currentSort,
  currentFilter,
}: DataTableColumnHeaderWithFilterProps<TData, TValue>) {
  const [isFilterOpen, setIsFilterOpen] = React.useState(false);

  const hasSortOptions = sortOptions.length > 0;
  const hasFilterOptions = filterOptions.length > 0;
  const hasAnyOptions = hasSortOptions || hasFilterOptions;

  // Se não tem opções, apenas renderiza o título
  if (!hasAnyOptions) {
    return <div className="text-sm font-medium">{title}</div>;
  }

  const isSorted = column?.getIsSorted();
  const isFiltered = currentFilter && filterOptions.some(opt => opt.value === currentFilter.value);

  return (
    <div className="flex items-center space-x-2">
      <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              '-ml-3 h-8 data-[state=open]:bg-accent',
              (isSorted || isFiltered) && 'bg-accent'
            )}
          >
            <span>{title}</span>
            {isSorted === 'desc' ? (
              <ArrowDown className="ml-2 h-4 w-4" />
            ) : isSorted === 'asc' ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : (
              <ArrowUpDown className="ml-2 h-4 w-4" />
            )}
            {isFiltered && <Filter className="ml-2 h-4 w-4" />}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[min(92vw,12.5rem)] p-0" align="start">
          <div className="p-2">
            {hasSortOptions && (
              <>
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                  Ordenar por
                </div>
                {sortOptions.map((option) => (
                  <div key={option.value} className="flex flex-col gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="justify-start"
                      onClick={() => {
                        if (onSort) {
                          onSort(option.value, 'asc');
                        }
                        setIsFilterOpen(false);
                      }}
                    >
                      <ArrowUp className="mr-2 h-4 w-4" />
                      {option.label} (A-Z)
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="justify-start"
                      onClick={() => {
                        if (onSort) {
                          onSort(option.value, 'desc');
                        }
                        setIsFilterOpen(false);
                      }}
                    >
                      <ArrowDown className="mr-2 h-4 w-4" />
                      {option.label} (Z-A)
                    </Button>
                  </div>
                ))}
              </>
            )}

            {hasSortOptions && hasFilterOptions && (
              <div className="my-1">
                <div className="border-t" />
              </div>
            )}

            {hasFilterOptions && (
              <>
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                  Filtrar por
                </div>
                {filterOptions.map((option) => (
                  <Button
                    key={option.value || 'all'}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => {
                      if (onFilter) {
                        onFilter(option.value || '', option.value);
                      }
                      setIsFilterOpen(false);
                    }}
                  >
                    <Filter className="mr-2 h-4 w-4" />
                    {option.label}
                  </Button>
                ))}
              </>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
