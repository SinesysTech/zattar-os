// Tipos genéricos para o componente DataTable

import type { ColumnDef } from '@tanstack/react-table';

/**
 * Configuração de coluna customizada para DataTable
 */
export interface DataTableColumn<TData> {
  id: string;
  header: string;
  accessorKey?: keyof TData;
  cell?: (value: unknown, row: TData) => React.ReactNode;
  enableSorting?: boolean;
  enableHiding?: boolean;
}

/**
 * Estado de paginação server-side
 */
export interface ServerPaginationState {
  pageIndex: number;
  pageSize: number;
}

/**
 * Estado de ordenação server-side
 */
export interface ServerSortingState {
  columnId: string | null;
  direction: 'asc' | 'desc' | null;
}

/**
 * Parâmetros de busca e filtros
 */
export interface DataTableFilters {
  [key: string]: string | number | boolean | null | undefined;
}

/**
 * Props do componente DataTable genérico
 */
export interface DataTableProps<TData> {
  // Dados
  data: TData[];
  columns: ColumnDef<TData>[];
  
  // Paginação
  pagination?: {
    pageIndex: number;
    pageSize: number;
    total: number;
    totalPages: number;
    onPageChange: (pageIndex: number) => void;
    onPageSizeChange: (pageSize: number) => void;
  };
  
  // Ordenação
  sorting?: {
    columnId: string | null;
    direction: 'asc' | 'desc' | null;
    onSortingChange: (columnId: string | null, direction: 'asc' | 'desc' | null) => void;
  };
  
  // Estados
  isLoading?: boolean;
  error?: string | null;
  
  // Configurações opcionais
  enableRowSelection?: boolean;
  onRowClick?: (row: TData) => void;
  emptyMessage?: string;
}

