'use client';

import * as React from 'react';
import type { Table } from '@tanstack/react-table';
import { DataTableAdvancedToolbar } from '@/components/shared/data-table/data-table-advanced-toolbar';

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  onExport?: (format: 'csv' | 'xlsx' | 'json') => void;
  density?: 'compact' | 'standard' | 'relaxed';
  onDensityChange?: (density: 'compact' | 'standard' | 'relaxed') => void;
  actionSlot?: React.ReactNode;
  searchValue?: string;
  onSearchValueChange?: (value: string) => void;
  filtersSlot?: React.ReactNode;
}

/**
 * DataTableToolbar
 *
 * Toolbar padrão da DataTable (padrão novo), baseada na `DataTableAdvancedToolbar`.
 */
export function DataTableToolbar<TData>(props: DataTableToolbarProps<TData>) {
  return <DataTableAdvancedToolbar {...props} />;
}


